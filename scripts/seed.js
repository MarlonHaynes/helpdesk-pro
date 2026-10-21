// =============================================================================
// HelpDesk Pro — demo seeding + custom-claims script (Firebase Admin SDK)
// =============================================================================
// Creates the demo role accounts, sets their role via CUSTOM CLAIMS (the server
// side of the RBAC model — never set from the browser), and seeds internally
// consistent fictional demo data. Idempotent: re-running upserts by known id
// and never duplicates records.
//
// Usage:
//   Emulator (default, recommended, $0, touches nothing live):
//     npm run seed              # when emulators are already running, OR
//     firebase emulators:exec --only auth,firestore "npm run seed"
//
//   Live project (only when YOU choose to): set a service account and project:
//     GOOGLE_APPLICATION_CREDENTIALS=./sa.json FIREBASE_PROJECT=your-proj \
//       node scripts/seed.js --live
// =============================================================================

import admin from "firebase-admin";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../src/auth/demoAccounts.js";
import { DEFAULT_SLA_POLICY } from "../src/domain/sla.js";
import {
  DEPARTMENTS,
  SUPPORT_TEAMS,
  makeEmployees,
  makeAssets,
  makeTickets,
  KNOWLEDGE_ARTICLES,
  makeDirectoryUsers,
} from "./demoData.js";

const LIVE = process.argv.includes("--live");
const PROJECT_ID = process.env.FIREBASE_PROJECT || "helpdesk-pro-demo";
const usingEmulator =
  !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!usingEmulator && !LIVE) {
  // Default to emulator hosts so an accidental run cannot touch a live project.
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8089";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
  console.log("No live flag set — targeting local emulators:", {
    firestore: process.env.FIRESTORE_EMULATOR_HOST,
    auth: process.env.FIREBASE_AUTH_EMULATOR_HOST,
  });
}

if (LIVE && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Refusing to seed a LIVE project without GOOGLE_APPLICATION_CREDENTIALS.");
  process.exit(1);
}

admin.initializeApp({ projectId: PROJECT_ID });
const auth = admin.auth();
const db = admin.firestore();

const now = new Date();

async function upsertAuthUser({ uid, email, displayName, role }) {
  try {
    await auth.getUser(uid);
    await auth.updateUser(uid, { email, displayName, password: DEMO_PASSWORD });
  } catch {
    await auth.createUser({ uid, email, displayName, password: DEMO_PASSWORD, emailVerified: true });
  }
  await auth.setCustomUserClaims(uid, { role });
}

