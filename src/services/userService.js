import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { STAFF_ROLES } from "../auth/roles";

const usersCol = collection(db, "users");

export async function getStaffUsers() {
  // Firestore `in` supports up to 30 values; STAFF_ROLES is small.
  const snap = await getDocs(query(usersCol, where("role", "in", STAFF_ROLES)));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function getUser(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}
