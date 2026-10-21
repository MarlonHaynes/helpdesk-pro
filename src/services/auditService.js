import { collection, addDoc, getDocs, query, orderBy, where, limit, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

const auditCol = collection(db, "auditLogs");

let correlationCounter = 0;
function correlationId() {
  correlationCounter += 1;
  return `${Date.now().toString(36)}-${correlationCounter}`;
}

/**
 * Append an immutable audit record for a privileged action. The acting uid is
 * stamped from the actor and MUST equal request.auth.uid (enforced by rules),
 * so a client cannot forge who performed an action.
 */
export async function logAudit(actor, entry) {
  await addDoc(auditCol, {
    actorUid: actor.uid,
    actorName: actor.displayName ?? actor.email ?? actor.uid,
    actorRole: actor.role ?? null,
    eventType: entry.eventType,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    previousValue: entry.previousValue ?? null,
    newValue: entry.newValue ?? null,
    reason: entry.reason ?? null,
    correlationId: entry.correlationId ?? correlationId(),
    at: serverTimestamp(),
  });
}

export async function getAuditLogs({ max = 100 } = {}) {
  const snap = await getDocs(query(auditCol, orderBy("at", "desc"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAuditLogsForTarget(targetType, targetId, { max = 50 } = {}) {
  const snap = await getDocs(
    query(
      auditCol,
      where("targetType", "==", targetType),
      where("targetId", "==", targetId),
      orderBy("at", "desc"),
      limit(max)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
