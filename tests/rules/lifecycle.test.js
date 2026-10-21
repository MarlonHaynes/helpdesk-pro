import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import {
  doc, setDoc, updateDoc, getDoc, collection, addDoc, getDocs, serverTimestamp,
} from "firebase/firestore";

// End-to-end incident lifecycle through the REAL security rules: employee opens
// a ticket, L1 triages/assigns/escalates, L2 resolves, employee confirms — with
// the immutable event trail and audit log written along the way. This exercises
// the rules + data model together for a full happy-path journey.

const __dirname = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8");

function hostPort() {
  const env = process.env.FIRESTORE_EMULATOR_HOST;
  if (env) { const [h, p] = env.split(":"); return { host: h, port: Number(p) }; }
  return { host: "127.0.0.1", port: 8089 };
}

let testEnv;
const EMP = "emp-dana";
const L1 = "tech-jordan";
const L2 = "tech-priya";

beforeAll(async () => {
  const { host, port } = hostPort();
  testEnv = await initializeTestEnvironment({
    projectId: "helpdesk-pro-demo",
    firestore: { rules, host, port },
  });
});
afterAll(async () => { await testEnv?.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

function db(uid, role) {
  return testEnv.authenticatedContext(uid, { role }).firestore();
}

describe("incident lifecycle (rules + schema, end to end)", () => {
  it("runs the full happy path", async () => {
    const empDb = db(EMP, "employee");
    const l1Db = db(L1, "l1");
    const l2Db = db(L2, "l2");
    const ref = (d) => doc(d, "tickets/INC-1");
    const events = (d) => collection(d, "tickets/INC-1/events");
    const audit = (d) => collection(d, "auditLogs");

    // 1. Employee opens the ticket (P2 = High impact / Medium urgency).
    await assertSucceeds(setDoc(ref(empDb), {
      ticketNumber: "INC202603-1", recordType: "Incident", requesterUid: EMP,
      status: "New", escalationLevel: 0, impact: "High", urgency: "Medium",
      priority: "P2", shortDescription: "VPN down", createdAt: serverTimestamp(),
    }));
    await assertSucceeds(addDoc(events(empDb), { actorUid: EMP, eventType: "ticket.created", summary: "created", at: serverTimestamp() }));

    // 2. L1 assigns -> Assigned, records first response, writes audit.
    await assertSucceeds(updateDoc(ref(l1Db), { status: "Assigned", assignedTechUid: L1, updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref(l1Db), { status: "In Progress", updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref(l1Db), { firstResponseAt: serverTimestamp(), updatedAt: serverTimestamp() }));
    await assertSucceeds(addDoc(audit(l1Db), { actorUid: L1, eventType: "ticket.assigned", targetType: "ticket", targetId: "INC-1", at: serverTimestamp() }));

    // 3. L1 escalates -> Escalated to L2 group.
    await assertSucceeds(updateDoc(ref(l1Db), { status: "Escalated", supportGroup: "Technical Support L2", escalationLevel: 1, updatedAt: serverTimestamp() }));

    // 4. L2 resolves with documentation (In Progress -> Resolved).
    await assertSucceeds(updateDoc(ref(l2Db), { status: "In Progress", updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref(l2Db), {
      status: "Resolved", resolvedAt: serverTimestamp(),
      resolutionCode: "Fixed — Configuration", rootCause: "UDP block", resolutionSummary: "Switched to TCP fallback",
      updatedAt: serverTimestamp(),
    }));

    // 5. Employee confirms resolution -> Closed (requester-allowed fields only).
    await assertSucceeds(updateDoc(ref(empDb), { status: "Closed", requesterConfirmed: true, updatedAt: serverTimestamp() }));

    // Final state + trail assertions.
    let finalSnap;
    await testEnv.withSecurityRulesDisabled(async (c) => {
      const s = await getDoc(doc(c.firestore(), "tickets/INC-1"));
      const ev = await getDocs(collection(c.firestore(), "tickets/INC-1/events"));
      const au = await getDocs(collection(c.firestore(), "auditLogs"));
      finalSnap = { data: s.data(), events: ev.size, audit: au.size };
    });
    expect(finalSnap.data.status).toBe("Closed");
    expect(finalSnap.data.requesterConfirmed).toBe(true);
    expect(finalSnap.data.escalationLevel).toBe(1);
    expect(finalSnap.events).toBeGreaterThanOrEqual(1);
    expect(finalSnap.audit).toBeGreaterThanOrEqual(1);
  });

  it("rejects the employee trying to jump the queue mid-lifecycle", async () => {
    await testEnv.withSecurityRulesDisabled(async (c) => {
      await setDoc(doc(c.firestore(), "tickets/INC-2"), {
        requesterUid: EMP, status: "In Progress", impact: "Low", urgency: "Low",
        priority: "P4", createdAt: new Date(),
      });
    });
    const empDb = db(EMP, "employee");
    // Employee cannot self-resolve or self-reassign.
    await assertFails(updateDoc(doc(empDb, "tickets/INC-2"), { status: "Resolved", updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(empDb, "tickets/INC-2"), { assignedTechUid: EMP, updatedAt: serverTimestamp() }));
  });
});