async function commitInBatches(items, writeFn) {
  // Firestore batches are limited to 500 ops; chunk to be safe.
  let batch = db.batch();
  let n = 0;
  for (const item of items) {
    writeFn(batch, item);
    n += 1;
    if (n % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
}

function buildEvents(ticketId, t, requester) {
  // Reconstruct a plausible, ordered event trail from the ticket's meta.
  const ev = [];
  const push = (at, actorName, actorRole, eventType, summary, extra = {}) =>
    ev.push({ at, actorUid: `seed`, actorName, actorRole, eventType, summary, ...extra });

  push(t.meta.createdAt, requester.displayName, "employee", "ticket.created",
    `Ticket created (${t.data.priority})`);
  if (t.meta.assignee) {
    push(new Date(t.meta.createdAt.getTime() + 5 * 60000), t.meta.assignee.displayName, t.meta.assignee.role,
      "ticket.assigned", `Assigned to ${t.meta.assignee.displayName}`);
  }
  if (t.meta.firstResponseAt) {
    push(t.meta.firstResponseAt, t.meta.assignee?.displayName ?? "Service Desk", "l1",
      "ticket.first_response", "First response recorded");
  }
  if (t.meta.status === "Escalated") {
    push(new Date(t.meta.firstResponseAt.getTime() + 30 * 60000), t.meta.assignee?.displayName ?? "L1", "l1",
      "ticket.escalated", `Escalated to ${t.meta.supportGroup}`,
      { details: "Initial triage completed; advanced investigation required." });
  }
  if (t.meta.resolvedAt) {
    push(t.meta.resolvedAt, t.meta.assignee?.displayName ?? "Technician", "l2",
      "ticket.status_changed", `Status In Progress → Resolved`, { previous: "In Progress", next: "Resolved" });
  }
  if (t.meta.closedAt) {
    push(t.meta.closedAt, requester.displayName, "employee",
      "ticket.requester_confirmed", "Requester confirmed resolution — ticket closed");
  }
  if (t.meta.reopened) {
    push(new Date(t.meta.firstResponseAt.getTime() + 60 * 60000), requester.displayName, "employee",
      "ticket.reopened", "Requester reopened the ticket");
  }
  return ev;
}

async function main() {
  console.log(`\nSeeding project "${PROJECT_ID}" (${usingEmulator || !LIVE ? "EMULATOR" : "LIVE"})…\n`);

  // 1) Demo role accounts (auth + claims + user docs)
  const demoUsers = DEMO_ACCOUNTS.map((a) => ({ ...a, uid: `demo-${a.role}` }));
  for (const u of demoUsers) {
    await upsertAuthUser(u);
    await db.collection("users").doc(u.uid).set(
      {
        displayName: u.displayName,
        email: u.email,
        role: u.role,
        department: u.department,
        supportGroups: u.supportGroups,
        disabled: false,
        isDemo: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
  console.log(`✓ ${demoUsers.length} demo role accounts + custom claims`);

  // 2) Fictional employees (data-only user docs) + the demo employee
  const employees = makeEmployees(30);
  const demoEmployee = demoUsers.find((u) => u.role === "employee");
  await commitInBatches(employees, (batch, e) => {
    batch.set(db.collection("users").doc(e.uid), {
      displayName: e.displayName, email: e.email, role: "employee",
      department: e.department, disabled: false, isDemo: true,
    });
  });
  console.log(`✓ ${employees.length} fictional employees`);

  // Requester pool weights the demo employee so "My Tickets" is populated.
  const requesterPool = [...employees, demoEmployee, demoEmployee, demoEmployee, demoEmployee, demoEmployee, demoEmployee];
  const staff = demoUsers.filter((u) => ["l1", "l2", "l3"].includes(u.role));

  // 3) Config
  await db.collection("slaPolicies").doc("default").set(DEFAULT_SLA_POLICY);
  await db.collection("applicationSettings").doc("global").set({
    activeSlaPolicyId: "default",
    demoMode: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await commitInBatches(DEPARTMENTS, (batch, name) => {
    batch.set(db.collection("departments").doc(name.toLowerCase().replace(/\s+/g, "-")), { name });
  });
  await commitInBatches(SUPPORT_TEAMS, (batch, t) => {
    batch.set(db.collection("supportTeams").doc(t.id), t);
  });
  console.log("✓ SLA policy, settings, departments, support teams");

  // 4) Assets
  const assets = makeAssets(32, employees);
  await commitInBatches(assets, (batch, a) => {
    const { id, ...data } = a;
    batch.set(db.collection("assets").doc(id), data);
  });
  console.log(`✓ ${assets.length} assets`);

  // 5) Knowledge articles
  await commitInBatches(KNOWLEDGE_ARTICLES, (batch, k) => {
    batch.set(db.collection("knowledgeArticles").doc(k.id), {
      title: k.title,
      category: k.category,
      tags: k.tags,
      visibility: k.visibility,
      status: "published",
      author: "Avery Chen",
      body: `# ${k.title}\n\nThis knowledge article documents the standard procedure. Steps a technician can perform are listed first; operations requiring administrator permission or an approved security process are clearly marked.\n\n1. Confirm the reported symptoms and scope.\n2. Run the relevant diagnostics.\n3. Apply the documented fix.\n4. Verify and document the resolution.\n\n_Simulated demonstration content._`,
      lastReviewed: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(),
      version: 1,
      helpful: Math.floor(Math.random() * 40),
      notHelpful: Math.floor(Math.random() * 6),
    });
  });
  console.log(`✓ ${KNOWLEDGE_ARTICLES.length} knowledge articles`);

  // 6) Simulated directory (M365 / Entra lab)
  const directory = makeDirectoryUsers(employees);
  await commitInBatches(directory, (batch, d) => {
    const { id, ...data } = d;
    batch.set(db.collection("simulatedDirectoryUsers").doc(id), data);
  });
  console.log(`✓ ${directory.length} simulated directory users`);

  // 7) Tickets + event subcollections
  const tickets = makeTickets(70, requesterPool, staff, assets, now);
  let eventCount = 0;
  await commitInBatches(tickets, (batch, t) => {
    const ref = db.collection("tickets").doc(t.id);
    batch.set(ref, t.data);
    const requester = { displayName: t.data.requesterName };
    for (const ev of buildEvents(t.id, t, requester)) {
      const evRef = ref.collection("events").doc();
      batch.set(evRef, ev);
      eventCount += 1;
    }
  });
  console.log(`✓ ${tickets.length} tickets with ${eventCount} timeline events`);

  console.log("\nSeed complete.\n");
  console.log("Demo sign-in (shared password: " + DEMO_PASSWORD + "):");
  for (const u of demoUsers) console.log(`  ${u.role.padEnd(14)} ${u.email}`);
  console.log("");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
