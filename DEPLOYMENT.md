# Deployment

The frontend is a static Vite SPA and deploys to **Vercel** or **Render**.
Firebase rules/indexes deploy separately via the Firebase CLI. No custom backend
server is required for the current feature set.

> **Not yet verified on hosted infrastructure.** The build, tests, rules suite,
> and seed have been run locally. An actual Vercel/Render deployment has not been
> performed in this environment — follow the steps below to deploy.

## Prerequisites

1. A Firebase project (Spark/free plan is sufficient) with **Authentication
   (Email/Password)**, **Cloud Firestore**, and **Storage** enabled.
2. The Firebase web config values (Project settings → General → Your apps).

## 1. Deploy Firestore/Storage rules & indexes

```bash
npx firebase login
npx firebase use --add            # select your project, alias it "default"
npx firebase deploy --only firestore:rules,firestore:indexes,storage
```

This publishes `firestore.rules`, `firestore.indexes.json`, and `storage.rules`.

## 2. Seed demo data + role claims (one-time, local)

Seeding sets custom claims, which requires the Admin SDK. Run it locally against
your **live** project with a service-account key (never commit the key):

```bash
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
FIREBASE_PROJECT=your-project \
  node scripts/seed.js --live
```

The script refuses to run against a live project without
`GOOGLE_APPLICATION_CREDENTIALS`, and defaults to the emulator otherwise.

## 3a. Frontend on Vercel

- Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
- `vercel.json` already rewrites all routes to `/index.html` for SPA routing.
- Set environment variables (Project → Settings → Environment Variables) from
  `.env.example` — the `VITE_FIREBASE_*` values. Leave `VITE_USE_EMULATORS`
  unset or `false` in production.

## 3b. Frontend on Render

- Create a **Static Site**. Build: `npm run build`. Publish dir: `dist`.
- Add a rewrite rule: source `/*` → destination `/index.html` (Rewrite) for SPA
  routing. (`render.yaml` is provided with this config.)
- Set the same `VITE_FIREBASE_*` environment variables.

## Environment variables

See [`.env.example`](.env.example). Rule: **never** place a secret (service
account, Admin credentials) in a `VITE_`-prefixed variable — those are shipped to
the browser. The `VITE_FIREBASE_*` config values are not secrets.

## Scheduled SLA automation — cost note

Recalculating SLA on read ($0, implemented) covers display and breach detection
without any always-on service. **Automatic escalation on breach without a user
present** needs a scheduler:

- **Firebase Scheduled Functions** — requires the **Blaze** (pay-as-you-go) plan.
  Blaze has a free monthly allowance but requires a billing card. If you enable
  it, add a scheduled function that queries
  `tickets where slaResolutionDueAt <= now and status in (open states)` and
  escalates/notifies.
- **External cron** (e.g. a Render Cron Job hitting an Admin-SDK script) — a
  free-tier-friendly alternative.

Neither is required for the demo to be fully usable.

## CORS / hosts

The app uses the Firebase SDK (no custom API), so no CORS configuration is
needed. There are no hardcoded localhost URLs in production code paths; emulator
hosts are used only when `VITE_USE_EMULATORS=true`.
