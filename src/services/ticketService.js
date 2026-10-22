import {
  collection,
  collectionGroup,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit as qlimit,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { derivePriority, canTransition } from "../domain/itsm";
import { computeDeadlines, DEFAULT_SLA_POLICY } from "../domain/sla";
import { logAudit } from "./auditService";
import { notify } from "./notificationService";
import { buildCreateTicketPayload } from "./ticketPayload";

const ticketsCol = collection(db, "tickets");

function mapDocs(snapshot) {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Create a ticket. Priority is DERIVED from impact/urgency (never taken from
 * the requester directly) and must match what firestore.rules recomputes. SLA
 * deadlines are stamped for indexing but are always re-derived on read from the
 * rule-validated priority + server createdAt, so a tampered deadline cannot
 * change the displayed SLA. The payload shape lives in ticketPayload.js so the
 * security-rules tests can exercise the exact structure.
 */
export async function createTicket(input, actor) {
  const payload = buildCreateTicketPayload(input, actor);

  const ref = await addDoc(ticketsCol, payload);
  await addEvent(ref.id, actor, {
    eventType: "ticket.created",
    summary: `Ticket ${payload.ticketNumber} created (${payload.priority})`,
  });
  return { id: ref.id, ticketNumber: payload.ticketNumber };
}

export async function getTicketById(id) {
  const snap = await getDoc(doc(db, "tickets", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllTickets() {
  const snap = await getDocs(query(ticketsCol, orderBy("createdAt", "desc")));
  return mapDocs(snap);
}

export async function getTicketsForRequester(uid) {
  const snap = await getDocs(
    query(ticketsCol, where("requesterUid", "==", uid), orderBy("createdAt", "desc"))
  );
  return mapDocs(snap);
}

export async function getTicketsAssignedTo(uid) {
  const snap = await getDocs(
    query(ticketsCol, where("assignedTechUid", "==", uid), orderBy("createdAt", "desc"))
  );
  return mapDocs(snap);
}

export async function getTicketsByGroup(group) {
  const snap = await getDocs(
    query(ticketsCol, where("supportGroup", "==", group), orderBy("createdAt", "desc"))
  );
  return mapDocs(snap);
}

/**
 * Apply a status transition with validation + auditing. Throws on an illegal
 * transition (the rules would also reject it, but we fail fast client-side).
 */
export async function transitionStatus(ticket, toStatus, actor, extra = {}) {
  if (!canTransition(ticket.status, toStatus)) {
    throw new Error(`Illegal transition: ${ticket.status} → ${toStatus}`);
  }
  const updates = { status: toStatus, updatedAt: serverTimestamp(), ...extra };

  if (toStatus === "Resolved" && !ticket.resolvedAt) {
    updates.resolvedAt = serverTimestamp();
  }
  if (toStatus === "Closed" && !ticket.closedAt) {
    updates.closedAt = serverTimestamp();
  }
  if (toStatus === "Reopened") {
    updates.resolvedAt = null;
    updates.requesterConfirmed = false;
  }

  await updateDoc(doc(db, "tickets", ticket.id), updates);
  await addEvent(ticket.id, actor, {
    eventType: "ticket.status_changed",
    summary: `Status ${ticket.status} → ${toStatus}`,
    previous: ticket.status,
    next: toStatus,
    reason: extra.reason ?? null,
  });
  await logAudit(actor, {
    eventType: "ticket.status_changed",
    targetType: "ticket",
    targetId: ticket.id,
    previousValue: ticket.status,
    newValue: toStatus,
    reason: extra.reason ?? null,
  });
  if (toStatus === "Resolved") {
    await notify(ticket.requesterUid, {
      type: "resolution",
      message: `${ticket.ticketNumber} was resolved — please confirm or reopen.`,
      link: `/app/tickets/${ticket.id}`,
    });
  }
}

export async function assignTicket(ticket, tech, actor) {
  await updateDoc(doc(db, "tickets", ticket.id), {
    assignedTechUid: tech.uid,
    assignedTechName: tech.displayName ?? tech.email ?? tech.uid,
    status: ticket.status === "New" ? "Assigned" : ticket.status,
    updatedAt: serverTimestamp(),
  });
  await addEvent(ticket.id, actor, {
    eventType: "ticket.assigned",
    summary: `Assigned to ${tech.displayName ?? tech.email}`,
  });
  await logAudit(actor, {
    eventType: "ticket.assigned",
    targetType: "ticket",
    targetId: ticket.id,
    newValue: tech.uid,
  });
  await notify(tech.uid, {
    type: "assignment",
    message: `You were assigned ${ticket.ticketNumber}: ${ticket.shortDescription}`,
    link: `/app/tickets/${ticket.id}`,
  });
}

export async function recordFirstResponse(ticket, actor) {
  if (ticket.firstResponseAt) return;
  await updateDoc(doc(db, "tickets", ticket.id), {
    firstResponseAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addEvent(ticket.id, actor, {
    eventType: "ticket.first_response",
    summary: "First response recorded",
  });
}

export async function escalateTicket(ticket, { toGroup, toLevel, handoff }, actor) {
  await updateDoc(doc(db, "tickets", ticket.id), {
    status: "Escalated",
    supportGroup: toGroup,
    escalationLevel: toLevel ?? (ticket.escalationLevel ?? 0) + 1,
    updatedAt: serverTimestamp(),
  });
  await addEvent(ticket.id, actor, {
    eventType: "ticket.escalated",
    summary: `Escalated to ${toGroup}`,
    details: handoff ?? null,
  });
  await logAudit(actor, {
    eventType: "ticket.escalated",
    targetType: "ticket",
    targetId: ticket.id,
    previousValue: ticket.supportGroup,
    newValue: toGroup,
  });
}

export async function setPriorityFields(ticket, { impact, urgency }, actor) {
  const priority = derivePriority(impact, urgency);
  const deadlines = computeDeadlines(new Date(), priority, DEFAULT_SLA_POLICY);
  await updateDoc(doc(db, "tickets", ticket.id), {
    impact,
    urgency,
    priority,
    slaResponseDueAt: deadlines.responseDueAt,
    slaResolutionDueAt: deadlines.resolutionDueAt,
    updatedAt: serverTimestamp(),
  });
  await addEvent(ticket.id, actor, {
    eventType: "ticket.priority_changed",
    summary: `Priority set to ${priority} (impact ${impact}/urgency ${urgency})`,
    previous: ticket.priority,
    next: priority,
  });
  await logAudit(actor, {
    eventType: "ticket.priority_changed",
    targetType: "ticket",
    targetId: ticket.id,
    previousValue: ticket.priority,
    newValue: priority,
  });
}

// ---- events (immutable per-ticket timeline) ----
export async function addEvent(ticketId, actor, event) {
  const eventsCol = collection(db, "tickets", ticketId, "events");
  await addDoc(eventsCol, {
    actorUid: actor.uid,
    actorName: actor.displayName ?? actor.email ?? actor.uid,
    actorRole: actor.role ?? null,
    at: serverTimestamp(),
    ...event,
  });
}

export async function getTicketEvents(ticketId) {
  const eventsCol = collection(db, "tickets", ticketId, "events");
  const snap = await getDocs(query(eventsCol, orderBy("at", "asc")));
  return mapDocs(snap);
}

// ---- notes (internal vs requester-facing) ----
export async function addNote(ticketId, actor, { body, visibility }) {
  const notesCol = collection(db, "tickets", ticketId, "notes");
  const ref = await addDoc(notesCol, {
    authorUid: actor.uid,
    authorName: actor.displayName ?? actor.email ?? actor.uid,
    authorRole: actor.role ?? null,
    body,
    visibility: visibility === "requester" ? "requester" : "internal",
    at: serverTimestamp(),
  });
  await addEvent(ticketId, actor, {
    eventType: "ticket.note_added",
    summary: visibility === "requester" ? "Requester-facing update added" : "Internal note added",
  });
  return ref.id;
}

export async function getTicketNotes(ticketId) {
  const notesCol = collection(db, "tickets", ticketId, "notes");
  const snap = await getDocs(query(notesCol, orderBy("at", "asc")));
  return mapDocs(snap);
}

// ---- requester actions ----
// These only touch the fields firestore.rules allows a requester to change and
// deliberately do NOT write to auditLogs (which is staff-only). They record a
// ticket event, which the requester is permitted to append.
export async function confirmResolution(ticket, actor) {
  await updateDoc(doc(db, "tickets", ticket.id), {
    status: "Closed",
    requesterConfirmed: true,
    updatedAt: serverTimestamp(),
  });
  if (actor?.uid) {
    await addEvent(ticket.id, actor, {
      eventType: "ticket.requester_confirmed",
      summary: "Requester confirmed resolution — ticket closed",
    });
  }
}

export async function reopenByRequester(ticket, actor) {
  await updateDoc(doc(db, "tickets", ticket.id), {
    status: "Reopened",
    requesterConfirmed: false,
    updatedAt: serverTimestamp(),
  });
  if (actor?.uid) {
    await addEvent(ticket.id, actor, {
      eventType: "ticket.reopened",
      summary: "Requester reopened the ticket",
    });
  }
}

export { collectionGroup, qlimit, setDoc };
