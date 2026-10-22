import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

// Sanitize a user-supplied filename into a storage-safe, collision-resistant
// object name. We never trust the original name for the path.
function safeName(fileName) {
  const cleaned = String(fileName || "file")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${Date.now()}-${cleaned || "file"}`;
}

// Upload an attachment for a specific ticket. Attachments are stored under
// tickets/{ticketId}/... so Storage security rules can authorize access against
// the ticket's requester/technician ownership (see storage.rules). `ticketId`
// MUST be the Firestore ticket document ID.
export async function uploadTicketAttachment(ticketId, file) {
  if (!ticketId) {
    throw new Error("uploadTicketAttachment requires a ticketId");
  }
  const storageRef = ref(storage, `tickets/${ticketId}/${safeName(file.name)}`);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return {
    downloadURL,
    fullPath: storageRef.fullPath,
  };
}

// Backwards-compatible alias for older call sites. Requires a ticketId so the
// upload lands under the owner-scoped path; the flat `ticket-screenshots`
// folder is now staff-only and no longer used for new uploads.
export async function uploadTicketScreenshot(file, ticketId) {
  return uploadTicketAttachment(ticketId, file);
}
