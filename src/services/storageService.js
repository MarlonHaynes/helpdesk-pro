import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/firebase";

export async function uploadTicketScreenshot(file, folder = "ticket-screenshots") {
  const safeFileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const storageRef = ref(storage, `${folder}/${safeFileName}`);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return {
    downloadURL,
    fullPath: storageRef.fullPath,
  };
}