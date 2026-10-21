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

Current result: **36 tests passing.**

## Security rules tests (`npm run test:rules`)

`tests/rules/firestore.rules.test.js` runs against the Firestore emulator via
`firebase emulators:exec`, asserting authorized **and** unauthorized behavior:

- employee can open their own ticket with a server-consistent priority
- forged priority (P1 for Low/Low) is **rejected**
- creating a ticket for another user is **rejected**
- cross-user ticket reads are **blocked**; staff can read all
- illegal status jump (New→Closed) is **rejected** even for staff
- employees cannot change status/priority arbitrarily
- audit entries are append-only (no update/delete, no actor spoofing)
- asset/config collections are role-gated

```bash
npm run test:rules
```

Current result: **21 tests passing.** Requires a JDK (Firestore emulator).

> The emulator uses Firestore port **8089** (8080 was occupied during
> development); see `firebase.json`. The test reads `FIRESTORE_EMULATOR_HOST`
> that `emulators:exec` exports, so it follows whatever port is configured.

## Build verification

```bash
npm run lint      # ESLint — clean
npm run build     # Vite production build — succeeds
```

## Not yet automated

End-to-end browser tests (e.g. Playwright) for the full click-through loop are
planned. In-browser verification during development was limited to the dev
server serving/transforming the app; a full recruiter click-through should be
run manually per [DEMO_GUIDE.md](DEMO_GUIDE.md) until E2E tests are added.
