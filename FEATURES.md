# Feature Matrix

Honest status of each area. ✅ implemented & working · 🟡 data model/logic present,
dedicated UI pending · ⬜ planned.

## Security & access
- ✅ Custom-claim RBAC (administrator, L1, L2, L3, employee)
- ✅ Firestore + Storage security rules (server enforcement)
- ✅ Server-validated priority and status transitions
- ✅ Append-only, tamper-proof audit log
- ✅ Seeded demo role accounts + one-click sign-in
- ✅ Security regression tests (emulator)

## ITIL incident management
- ✅ Record types: Incident / Service Request / Problem / Change Request
- ✅ 9-state lifecycle with enforced transitions
- ✅ Impact × urgency → P1–P4 priority matrix (configurable policy)
- ✅ Assignment, escalation with support-group routing + handoff notes
- ✅ Resolution (code, root cause, summary), requester confirm/reopen
- ✅ Immutable per-ticket event timeline
- ✅ Internal vs requester-facing notes

## SLA
- ✅ Configurable policies (response/resolution targets)
- ✅ Business-hours + holiday + weekend math
- ✅ Breach / near-breach, computed on read
- ✅ SLA badges & countdowns in UI
- 🟡 Automatic escalation on breach (logic ready; scheduled trigger documented as Blaze/cron)

## Dashboards & analytics
- ✅ Totals, open, escalated, overdue, backlog
- ✅ SLA compliance %, MTTR, avg first response, avg time to close, reopen rate
- ✅ By priority / category / support group, aging buckets
- 🟡 Date-range/department/technician filter screens + CSV export (queue search is implemented; dedicated report screens pending)

## Support operations (L1/L2/L3)
- ✅ Support groups & routing on escalation
- ✅ Role-scoped queues and actions
- 🟡 Per-technician workload views

## Knowledge base
- 🟡 Articles seeded (15) with visibility/status/version; browsing & search UI pending
- ⬜ Article authoring/approval UI, helpful/not-helpful feedback UI

## Asset management
- 🟡 Assets seeded (32) with full lifecycle fields + ticket linkage; management UI pending

## Microsoft 365 / Entra ID lab
- 🟡 Simulated directory seeded (30 users); operations UI (unlock/reset/MFA) pending

## Approvals & automation
- 🟡 `approvals` model + rules present; request/decide UI pending
- 🟡 Deterministic categorization/routing on create; notification center pending

## Troubleshooting Workbench
- ⬜ Interactive diagnostic scenarios (planned; integrates with ticket events)

See [README.md](README.md) for the phase plan behind this matrix.
