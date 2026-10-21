# Recruiter Demo Guide

A 5-minute walkthrough of the working functionality. Everything below operates
on **fictional, simulated** data; no real corporate system is touched.

## Setup

Run the three terminals in [README.md](README.md) (emulators → seed → `npm run
dev`), then open the app and click **Sign In**.

## Guided tour

### 1. Service operations dashboard (Administrator / any technician)
Sign in as **Administrator** (`admin@helpdesk.demo`). The dashboard shows live
metrics computed from the seeded data: totals, open/escalated/overdue counts,
**SLA compliance %**, **MTTR**, average first response, reopen rate, breakdowns
by priority/category, and ticket-aging buckets. The "Needs attention" table
surfaces tickets breaching or nearing their SLA.

### 2. The ticket queue & a high-priority incident (L1)
Sign in as **L1 Technician** (`l1@helpdesk.demo`). Open **Ticket Queue**. Filter
by priority **P1** or tick **SLA risk only**. Rows at risk are highlighted. Open
a high-priority incident.

### 3. Triage, document, and the SLA clock
On the ticket you'll see the impact/urgency-derived **priority**, the **response
and resolution SLA clocks** (recomputed live), the requester, department, and
support group. Use **Record first response**, add an **internal note** (hidden
from the requester) and a **requester-facing update**.

### 4. Escalate to L2 with a handoff
Still as L1, use **Escalate**: pick a support group (e.g. *Technical Support
L2*), write handoff notes (work done, outstanding issues, business impact), and
escalate. The ticket moves groups, its escalation level increments, and the
**timeline** records it.

### 5. L2 reassesses priority & resolves
Sign in as **L2 Technician** (`l2@helpdesk.demo`). Open the escalated ticket.
Only L2+ can **reassess priority** (change impact/urgency → priority recomputes).
Move the ticket to **In Progress**, then **Resolve** with a resolution code, root
cause, and summary.

### 6. Employee confirms resolution
Sign in as **Employee** (`employee@helpdesk.demo`). Open **My Tickets** → a
resolved ticket. As the requester you can **Confirm resolved** (closes it) or
**Reopen** — and you can only see your own tickets and requester-facing notes,
never internal notes.

### 7. The audit trail (Administrator)
Sign back in as **Administrator** → **Audit Log**. Every privileged action
(status change, assignment, priority change, escalation) is recorded with actor,
timestamp, and before/after values. These records are **append-only** — the rules
reject any attempt to edit or delete them, even by an admin.

## What to notice (the interview points)

- **Real authorization**: try signing in as the employee and note the sidebar has
  no queue/audit — and the rules would reject those reads even via the console.
- **Server-enforced integrity**: priority is derived from impact×urgency and
  validated server-side; a requester cannot self-assign P1, and illegal status
  jumps are rejected.
- **SLA correctness**: deadlines use business hours/holidays and are recomputed on
  read, so they're right regardless of when you look.
- **Honest scope**: see [FEATURES.md](FEATURES.md) for what's implemented vs.
  planned — nothing in this guide is a non-functional mockup.
