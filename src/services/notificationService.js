import {
  collection, getDocs, doc, addDoc, updateDoc, query, where, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const notifCol = collection(db, "notifications");

/**
 * Raise an in-app notification for a recipient. Creation requires staff (rules);
 * callers are staff ticket actions (assignment/escalation/resolution), so this
 * degrades gracefully — a failure never blocks the underlying workflow.
 */
export async function notify(recipientUid, { type, message, link }) {
  if (!recipientUid) return;
  try {
    await addDoc(notifCol, {
      recipientUid,
      type: type ?? "info",
      message,
      link: link ?? null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // In-app notifications are best-effort; never fail the business action.
    console.warn("notify failed", e?.message);
  }
}

export async function getMyNotifications(uid, { max = 20 } = {}) {
  const snap = await getDocs(
    query(notifCol, where("recipientUid", "==", uid), orderBy("createdAt", "desc"), limit(max))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markRead(id) {
  try {
    await updateDoc(doc(db, "notifications", id), { read: true, readAt: serverTimestamp() });
  } catch (e) {
    console.warn("markRead failed", e?.message);
  }
}
