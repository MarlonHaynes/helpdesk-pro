import { isOpenStatus } from "./itsm";

// Analytics computed from persisted ticket data. Measurement definitions:
//   * First response time = firstResponseAt - createdAt
//   * MTTR (mean time to resolve) = resolvedAt - createdAt, over resolved tickets
//   * Time to close = closedAt - createdAt, over closed tickets
//   * SLA compliance = resolved-within-deadline / resolved-with-a-deadline
//   * Reopen rate = tickets ever reopened / tickets resolved-or-closed
// All times are milliseconds unless noted.

function ms(a, b) {
  if (!a || !b) return null;
  return b.getTime() - a.getTime();
}

function mean(values) {
  const nums = values.filter((v) => v != null);
  if (!nums.length) return null;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

function countBy(views, keyFn) {
  const out = {};
  for (const v of views) {
    const k = keyFn(v) ?? "—";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/**
 * @param {Array} views - ticket VIEW-models (from toTicketViews) so SLA state
 *                         and parsed dates are already present.
 */
export function computeMetrics(views) {
  const total = views.length;
  const open = views.filter((v) => isOpenStatus(v.status)).length;
  const resolved = views.filter((v) => v.status === "Resolved").length;
  const closed = views.filter((v) => v.status === "Closed").length;
  const escalated = views.filter((v) => v.status === "Escalated").length;
  const reopened = views.filter((v) => v.status === "Reopened").length;

  const overdue = views.filter(
    (v) => isOpenStatus(v.status) && v.slaBreached
  ).length;

  // First response time (resolved + closed tickets that recorded a response)
  const frts = views
    .map((v) => ms(v._createdAt, v._firstResponseAt))
    .filter((x) => x != null && x >= 0);
  const avgFirstResponseMs = mean(frts);

  // MTTR over resolved+closed
  const resolvedViews = views.filter((v) => v._resolvedAt);
  const mttrMs = mean(resolvedViews.map((v) => ms(v._createdAt, v._resolvedAt)));

  // Time to close
  const closedViews = views.filter((v) => v._closedAt);
  const avgTimeToCloseMs = mean(closedViews.map((v) => ms(v._createdAt, v._closedAt)));

  // SLA compliance: of tickets that have a resolution deadline and are resolved,
  // how many met the resolution SLA.
  const withResolution = views.filter((v) => v.sla?.resolution?.dueAt && v._resolvedAt);
  const metResolution = withResolution.filter(
    (v) => v.sla.resolution.state === "met"
  ).length;
  const slaCompliancePct = withResolution.length
    ? Math.round((metResolution / withResolution.length) * 100)
    : null;

  // Reopen rate
  const everResolvedOrClosed = resolved + closed + reopened;
  const reopenRatePct = everResolvedOrClosed
    ? Math.round((reopened / everResolvedOrClosed) * 100)
    : 0;

  return {
    total,
    open,
    resolved,
    closed,
    escalated,
    reopened,
    overdue,
    backlog: open,
    avgFirstResponseMs,
    mttrMs,
    avgTimeToCloseMs,
    slaCompliancePct,
    reopenRatePct,
    byPriority: countBy(views, (v) => v.priority),
    byCategory: countBy(views, (v) => v.category),
    byStatus: countBy(views, (v) => v.status),
    bySupportGroup: countBy(views, (v) => v.supportGroup),
    byTechnician: countBy(
      views.filter((v) => v.assignedTechName),
      (v) => v.assignedTechName
    ),
    byDepartment: countBy(views, (v) => v.department),
  };
}

/** Aging buckets (by age in days) for open tickets. */
export function agingBuckets(views, now = new Date()) {
  const buckets = { "0-1d": 0, "1-3d": 0, "3-7d": 0, "7d+": 0 };
  for (const v of views) {
    if (!isOpenStatus(v.status) || !v._createdAt) continue;
    const days = (now.getTime() - v._createdAt.getTime()) / 86400000;
    if (days < 1) buckets["0-1d"] += 1;
    else if (days < 3) buckets["1-3d"] += 1;
    else if (days < 7) buckets["3-7d"] += 1;
    else buckets["7d+"] += 1;
  }
  return buckets;
}

export function msToHours(value) {
  if (value == null) return null;
  return Math.round((value / 3600000) * 10) / 10;
}
