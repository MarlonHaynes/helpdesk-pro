import {
  collection, getDocs, getDoc, doc, setDoc, updateDoc, query, where, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { logAudit } from "./auditService";

const assetsCol = collection(db, "assets");

export async function getAssets() {
  const snap = await getDocs(assetsCol);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAsset(id) {
  const snap = await getDoc(doc(db, "assets", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Tickets linked to an asset (sorted client-side to avoid an index). */
export async function getAssetIncidents(assetId) {
  const snap = await getDocs(query(collection(db, "tickets"), where("relatedAssetId", "==", assetId)));
  const tickets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return tickets.sort((a, b) => {
    const am = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bm = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bm - am;
  });
}

export async function upsertAsset(id, data, actor) {
  const ref = doc(db, "assets", id);
  const exists = (await getDoc(ref)).exists();
  if (exists) {
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  } else {
    await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  await logAudit(actor, {
    eventType: exists ? "asset.updated" : "asset.created",
    targetType: "asset", targetId: id, newValue: data.assetTag ?? id,
  });
}

export async function assignAsset(asset, assignee, actor) {
  await updateDoc(doc(db, "assets", asset.id), {
    assignedUid: assignee?.uid ?? null,
    assignedName: assignee?.displayName ?? null,
    department: assignee?.department ?? asset.department,
    lifecycleStatus: assignee ? "In Use" : "In Stock",
    updatedAt: serverTimestamp(),
  });
  await logAudit(actor, {
    eventType: assignee ? "asset.assigned" : "asset.returned",
    targetType: "asset", targetId: asset.id,
    previousValue: asset.assignedName ?? null,
    newValue: assignee?.displayName ?? null,
  });
}
