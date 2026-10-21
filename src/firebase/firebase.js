import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Firebase web config comes from VITE_ env vars. These values are NOT secrets
// (they identify the project and are shipped to every browser by design); real
// security is enforced by Firestore/Storage rules + custom-claim roles.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// When VITE_USE_EMULATORS=true, connect to the local Firebase Emulator Suite so
// development and tests run entirely offline against your real rules without
// touching any live project.
const useEmulators =
  import.meta.env.VITE_USE_EMULATORS === "true" ||
  import.meta.env.VITE_USE_EMULATORS === true;

if (useEmulators) {
  const host = import.meta.env.VITE_EMULATOR_HOST || "127.0.0.1";
  try {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8089);
    connectStorageEmulator(storage, host, 9199);
    console.info("[firebase] Connected to local emulators on", host);
  } catch (err) {
    console.warn("[firebase] Emulator connection skipped:", err?.message);
  }
}

export { app, auth, db, storage, useEmulators };
