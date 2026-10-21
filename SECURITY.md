# Security Model

HelpDesk Pro enforces authorization on the **server** (Firestore/Storage
security rules backed by custom-claim roles), not in the React client. The
client mirrors the rules only to decide what to render.

## Roles & custom claims

Five roles live in the Firebase Auth **custom claim** `role`:
`administrator`, `l1`, `l2`, `l3`, `employee`.

- Claims are set **only** by the Admin SDK (`scripts/seed.js` →
  `setCustomUserClaims`). The browser can never grant itself a role — there is
  no client code path that writes claims, and Firestore rules trust
  `request.auth.token.role`, which is cryptographically signed by Firebase.
- `src/auth/roles.js` defines the permission matrix used for UI gating. It is a
  convenience mirror; bypassing it changes nothing a user is *allowed* to do.

## What the rules enforce (`firestore.rules`)

- **Ticket creation** — requester can only create a ticket for themselves
  (`requesterUid == auth.uid`), starting in `New`, `escalationLevel == 0`, with a
  **server-recomputed priority** (`derivedPriority(impact, urgency)`). A forged
  `P1` on a Low/Low ticket is rejected. Resolution/assignment fields cannot be
  set on create.
- **Status transitions** — a transition map (`validTransition`) rejects illegal
  jumps (e.g. `New → Closed`) even for staff.
- **Requester vs staff updates** — requesters may only confirm/reopen and touch
  a small allowlist of fields; priority, assignment, and internal fields are
  staff-only.
- **Read isolation** — a requester can read only their own tickets
  (`requesterUid == auth.uid`); staff can read all. This closes the original
  app's unauthenticated email-lookup enumeration hole.
- **Internal notes** — internal notes are staff-only; requester-facing notes are
  also visible to the ticket owner.
- **Audit log** — append-only: creation requires `actorUid == auth.uid`; update
  and delete are denied to everyone, including admins.
- **Collection gating** — assets (read: staff, write: L3+), knowledge articles
  (internal vs published/public), config collections (admin-only writes),
  per-user notifications, and simulated directory users (operate: L2+).
- **Default deny** for any unmatched path.

`storage.rules` restricts attachments to images/PDF under 10 MB and limits reads
to signed-in users (deletes to staff).

## Fixes relative to the original app

| Original weakness | Resolution |
|---|---|
| Hardcoded admin creds in UI + README | Removed; seeded role accounts, claims set server-side |
| "Logged in == admin" | 5-role RBAC via custom claims |
| Anyone could read any ticket by email | Reads scoped to owner or staff by rules |
| Client set any field (status/priority) | Priority recomputed & transitions validated in rules |
| No audit trail | Append-only, tamper-proof `auditLogs` + per-ticket events |
| No rules in source control | `firestore.rules` / `storage.rules` + rules test suite |

## Known limitations (free-tier design)

- **No Cloud Functions** (Spark plan, $0). Privileged operations are constrained
  by rules rather than a trusted server function. Where the spec wants true
  server stamping (e.g. SLA deadlines), the client recomputes SLA from the
  **rule-validated** priority + server `createdAt` on every read, so a tampered
  stored deadline cannot change what is displayed or evaluated.
- **Scheduled SLA sweeps** require a scheduler (Blaze Cloud Functions or an
  external cron). The free-tier design recomputes SLA on read instead; see
  [DEPLOYMENT.md](DEPLOYMENT.md).
- The shared demo password is intentionally public for a sandbox; isolation is
  provided by role-scoped rules, not by secrecy.

## Testing the rules

`npm run test:rules` runs `tests/rules/firestore.rules.test.js` against the
Firestore emulator, asserting both authorized **and** unauthorized behavior
(forged priority, cross-user reads, illegal transitions, audit tampering,
role-gated collections).
