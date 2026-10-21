# Feature Matrix

Status of each area. ✅ implemented & working · 🟡 works with a documented
free-tier limitation · ⬜ not built.

All 10 master-prompt upgrade categories are implemented. Remaining 🟡 items are
free-tier trade-offs documented in [DEPLOYMENT.md](DEPLOYMENT.md), not missing
features.

## 1. Security & RBAC
- ✅ Custom-claim RBAC (administrator, L1, L2, L3, employee)
- ✅ Firestore + Storage security rules (server enforcement), default-deny
- ✅ Server-validated priority and status transitions
- ✅ Append-only, tamper-proof audit log
- ✅ Seeded demo role accounts + one-click sign-in
- ✅ Security regression tests + an end-to-end lifecycle test (emulator)

## 2. ITIL incident management
- ✅ Record types: Incident / Service Request / Problem / Change Request
- ✅ 9-state lifecycle with enforced transitions
- ✅ Impact × urgency → P1–P4 priority matrix (configurable policy)
- ✅ Assignment, escalation with support-group routing + handoff notes
- ✅ Resolution (code, root cause, summary), requester confirm/reopen
- ✅ Immutable per-ticket event timeline
- ✅ Internal vs requester-facing notes

## 3. SLA management
- ✅ Configurable policies (response/resolution targets)
- ✅ Business-hours + holiday + weekend math
- ✅ Breach / near-breach, countdowns, computed on read
- 🟡 Automatic escalation on breach *without a user present* needs a scheduler
  (Blaze Scheduled Functions or external cron). On-read evaluation + the SLA-risk
  queue filter cover detection on the free tier.

## 4. Troubleshooting Workbench
- ✅ Interactive stage-based engine (info / diagnostic / decision / resolution)
- ✅ Safe simulated tools (ipconfig, nslookup, ping, tracert, netstat,
  Test-NetConnection, Get-Service, Event Viewer, Task Manager, Device Manager)
- ✅ 8 scenarios incl. demo A–F (DNS, lockout, Outlook auth, VPN, P1 outage, onboarding)
- ✅ Launch from a ticket; records exercise to timeline + internal notes + audit

## 5. L1/L2/L3 support operations
- ✅ Support groups & routing on escalation
- ✅ Role-scoped queues and actions; queue filters incl. SLA risk
- ✅ Per-technician workload table (Reports)

## 6. Knowledge base
- ✅ Role-aware listing (employees: published/public; staff: incl. internal)
- ✅ Search, categories, tags, article detail, version/author/last-reviewed
- ✅ Helpful / not-helpful feedback (append-only subcollection + rules)
- ✅ Linked from Workbench scenarios and tickets

## 7. IT asset management
- ✅ Inventory list, search, filter (type/department/status)
- ✅ Asset detail with full lifecycle fields, warranty state, linked incidents
- ✅ Assign / return (L3+), audit-logged

## 8. Microsoft 365 / Entra ID lab
- ✅ Simulated directory browse/search + user detail
- ✅ Simulated operations: unlock, password reset, MFA reset/enable,
  enable/disable — gated to L2+, audit-logged, never touches a real tenant

## 9. Reporting & analytics
- ✅ Dashboard metrics from persisted data (SLA compliance, MTTR, first response,
  time-to-close, reopen rate, overdue, backlog)
- ✅ Reports page: date-range/department/technician/priority/group filters,
  priority & category charts, click-to-drill-down, aging, workload
- ✅ CSV export (tickets + metrics summary)

## 10. Audit, approvals, automation
- ✅ Append-only audit trail with actor/time/before-after/correlation id
- ✅ Approvals: request + staff decide (self-approval blocked by rules)
- ✅ In-app notifications + notification center; automation raises notifications
  on assignment and resolution; deterministic routing on create
- 🟡 Optional external email delivery not implemented (in-app notifications are
  the reliable baseline, per spec); would require a server-side mail integration.

## Recruiter experience (§19)
- ✅ "Explore Demo" one-click role sign-in + in-app Guided Demo walkthrough
- ✅ Demo scenarios A–F function interactively in the Workbench

## Known non-feature items
- Bundle size ~940 KB (Firebase SDK); route-level code-splitting is a future
  optimization (non-blocking build warning).
- Full browser E2E (Playwright) not included; a runnable emulator-backed
  end-to-end lifecycle test covers the critical journey (see TESTING.md).
