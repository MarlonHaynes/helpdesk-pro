import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { beforeAll, afterAll, beforeEach, describe, it } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

// Security regression tests for firestore.rules. Requires the Firestore
// emulator (run via `npm run test:rules`, which wraps firebase emulators:exec).

const __dirname = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8");

let testEnv;

// When run via `firebase emulators:exec`, the CLI exports FIRESTORE_EMULATOR_HOST
// as "host:port". Parse it so the test follows whatever port firebase.json uses.
function emulatorHostPort() {
  const env = process.env.FIRESTORE_EMULATOR_HOST;
  if (env) {
    const [host, port] = env.split(":");
    return { host, port: Number(port) };
  }
  return { host: "127.0.0.1", port: 8089 };
}

function ctx(uid, role) {
  return testEnv.authenticatedContext(uid, role ? { role } : {}).firestore();
}
function anon() {
  return testEnv.unauthenticatedContext().firestore();
}

const validTicket = (requesterUid) => ({
  requesterUid,
  recordType: "Incident",
  status: "New",
  escalationLevel: 0,
  impact: "Low",
  urgency: "Low",
  priority: "P4", // matches derivePriority(Low,Low)
  shortDescription: "Cannot print",
  createdAt: serverTimestamp(),
});

beforeAll(async () => {
  const { host, port } = emulatorHostPort();
  testEnv = await initializeTestEnvironment({
    projectId: "helpdesk-pro-demo",
    firestore: { rules, host, port },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("tickets — creation", () => {
  it("lets an employee open their own ticket with a server-consistent priority", async () => {
    const db = ctx("emp1", "employee");
    await assertSucceeds(setDoc(doc(db, "tickets/t1"), validTicket("emp1")));
  });

  it("rejects a forged priority (P1 for Low/Low)", async () => {
    const db = ctx("emp1", "employee");
    await assertFails(
      setDoc(doc(db, "tickets/t1"), { ...validTicket("emp1"), priority: "P1" })
    );
  });

  it("rejects creating a ticket on behalf of another user", async () => {
    const db = ctx("emp1", "employee");
    await assertFails(setDoc(doc(db, "tickets/t1"), validTicket("someoneElse")));
  });

  it("rejects a ticket that starts in a non-New status", async () => {
    const db = ctx("emp1", "employee");
    await assertFails(
      setDoc(doc(db, "tickets/t1"), { ...validTicket("emp1"), status: "Resolved" })
    );
  });

  it("blocks an unauthenticated create", async () => {
    await assertFails(setDoc(doc(anon(), "tickets/t1"), validTicket("emp1")));
  });
});

describe("tickets — read authorization", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "tickets/t1"), {
        ...validTicket("emp1"),
        createdAt: new Date(),
      });
    });
  });

  it("lets the owner read their ticket", async () => {
    await assertSucceeds(getDoc(doc(ctx("emp1", "employee"), "tickets/t1")));
  });

  it("blocks a different employee from reading someone else's ticket", async () => {
    await assertFails(getDoc(doc(ctx("emp2", "employee"), "tickets/t1")));
  });

  it("lets any technician read any ticket", async () => {
    await assertSucceeds(getDoc(doc(ctx("tech1", "l1"), "tickets/t1")));
  });
});

describe("tickets — status transitions", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "tickets/t1"), {
        ...validTicket("emp1"),
        status: "New",
        createdAt: new Date(),
      });
    });
  });

  it("lets a technician move New -> Assigned", async () => {
    const db = ctx("tech1", "l1");
    await assertSucceeds(
      updateDoc(doc(db, "tickets/t1"), { status: "Assigned", updatedAt: serverTimestamp() })
    );
  });

  it("rejects an illegal New -> Closed jump even by a technician", async () => {
    const db = ctx("tech1", "l1");
    await assertFails(
      updateDoc(doc(db, "tickets/t1"), { status: "Closed", updatedAt: serverTimestamp() })
    );
  });

  it("blocks an employee from changing status / priority arbitrarily", async () => {
    const db = ctx("emp1", "employee");
    await assertFails(
      updateDoc(doc(db, "tickets/t1"), { status: "Assigned", updatedAt: serverTimestamp() })
    );
    await assertFails(
      updateDoc(doc(db, "tickets/t1"), { priority: "P1", updatedAt: serverTimestamp() })
    );
  });
});

