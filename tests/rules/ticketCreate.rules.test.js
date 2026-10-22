import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { beforeAll, afterAll, beforeEach, describe, it } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { buildCreateTicketPayload } from "../../src/services/ticketPayload.js";

// Integration tests that run the ACTUAL createTicket() payload builder
// (src/services/ticketPayload.js) against the real firestore.rules via the
// emulator. This is the regression guard for the ticket-creation bug where the
// create payload carried assignment/resolution keys that the rules reject.
//
// Requires the Firestore emulator — runs via `npm run test:rules`.

const __dirname = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8");

function hostPort() {
  const env = process.env.FIRESTORE_EMULATOR_HOST;
  if (env) {
    const [host, port] = env.split(":");
    return { host, port: Number(port) };
  }
  return { host: "127.0.0.1", port: 8089 };
}

let testEnv;

const EMP = "emp-casey";
const actor = {
  uid: EMP,
  displayName: "Casey Employee",
  email: "casey@fictional.example",
};
const input = {
  recordType: "Incident",
  shortDescription: "Laptop won't connect to Wi-Fi",
  description: "Fails to join the office SSID after a reboot.",
  impact: "Medium",
  urgency: "High", // Medium impact + High urgency => P2
  category: "Network",
};

function empDb(uid = EMP, role = "employee") {
  return testEnv.authenticatedContext(uid, { role }).firestore();
}

beforeAll(async () => {
  const { host, port } = hostPort();
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

describe("createTicket() payload vs firestore.rules", () => {
  it("accepts the exact payload the app builds (the bug-fix happy path)", async () => {
    const payload = buildCreateTicketPayload(input, actor);
    const ref = doc(empDb(), "tickets/t-create-1");
    await assertSucceeds(setDoc(ref, payload));

    // Confirm it persisted with a server-derived priority and no forbidden keys.
    await testEnv.withSecurityRulesDisabled(async (c) => {
      const snap = await getDoc(doc(c.firestore(), "tickets/t-create-1"));
      const data = snap.data();
      // P2 derived from Medium/High.
      if (data.priority !== "P2") throw new Error(`expected P2, got ${data.priority}`);
      for (const k of [
        "assignedTechUid",
        "resolvedAt",
        "closedAt",
        "resolutionSummary",
        "rootCause",
      ]) {
        if (k in data) throw new Error(`payload must not contain ${k} on create`);
      }
    });
  });

  it("rejects the OLD payload shape that included assignment/resolution keys", async () => {
    // Reproduces the original bug: these keys are forbidden on create.
    const bad = {
      ...buildCreateTicketPayload(input, actor),
      assignedTechUid: null,
      resolvedAt: null,
      closedAt: null,
      resolutionSummary: null,
      rootCause: null,
    };
    await assertFails(setDoc(doc(empDb(), "tickets/t-create-2"), bad));
  });

  it("rejects a forged priority that does not match impact/urgency", async () => {
    const forged = { ...buildCreateTicketPayload(input, actor), priority: "P1" };
    await assertFails(setDoc(doc(empDb(), "tickets/t-create-3"), forged));
  });

  it("rejects opening a ticket on behalf of another user", async () => {
    const payload = buildCreateTicketPayload(input, { ...actor, uid: "someone-else" });
    await assertFails(setDoc(doc(empDb(), "tickets/t-create-4"), payload));
  });

  it("rejects a ticket that does not start in New", async () => {
    const payload = { ...buildCreateTicketPayload(input, actor), status: "In Progress" };
    await assertFails(setDoc(doc(empDb(), "tickets/t-create-5"), payload));
  });

  it("rejects an unauthenticated create", async () => {
    const payload = buildCreateTicketPayload(input, actor);
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(anon, "tickets/t-create-6"), payload));
  });

  it("lets each demo role that can open a ticket do so for themselves", async () => {
    // Employee and every technician tier can open their own ticket.
    for (const [uid, role] of [
      ["emp-1", "employee"],
      ["l1-1", "l1"],
      ["l2-1", "l2"],
      ["l3-1", "l3"],
      ["admin-1", "administrator"],
    ]) {
      const payload = buildCreateTicketPayload(input, { ...actor, uid });
      await assertSucceeds(setDoc(doc(empDb(uid, role), `tickets/own-${uid}`), payload));
    }
  });
});
