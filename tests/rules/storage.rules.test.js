import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { beforeAll, afterAll, beforeEach, describe, it } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getBytes } from "firebase/storage";

// Security regression tests for storage.rules. Ticket attachments must follow
// ticket ownership + technician permissions, enforced by cross-service Firestore
// lookups inside the Storage rules (NOT just the client UI).
//
// Requires BOTH the Firestore and Storage emulators, so this runs via
// `npm run test:rules`, which wraps `firebase emulators:exec --only
// firestore,storage`.

const __dirname = dirname(fileURLToPath(import.meta.url));
const firestoreRules = readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8");
const storageRules = readFileSync(resolve(__dirname, "../../storage.rules"), "utf8");

function parseHostPort(envVar, fallbackPort) {
  const env = process.env[envVar];
  if (env) {
    const [host, port] = env.replace(/^https?:\/\//, "").split(":");
    return { host, port: Number(port) };
  }
  return { host: "127.0.0.1", port: fallbackPort };
}

let testEnv;

// Small in-memory file used for uploads. image/png satisfies validAttachment().
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const uploadMeta = { contentType: "image/png" };

const OWNER = "emp-owner";
const OTHER = "emp-other";

function storageFor(uid, role) {
  return testEnv.authenticatedContext(uid, role ? { role } : {}).storage();
}

// Seed a ticket document owned by OWNER so the Storage rules have something to
// read for their ownership check.
async function seedTicket() {
  await testEnv.withSecurityRulesDisabled(async (c) => {
    await setDoc(doc(c.firestore(), "tickets/TCK-1"), {
      requesterUid: OWNER,
      recordType: "Incident",
      status: "New",
      priority: "P4",
      shortDescription: "Attachment test",
      createdAt: new Date(),
    });
  });
}

beforeAll(async () => {
  const fs = parseHostPort("FIRESTORE_EMULATOR_HOST", 8089);
  const st = parseHostPort("FIREBASE_STORAGE_EMULATOR_HOST", 9199);
  testEnv = await initializeTestEnvironment({
    projectId: "helpdesk-pro-demo",
    firestore: { rules: firestoreRules, host: fs.host, port: fs.port },
    storage: { rules: storageRules, host: st.host, port: st.port },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
  await seedTicket();
});

describe("ticket attachments — uploads", () => {
  it("lets the ticket owner upload an attachment to their own ticket", async () => {
    const st = storageFor(OWNER, "employee");
    await assertSucceeds(
      uploadBytes(ref(st, "tickets/TCK-1/evidence.png"), PNG, uploadMeta)
    );
  });

  it("lets a technician upload to any ticket", async () => {
    const st = storageFor("tech1", "l1");
    await assertSucceeds(
      uploadBytes(ref(st, "tickets/TCK-1/working-file.png"), PNG, uploadMeta)
    );
  });

  it("blocks a different requester from uploading to someone else's ticket", async () => {
    const st = storageFor(OTHER, "employee");
    await assertFails(
      uploadBytes(ref(st, "tickets/TCK-1/malicious.png"), PNG, uploadMeta)
    );
  });

  it("blocks an unauthenticated upload", async () => {
    const st = testEnv.unauthenticatedContext().storage();
    await assertFails(
      uploadBytes(ref(st, "tickets/TCK-1/anon.png"), PNG, uploadMeta)
    );
  });

  it("rejects a disallowed content type even from the owner", async () => {
    const st = storageFor(OWNER, "employee");
    await assertFails(
      uploadBytes(ref(st, "tickets/TCK-1/script.exe"), PNG, {
        contentType: "application/x-msdownload",
      })
    );
  });

  it("rejects an oversized attachment (> 10 MB)", async () => {
    const st = storageFor(OWNER, "employee");
    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    await assertFails(
      uploadBytes(ref(st, "tickets/TCK-1/huge.png"), big, uploadMeta)
    );
  });
});

describe("ticket attachments — reads", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await uploadBytes(
        ref(c.storage(), "tickets/TCK-1/evidence.png"),
        PNG,
        uploadMeta
      );
    });
  });

  it("lets the ticket owner read their own attachment", async () => {
    const st = storageFor(OWNER, "employee");
    await assertSucceeds(getBytes(ref(st, "tickets/TCK-1/evidence.png")));
  });

  it("lets a technician read any ticket's attachment", async () => {
    const st = storageFor("tech1", "l2");
    await assertSucceeds(getBytes(ref(st, "tickets/TCK-1/evidence.png")));
  });

  it("blocks a different requester from reading someone else's attachment", async () => {
    const st = storageFor(OTHER, "employee");
    await assertFails(getBytes(ref(st, "tickets/TCK-1/evidence.png")));
  });

  it("blocks an unauthenticated read", async () => {
    const st = testEnv.unauthenticatedContext().storage();
    await assertFails(getBytes(ref(st, "tickets/TCK-1/evidence.png")));
  });
});

describe("ticket attachments — deletes", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await uploadBytes(
        ref(c.storage(), "tickets/TCK-1/evidence.png"),
        PNG,
        uploadMeta
      );
    });
  });

  it("blocks the owner from deleting attachments (no evidence destruction)", async () => {
    const st = storageFor(OWNER, "employee");
    const { deleteObject } = await import("firebase/storage");
    await assertFails(deleteObject(ref(st, "tickets/TCK-1/evidence.png")));
  });

  it("lets staff delete attachments", async () => {
    const st = storageFor("admin1", "administrator");
    const { deleteObject } = await import("firebase/storage");
    await assertSucceeds(deleteObject(ref(st, "tickets/TCK-1/evidence.png")));
  });
});

describe("legacy ticket-screenshots path is staff-only", () => {
  it("blocks an employee from reading legacy flat screenshots", async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await uploadBytes(
        ref(c.storage(), "ticket-screenshots/old.png"),
        PNG,
        uploadMeta
      );
    });
    await assertFails(
      getBytes(ref(storageFor("emp1", "employee"), "ticket-screenshots/old.png"))
    );
    await assertSucceeds(
      getBytes(ref(storageFor("tech1", "l1"), "ticket-screenshots/old.png"))
    );
  });
});

describe("default deny", () => {
  it("blocks reads/writes outside the known attachment paths", async () => {
    const st = storageFor("admin1", "administrator");
    await assertFails(uploadBytes(ref(st, "random/secret.png"), PNG, uploadMeta));
  });
});
