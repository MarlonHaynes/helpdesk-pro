# Architecture

## Overview

A Vite/React 19 SPA talking directly to Firebase (Auth, Firestore, Storage).
Authorization is enforced by Firestore/Storage security rules keyed on
custom-claim roles. No custom backend server is required on the free tier;
privileged bootstrap (creating accounts, setting role claims, seeding) is done
by a local Admin-SDK script.

```
Browser (React SPA)
  ├─ Firebase Auth  ── custom claim: role
  ├─ Cloud Firestore ── rules enforce RBAC + workflow validation
  └─ Firebase Storage ── rules enforce attachment type/size
Local tooling (not shipped to browser)
  └─ scripts/seed.js (Admin SDK) ── create demo users, set claims, seed data
```

## Code map

| Path | Responsibility |
|---|---|
| `src/auth/roles.js` | Role + permission matrix (mirrors rules) |
| `src/auth/demoAccounts.js` | Seeded demo role accounts |
| `src/domain/itsm.js` | Record types, statuses, priority matrix, transition graph |
| `src/domain/sla.js` | SLA policy, business-hours math, breach evaluation |
| `src/domain/ticketView.js` | View-model: recompute SLA from trusted inputs on read |
| `src/domain/metrics.js` | Dashboard analytics (MTTR, compliance, aging, …) |
| `src/services/ticketService.js` | Ticket CRUD, transitions, escalation, events, notes |
| `src/services/auditService.js` | Append-only audit log writes/reads |
| `src/services/userService.js` | Staff lookup for assignment |
| `src/components/layout/AuthContext.jsx` | Auth + role hydration from claims |
| `src/components/layout/AppShell.jsx` | Role-aware sidebar shell |
| `src/routes/ProtectedRoute.jsx` | Client route guard (staff/admin/permission) |
| `firestore.rules`, `storage.rules` | Server-side enforcement |
| `scripts/seed.js`, `scripts/demoData.js` | Idempotent seeding + claims |

## Data model (Firestore)

- `users/{uid}` — profile + role mirror (role authority is the claim).
- `tickets/{id}` — core record (see fields below).
  - `tickets/{id}/events/{id}` — immutable per-ticket timeline (subcollection).
  - `tickets/{id}/notes/{id}` — internal vs requester-facing notes (subcollection).
- `auditLogs/{id}` — global append-only privileged-action trail.
- `assets/{id}`, `knowledgeArticles/{id}`, `approvals/{id}`,
  `notifications/{id}`, `simulatedDirectoryUsers/{id}` — enterprise modules.
- `slaPolicies/{id}`, `departments/{id}`, `supportTeams/{id}`,
  `applicationSettings/{id}` — configuration (admin-managed).

Histories/notes/events are **subcollections** (not unbounded arrays on the
ticket) so documents stay bounded and paginable. Authoritative timestamps use
`serverTimestamp()`.

### Ticket fields

`ticketNumber, recordType, shortDescription, description, requesterUid,
requesterName, requesterEmail, department, contact, serviceAffected, category,
subcategory, impact, urgency, priority, supportGroup, assignedTechUid,
assignedTechName, status, escalationLevel, firstResponseAt, resolvedAt, closedAt,
resolutionSummary, resolutionCode, rootCause, relatedAssetId, linkedArticleIds,
requesterConfirmed, slaResponseDueAt, slaResolutionDueAt, createdAt, updatedAt`.

## Priority & transitions (single source of truth)

`derivePriority(impact, urgency)` and the status-transition graph are defined in
`src/domain/itsm.js` **and** mirrored in `firestore.rules`. The two are kept in
sync deliberately; `src/domain/itsm.test.js` and the rules test suite both cover
them so a drift is caught.

## SLA

Deadlines are a pure function of `createdAt` + priority + policy
(`computeDeadlines`). SLA state (`ok`/`warning`/`breached`/`met`) is recomputed
on every read by `evaluateSla`, so it is correct regardless of whether any
background job ran — satisfying the "must not depend on a browser staying open"
requirement. Stored `sla*DueAt` fields exist for querying/indexing but are
treated as a cache; the UI re-derives from trusted inputs.

## Indexes

`firestore.indexes.json` defines composite indexes for the app's queries
(tickets by requester/assignee/status/group/priority + createdAt; notifications;
audit; approvals; KB). Deploy with `firebase deploy --only firestore:indexes`.
