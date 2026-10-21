# HelpDesk Pro — Enterprise IT Service Desk (Demo)

A portfolio demonstration of an enterprise-style IT Service Management (ITSM)
platform: role-based service desk operations (L1/L2/L3 + employee + admin),
ITIL-aligned incident management, SLA tracking, an immutable audit trail, and
analytics — built on React 19, Vite, and Firebase, with security enforced by
Cloud Firestore rules and custom-claim roles.

> **Demo / Simulated Environment.** All employees, tickets, devices, directory
> accounts, and "Microsoft 365 / Entra ID" operations are **fictional and
> simulated** (`company.example`). The application's own ticketing, auth,
> authorization, persistence, SLA math, and audit records are **real and
> working**. This project does not connect to any real corporate system.

---

## Status (honest)

This is an in-progress enterprise upgrade delivered in phases. What is
**implemented, working, and tested** today:

- ✅ **Security foundation** — Firestore + Storage security rules, custom-claim
  RBAC (5 roles), server-validated priority & status transitions, append-only
  audit log. Proven by an emulator-backed rules test suite.
- ✅ **ITIL ticketing** — Incident / Service Request / Problem / Change record
  types, 9-state lifecycle with enforced transitions, impact×urgency→priority
  matrix, assignment, escalation with support-group routing, resolution, requester
  confirm/reopen, per-ticket immutable event timeline, internal vs requester-facing
  notes.
- ✅ **SLA engine** — configurable policies, business-hours + holiday math,
  response/resolution deadlines, breach & near-breach, recomputed on read (no
  dependency on a browser staying open).
- ✅ **Dashboard & analytics** — totals, open/escalated/overdue, SLA compliance,
  MTTR, first-response, time-to-close, reopen rate, by-priority/category/group,
  aging buckets — all computed from persisted data.
- ✅ **Audit log viewer** (admin).
- ✅ **Demo access** — 5 seeded role accounts with one-click sign-in; idempotent
  seeding of ~30 employees, 32 assets, 15 KB articles, 30 directory users, and
  70 tickets with full event trails.

Planned in later phases (scaffolding/data model already present; dedicated UIs
not yet built — **not** claimed as finished): Troubleshooting Workbench,
Knowledge Base browsing UI, Asset Management UI, Microsoft 365 / Entra ID
Administration Lab UI, approval-workflow UI, and the extended reporting/CSV
export screens. See [FEATURES.md](FEATURES.md) for the full matrix.

---

## Tech stack

React 19 · Vite · React Router 7 · Firebase Auth · Cloud Firestore · Firebase
Storage · Vitest · `@firebase/rules-unit-testing` · Firebase Emulator Suite.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the data model and
[SECURITY.md](SECURITY.md) for the authorization model.

---

## Quick start (local, $0, emulator-first)

Requires Node 18+ and a JDK (for the Firestore emulator).

```bash
npm install

# Terminal 1 — start the Firebase Emulator Suite (auth, firestore, storage)
npm run emulators

# Terminal 2 — seed fictional demo data + create demo role accounts
FIRESTORE_EMULATOR_HOST=127.0.0.1:8089 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  npm run seed

# Terminal 3 — run the app against the emulators
npm run dev           # uses .env.local (VITE_USE_EMULATORS=true)
```

Then open the app, go to **Sign In**, and click any role button.

> Windows PowerShell: set the two env vars with `$env:FIRESTORE_EMULATOR_HOST=...`
> before `npm run seed`, or run `firebase emulators:exec --only auth,firestore "npm run seed"`.

### Demo accounts

Seeded fictional accounts (shared demo password `Demo123!`). Each is limited to
its role by security rules — no account grants real admin access to anything
beyond demo data.

| Role | Email |
|---|---|
| Administrator | `admin@helpdesk.demo` |
| L1 Technician | `l1@helpdesk.demo` |
| L2 Technician | `l2@helpdesk.demo` |
| L3 Specialist | `l3@helpdesk.demo` |
| Employee | `employee@helpdesk.demo` |

There is **no hardcoded admin password** in the app or this README. Roles come
from Firebase custom claims set by the server-side seed script.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (domain logic, RBAC, SLA, metrics) |
| `npm run test:rules` | Firestore security-rules tests (emulator) |
| `npm run emulators` | Start the Firebase Emulator Suite |
| `npm run seed` | Seed demo data + set custom claims (emulator by default) |

---

## Deployment

Frontend deploys to **Vercel** or **Render** as a static Vite SPA; Firebase
rules/indexes deploy separately with the Firebase CLI. Full instructions,
including the Blaze-plan trade-off for scheduled SLA jobs, are in
[DEPLOYMENT.md](DEPLOYMENT.md).

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — data model, modules, SLA/priority logic
- [SECURITY.md](SECURITY.md) — RBAC, rules, custom claims, threat model
- [FEATURES.md](FEATURES.md) — feature matrix (done vs. planned)
- [DEPLOYMENT.md](DEPLOYMENT.md) — Vercel + Render + Firebase setup
- [TESTING.md](TESTING.md) — how to run and extend the tests
- [DEMO_GUIDE.md](DEMO_GUIDE.md) — guided recruiter walkthrough
