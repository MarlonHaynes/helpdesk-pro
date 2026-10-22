import { serverTimestamp } from "firebase/firestore";
import { derivePriority } from "../domain/itsm";
import { computeDeadlines, DEFAULT_SLA_POLICY } from "../domain/sla";

// Payload construction for new tickets, kept free of any Firebase *app* wiring
// so it can be exercised directly by the security-rules integration tests
// against the emulator. `serverTimestamp()` is a standalone sentinel and needs
// no initialized app.

export function nextTicketNumber() {
  // Human-friendly incident number. Uniqueness for the demo is provided by the
  // time component + random suffix; the Firestore doc id is the true key.
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INC${stamp}-${rand}`;
}

/**
 * Build the Firestore document for a newly created ticket. Priority is DERIVED
 * from impact/urgency (never trusted from the requester) and matches what
 * firestore.rules recomputes.
 *
 * Assignment/resolution fields (assignedTechUid, resolvedAt, closedAt,
 * resolutionSummary, rootCause) are intentionally omitted: firestore.rules
 * rejects a create whose keys include any of them, and they are populated later
 * by staff during assignment/resolution.
 */
export function buildCreateTicketPayload(input, actor) {
  const impact = input.impact ?? "Low";
  const urgency = input.urgency ?? "Low";
  const priority = derivePriority(impact, urgency);

  // Client estimate of deadlines; createdAt is a placeholder replaced by the
  // server timestamp. Re-derivation on read is the source of truth.
  const estDeadlines = computeDeadlines(new Date(), priority, DEFAULT_SLA_POLICY);

  return {
    ticketNumber: nextTicketNumber(),
    recordType: input.recordType ?? "Incident",
    shortDescription: input.shortDescription ?? "",
    description: input.description ?? "",
    requesterUid: actor.uid,
    requesterName: input.requesterName ?? actor.displayName ?? "",
    requesterEmail: actor.email ?? "",
    department: input.department ?? "",
    contact: input.contact ?? "",
    serviceAffected: input.serviceAffected ?? "",
    category: input.category ?? "Other",
    subcategory: input.subcategory ?? "",
    impact,
    urgency,
    priority,
    supportGroup: input.supportGroup ?? "Service Desk L1",
    assignedTechName: null,
    status: "New",
    escalationLevel: 0,
    firstResponseAt: null,
    resolutionCode: null,
    relatedAssetId: input.relatedAssetId ?? null,
    linkedArticleIds: [],
    requesterConfirmed: false,
    slaResponseDueAt: estDeadlines.responseDueAt,
    slaResolutionDueAt: estDeadlines.resolutionDueAt,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}
