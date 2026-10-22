# Testing

Two layers: fast unit tests for business logic, and emulator-backed security
rules tests.

## Unit tests (`npm test`)

Pure-logic tests (Node env, no emulator):

- `src/auth/roles.test.js` — permission matrix per role
- `src/domain/itsm.test.js` — priority matrix + status-transition graph
- `src/domain/sla.test.js` — business-hours math, deadlines, breach/near-breach
- `src/domain/metrics.test.js` — MTTR, SLA compliance, aging, grouping

```bash
npm test          # run once
npm run test:watch
```

Current result: **36 unit tests passing.**

## Security rules tests (`npm run test:rules`)

The `tests/rules/` suite runs against the Firestore **and** Storage emulators via
`firebase emulators:exec`, asserting authorized **and** unauthorized behavior:

- employee can open their own ticket with a server-consistent priority
- forged priority (P1 for Low/Low) is **rejected**
- creating a ticket for another user is **rejected**
- cross-user ticket reads are **blocked**; staff can read all
- illegal status jump (New→Closed) is **rejected** even for staff
- employees cannot change status/priority arbitrarily
- audit entries are append-only (no update/delete, no actor spoofing)
- asset/config collections are role-gated
- knowledge-base visibility + feedback subcollection
- approvals (no self-approval), simulated directory ops (L2+), notifications
- **ticket creation payload** (`ticketCreate.rules.test.js`): runs the real
  `buildCreateTicketPayload()` (the exact shape `createTicket()` writes) against
  the rules — the app payload is **accepted**, all five demo roles can open their
  own ticket, and the old payload (carrying `assignedTechUid`/`resolvedAt`/
  `closedAt`/`resolutionSummary`/`rootCause`), forged priority, non-New status,
  cross-user, and anonymous creates are **rejected**
- **ticket attachments** (`storage.rules.test.js`): ticket owner and staff can
  upload/read; a different requester and anonymous users are **blocked**;
  disallowed content types and > 10 MB uploads are **rejected**; requesters
  cannot delete; the legacy flat `ticket-screenshots/` path is staff-only.
  Ownership is proven by a cross-service `firestore.get` inside the rules.
- **end-to-end lifecycle** (`lifecycle.test.js`): employee opens → L1 assigns/
  responds/escalates → L2 resolves → employee confirms, through the real rules,
  asserting final state + event/audit trail

```bash
npm run test:rules
```

Current result: **58 tests passing** across 4 files. Requires a JDK (Firestore +
Storage emulators). Test files run sequentially (`fileParallelism: false`)
because they share one emulator and call `clearFirestore()`/`clearStorage()`.

> The emulator uses Firestore port **8089** (8080 was occupied during
> development); see `firebase.json`. The tests read `FIRESTORE_EMULATOR_HOST`
> that `emulators:exec` exports, so they follow whatever port is configured.

## Build verification

```bash
npm run lint      # ESLint — clean
npm run build     # Vite production build — succeeds
```

## Not yet automated

Full **browser** E2E (e.g. Playwright driving a real browser) is not included.
The runnable emulator-backed `lifecycle.test.js` covers the critical journey at
the rules+data layer. During development, the application was verified through automated tests, production builds, and development server checks. A complete interactive browser walkthrough has not yet been performed. Follow DEMO_GUIDE.md to manually verify all features before presenting the application.
