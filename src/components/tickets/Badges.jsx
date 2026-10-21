import { formatRemaining } from "../../domain/sla";

export function PriorityBadge({ priority }) {
  const cls = { P1: "prio-p1", P2: "prio-p2", P3: "prio-p3", P4: "prio-p4" }[priority] || "prio-p4";
  return <span className={`badge ${cls}`}>{priority}</span>;
}

const STATUS_CLASS = {
  New: "st-new",
  Assigned: "st-assigned",
  "In Progress": "st-progress",
  "Pending User": "st-pending",
  "Pending Vendor": "st-pending",
  Escalated: "st-escalated",
  Resolved: "st-resolved",
  Closed: "st-closed",
  Reopened: "st-reopened",
};

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status] || "st-new"}`}>{status}</span>;
}

export function SlaBadge({ sla }) {
  if (!sla) return null;
  // Show the more urgent of the two clocks.
  const clock =
    sla.resolution.state === "breached" || sla.resolution.state === "warning"
      ? sla.resolution
      : sla.response.state === "breached" || sla.response.state === "warning"
      ? sla.response
      : sla.resolution;

  const cls = {
    met: "sla-met",
    ok: "sla-ok",
    warning: "sla-warn",
    breached: "sla-breached",
    "n/a": "sla-na",
  }[clock.state] || "sla-na";

  const label =
    clock.state === "breached"
      ? `Breached ${formatRemaining(clock.remainingMs)}`
      : clock.state === "warning"
      ? `Due in ${formatRemaining(clock.remainingMs)}`
      : clock.state === "met"
      ? "Met"
      : clock.state === "ok"
      ? `${formatRemaining(clock.remainingMs)} left`
      : "—";

  return <span className={`badge ${cls}`} title="Resolution SLA">{label}</span>;
}
