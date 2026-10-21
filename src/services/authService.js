import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { ROLES } from "../auth/roles";

/** Sign in with email/password. Returns the Firebase user. */
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

/**
 * Read the signed-in user's role from their custom claims. Falls back to
 * employee (least privilege) if no role claim is present.
 * @param {import("firebase/auth").User} user
 * @param {boolean} forceRefresh - refresh the token (use after claims change)
 */
export async function getUserRole(user, forceRefresh = false) {
  if (!user) return null;
  try {
    const token = await getIdTokenResult(user, forceRefresh);
    const role = token.claims?.role;
    return role || ROLES.EMPLOYEE;
  } catch {
    return ROLES.EMPLOYEE;
  }
}

export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
