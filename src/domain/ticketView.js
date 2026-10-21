import { computeDeadlines, evaluateSla, DEFAULT_SLA_POLICY } from "./sla";
import { derivePriority } from "./itsm";

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Build a view-model for a ticket with SLA state recomputed from TRUSTED inputs
 * (rule-validated priority + server createdAt) rather than trusting any stored
 * deadline fields. This is the "recalculate SLA on read" guarantee and also
 * means a tampered deadline cannot change what the UI shows.
 */
export function toTicketView(ticket, now = new Date(), policy = DEFAULT_SLA_POLICY) {
  const createdAt = toDate(ticket.createdAt);
  // Re-derive priority from impact/urgency to be safe; fall back to stored.
  const priority =
    ticket.impact && ticket.urgency
      ? derivePriority(ticket.impact, ticket.urgency)
      : ticket.priority;

  let slaResponseDueAt = toDate(ticket.slaResponseDueAt);
  let slaResolutionDueAt = toDate(ticket.slaResolutionDueAt);

  if (createdAt && priority) {
    const d = computeDeadlines(createdAt, priority, policy);
    slaResponseDueAt = d.responseDueAt;
    slaResolutionDueAt = d.resolutionDueAt;
  }

  const sla = evaluateSla(
    {
      createdAt,
      slaResponseDueAt,
      slaResolutionDueAt,
      firstResponseAt: toDate(ticket.firstResponseAt),
      resolvedAt: toDate(ticket.resolvedAt),
    },
    now,
    policy
  );

  return {
    ...ticket,
    priority,
    _createdAt: createdAt,
    _resolvedAt: toDate(ticket.resolvedAt),
    _closedAt: toDate(ticket.closedAt),
    _firstResponseAt: toDate(ticket.firstResponseAt),
    slaResponseDueAt,
    slaResolutionDueAt,
    sla,
    slaBreached: sla.response.breached || sla.resolution.breached,
    slaWarning: sla.response.state === "warning" || sla.resolution.state === "warning",
  };
}

export function toTicketViews(tickets, now = new Date(), policy = DEFAULT_SLA_POLICY) {
  return tickets.map((t) => toTicketView(t, now, policy));
}