describe("auditLogs — append-only", () => {
  it("lets a technician append an audit entry recording their own uid", async () => {
    const db = ctx("tech1", "l2");
    await assertSucceeds(
      setDoc(doc(db, "auditLogs/a1"), {
        actorUid: "tech1",
        eventType: "ticket.status_changed",
        at: serverTimestamp(),
      })
    );
  });

  it("rejects spoofing a different actorUid", async () => {
    const db = ctx("tech1", "l2");
    await assertFails(
      setDoc(doc(db, "auditLogs/a1"), {
        actorUid: "someoneElse",
        eventType: "x",
        at: serverTimestamp(),
      })
    );
  });

  it("forbids editing or deleting audit entries", async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "auditLogs/a1"), {
        actorUid: "tech1",
        eventType: "x",
        at: new Date(),
      });
    });
    const admin = ctx("admin1", "administrator");
    await assertFails(updateDoc(doc(admin, "auditLogs/a1"), { eventType: "tampered" }));
    await assertFails(deleteDoc(doc(admin, "auditLogs/a1")));
  });

  it("blocks employees from reading audit logs", async () => {
    await assertFails(getDoc(doc(ctx("emp1", "employee"), "auditLogs/a1")));
  });
});

describe("assets — role gating", () => {
  it("lets a technician read assets but not write them", async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "assets/pc1"), { assetTag: "PC-1" });
    });
    await assertSucceeds(getDoc(doc(ctx("tech1", "l1"), "assets/pc1")));
    await assertFails(
      updateDoc(doc(ctx("tech1", "l1"), "assets/pc1"), { location: "HQ" })
    );
  });

  it("lets L3 manage assets", async () => {
    await assertSucceeds(
      setDoc(doc(ctx("spec1", "l3"), "assets/pc2"), { assetTag: "PC-2" })
    );
  });

  it("blocks employees from reading the asset inventory", async () => {
    await assertFails(getDoc(doc(ctx("emp1", "employee"), "assets/pc1")));
  });
});

describe("knowledgeArticles", () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "knowledgeArticles/kb-pub"), { title: "P", visibility: "public", status: "published" });
      await setDoc(doc(c.firestore(), "knowledgeArticles/kb-int"), { title: "I", visibility: "internal", status: "published" });
    });
  });

  it("lets an employee read a published public article but not an internal one", async () => {
    await assertSucceeds(getDoc(doc(ctx("emp1", "employee"), "knowledgeArticles/kb-pub")));
    await assertFails(getDoc(doc(ctx("emp1", "employee"), "knowledgeArticles/kb-int")));
  });

  it("lets a technician read internal articles", async () => {
    await assertSucceeds(getDoc(doc(ctx("tech1", "l1"), "knowledgeArticles/kb-int")));
  });

  it("blocks L1 from authoring but allows L2+", async () => {
    await assertFails(setDoc(doc(ctx("t", "l1"), "knowledgeArticles/kb-new"), { title: "x", visibility: "public", status: "draft" }));
    await assertSucceeds(setDoc(doc(ctx("t", "l2"), "knowledgeArticles/kb-new"), { title: "x", visibility: "public", status: "draft" }));
  });

  it("lets any signed-in reader submit feedback keyed by their uid, append-only", async () => {
    await assertSucceeds(
      setDoc(doc(ctx("emp1", "employee"), "knowledgeArticles/kb-pub/feedback/f1"), { uid: "emp1", helpful: true })
    );
    await assertFails(
      setDoc(doc(ctx("emp1", "employee"), "knowledgeArticles/kb-pub/feedback/f2"), { uid: "someoneElse", helpful: true })
    );
  });
});

describe("config collections — admin-only writes", () => {
  it("lets signed-in users read SLA policies", async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "slaPolicies/default"), { name: "Std" });
    });
    await assertSucceeds(getDoc(doc(ctx("emp1", "employee"), "slaPolicies/default")));
  });

  it("blocks non-admins from writing SLA policies", async () => {
    await assertFails(
      setDoc(doc(ctx("tech1", "l3"), "slaPolicies/default"), { name: "Hacked" })
    );
  });

  it("lets admins write SLA policies", async () => {
    await assertSucceeds(
      setDoc(doc(ctx("admin1", "administrator"), "slaPolicies/default"), { name: "Std" })
    );
  });
});
