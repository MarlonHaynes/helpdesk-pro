import {
  collection, getDocs, getDoc, doc, addDoc, updateDoc, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { logAudit } from "./auditService";

const approvalsCol = collection(db, "approvals");

export const APPROVAL_TYPES = [
  "Software installation",
  "Access request",
  "License assignment",
  "Elevated permissions",
  "Equipment request",
];

export async function createApproval(input, actor) {
  const ref = await addDoc(approvalsCol, {
    type: input.type,
    description: input.description ?? "",
    requesterUid: actor.uid,
    requesterName: actor.displayName ?? actor.email ?? actor.uid,
    approverUid: null,
    approverName: null,
    status: "Pending",
    decisionNotes: null,
    relatedTicketId: input.relatedTicketId ?? null,
    createdAt: serverTimestamp(),
    decidedAt: null,
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id };
}

export async function getAllApprovals() {
  const snap = await getDocs(query(approvalsCol, orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getMyApprovals(uid) {
  const snap = await getDocs(query(approvalsCol, where("requesterUid", "==", uid)));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
}

export async function decideApproval(approval, decision, actor, notes) {
  await updateDoc(doc(db, "approvals", approval.id), {
    status: decision, // "Approved" | "Rejected"
    decisionNotes: notes ?? null,
    approverUid: actor.uid,
    approverName: actor.displayName ?? actor.email ?? actor.uid,
    decidedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logAudit(actor, {
    eventType: "approval.decided",
    targetType: "approval",
    targetId: approval.id,
    previousValue: "Pending",
    newValue: decision,
  });
}

export async function getApproval(id) {
  const snap = await getDoc(doc(db, "approvals", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
