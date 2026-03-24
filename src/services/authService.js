import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/firebase";

export async function loginAdmin(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logoutAdmin() {
  await signOut(auth);
}

export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}