import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const ticketsCollection = collection(db, "tickets");

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function mapTicketSnapshot(snapshot) {
  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data(),
  }));
}

function getCreatedAtMillis(ticket) {
  const createdAt = ticket?.createdAt;

  if (!createdAt) {
    return 0;
  }

  if (typeof createdAt.toMillis === "function") {
    return createdAt.toMillis();
  }

  const asDate = new Date(createdAt);
  const time = asDate.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortByCreatedAtDesc(tickets) {
  return [...tickets].sort((a, b) => getCreatedAtMillis(b) - getCreatedAtMillis(a));
}

async function queryTicketsByField(fieldName, value) {
  const q = query(ticketsCollection, where(fieldName, "==", value));
  const snapshot = await getDocs(q);
  return mapTicketSnapshot(snapshot);
}

export async function createTicket(ticketData) {
  const requesterEmail = String(
    ticketData.requesterEmail ?? ticketData.email ?? ""
  ).trim();

  const requesterEmailNormalized = normalizeEmail(requesterEmail);

  const docRef = await addDoc(ticketsCollection, {
    ...ticketData,
    requesterEmail,
    requesterEmailNormalized,
    email: requesterEmail,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
  };
}

export async function getAllTickets() {
  const q = query(ticketsCollection, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return mapTicketSnapshot(snapshot);
}

export async function getTicketById(ticketId) {
  const docRef = doc(db, "tickets", ticketId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getTicketsByEmail(email) {
  const rawTrimmedEmail = String(email ?? "").trim();
  const normalizedEmail = normalizeEmail(rawTrimmedEmail);

  if (!rawTrimmedEmail) {
    return [];
  }

  const dedupedTickets = new Map();

  const mergeTickets = (tickets) => {
    tickets.forEach((ticket) => {
      dedupedTickets.set(ticket.id, ticket);
    });
  };

  try {
    const normalizedMatches = await queryTicketsByField(
      "requesterEmailNormalized",
      normalizedEmail
    );
    mergeTickets(normalizedMatches);

    // Backward compatibility for older ticket records without requesterEmailNormalized.
    if (!dedupedTickets.size) {
      const fallbackQueries = [
        ["requesterEmail", rawTrimmedEmail],
        ["requesterEmail", normalizedEmail],
        ["email", rawTrimmedEmail],
        ["email", normalizedEmail],
        ["createdBy.email", rawTrimmedEmail],
        ["createdBy.email", normalizedEmail],
      ];

      const seenFallbackKeys = new Set();

      for (const [fieldName, fieldValue] of fallbackQueries) {
        const dedupeKey = `${fieldName}:${fieldValue}`;

        if (seenFallbackKeys.has(dedupeKey) || !fieldValue) {
          continue;
        }

        seenFallbackKeys.add(dedupeKey);
        const fallbackMatches = await queryTicketsByField(fieldName, fieldValue);
        mergeTickets(fallbackMatches);
      }
    }

    return sortByCreatedAtDesc(Array.from(dedupedTickets.values()));
  } catch (error) {
    console.error("Firestore getTicketsByEmail failed", {
      rawTrimmedEmail,
      normalizedEmail,
      errorCode: error?.code,
      errorMessage: error?.message,
      error,
    });
    throw error;
  }
}

export async function updateTicket(ticketId, updates) {
  const docRef = doc(db, "tickets", ticketId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function addTicketNote(ticketId, noteData) {
  const docRef = doc(db, "tickets", ticketId);

  await updateDoc(docRef, {
    notes: arrayUnion(noteData),
    updatedAt: serverTimestamp(),
  });
}

export async function getTicketStats() {
  const tickets = await getAllTickets();

  return {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "Open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "In Progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
    highPriority: tickets.filter((ticket) => ticket.priority === "High").length,
  };
}