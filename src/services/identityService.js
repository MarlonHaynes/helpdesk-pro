import {
  collection, getDocs, getDoc, doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { logAudit } from "./auditService";

// Microsoft 365 / Entra ID Administration LAB — all SIMULATED. These functions
// only read/write the local `simulatedDirectoryUsers` collection; they never
// contact Microsoft Graph or any real identity provider. Operations require
// L2+ (enforced by firestore.rules) and are recorded in the audit log.

const dirCol = collection(db, "simulatedDirectoryUsers");

export async function getDirectoryUsers() {
  const snap = await getDocs(dirCol);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getDirectoryUser(id) {
  const snap = await getDoc(doc(db, "simulatedDirectoryUsers", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function applyAndAudit(user, updates, actor, eventType, newValue) {
  await updateDoc(doc(db, "simulatedDirectoryUsers", user.id), {
    ...updates,
    lastModifiedAt: serverTimestamp(),
  });
  await logAudit(actor, {
    eventType: `identity.${eventType}`,
    targetType: "directoryUser",
    targetId: user.id,
    newValue: newValue ?? user.displayName,
  });
}

export const IDENTITY_OPERATIONS = [
  { key: "unlock", label: "Unlock account", applies: (u) => u.locked },
  { key: "resetPassword", label: "Reset password", applies: () => true },
  { key: "resetMfa", label: "Reset MFA", applies: (u) => u.mfaStatus === "Enabled" },
  { key: "enableMfa", label: "Enable MFA", applies: (u) => u.mfaStatus !== "Enabled" },
  { key: "disable", label: "Disable account", applies: (u) => u.accountStatus === "Active" },
  { key: "enable", label: "Enable account", applies: (u) => u.accountStatus !== "Active" },
];

export async function performOperation(user, opKey, actor) {
  switch (opKey) {
    case "unlock":
      return applyAndAudit(user, { locked: false }, actor, "account_unlocked");
    case "resetPassword":
      return applyAndAudit(user, { passwordResetAt: serverTimestamp() }, actor, "password_reset");
    case "resetMfa":
      return applyAndAudit(user, { mfaStatus: "Reset — re-enrollment required" }, actor, "mfa_reset");
    case "enableMfa":
      return applyAndAudit(user, { mfaStatus: "Enabled" }, actor, "mfa_enabled");
    case "disable":
      return applyAndAudit(user, { accountStatus: "Disabled" }, actor, "account_disabled");
    case "enable":
      return applyAndAudit(user, { accountStatus: "Active" }, actor, "account_enabled");
    default:
      throw new Error(`Unknown operation: ${opKey}`);
  }
}
