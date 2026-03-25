import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase/firebase";

// Login admin
export async function loginAdmin(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

// Logout admin
export async function logoutAdmin() {
  await signOut(auth);
}

// Listen to auth state changes
export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}