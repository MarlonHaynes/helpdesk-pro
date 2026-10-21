// SLA engine: configurable response/resolution targets with business-hours and
// holiday awareness. All SLA status is computed from persisted deadlines so it
// never depends on a browser staying open (see §5 of the spec). A scheduled
// backend sweep is optional (documented as Blaze-only); on the free tier the
// status is always recomputed on read via evaluateSla().

// Default demonstration SLA policy. CLEARLY FICTIONAL organizational policy —
// values are configurable via the applicationSettings/slaPolicies collection.
export const DEFAULT_SLA_POLICY = Object.freeze({
  id: "default",
  name: "Standard Corporate SLA (Demo)",
  timezone: "America/New_York",
  businessHours: { startHour: 8, endHour: 18 }, // 08:00–18:00 local
  businessDays: [1, 2, 3, 4, 5], // Mon–Fri (0 = Sun)
  holidays: [], // ISO date strings "YYYY-MM-DD"
  // Minutes. P1/P2 run on calendar time (24/7); P3/P4 on business time.
  targets: {
    P1: { responseMins: 15, resolutionMins: 4 * 60, clock: "calendar" },
    P2: { responseMins: 60, resolutionMins: 8 * 60, clock: "calendar" },
    P3: { responseMins: 4 * 60, resolutionMins: 2 * 8 * 60, clock: "business" },
    P4: { responseMins: 8 * 60, resolutionMins: 5 * 8 * 60, clock: "business" },
  },
  // Fraction of the target elapsed at which we warn of a near-breach.
  nearBreachThreshold: 0.8,
});

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate(); // Firestore Timestamp
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isHoliday(date, policy) {
  const iso = date.toISOString().slice(0, 10);
  return policy.holidays?.includes(iso);
}

function isBusinessDay(date, policy) {
  return policy.businessDays.includes(date.getDay()) && !isHoliday(date, policy);
}

/**
 * Add `minutes` of business time to a start Date, skipping non-business hours,
 * weekends, and holidays. Works in whole-minute steps for clarity and
 * determinism (fine for demo-scale deadlines).
 */
export function addBusinessMinutes(start, minutes, policy = DEFAULT_SLA_POLICY) {
  const { startHour, endHour } = policy.businessHours;
  let cursor = new Date(start.getTime());
  let remaining = minutes;

  // Guard against pathological configs / infinite loops.
  let safety = 60 * 24 * 365;

  while (remaining > 0 && safety-- > 0) {
    if (!isBusinessDay(cursor, policy)) {
      // Jump to start of next day.
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(startHour, 0, 0, 0);
      continue;
    }
    const dayStart = new Date(cursor);
    dayStart.setHours(startHour, 0, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(endHour, 0, 0, 0);

    if (cursor < dayStart) {
      cursor = dayStart;
      continue;
    }
    if (cursor >= dayEnd) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(startHour, 0, 0, 0);
      continue;
    }

    const minsLeftToday = Math.floor((dayEnd - cursor) / 60000);
    if (remaining <= minsLeftToday) {
      cursor = new Date(cursor.getTime() + remaining * 60000);
      remaining = 0;
    } else {
      remaining -= minsLeftToday;
      cursor = new Date(dayEnd.getTime());
    }
  }
  return cursor;
}

export function addCalendarMinutes(start, minutes) {
  return new Date(start.getTime() + minutes * 60000);
}

/** Compute response and resolution deadlines for a ticket at creation. */
export function computeDeadlines(createdAt, priority, policy = DEFAULT_SLA_POLICY) {
  const start = toDate(createdAt) ?? new Date();
  const target = policy.targets[priority] ?? policy.targets.P4;
  const add = target.clock === "business" ? addBusinessMinutes : addCalendarMinutes;
  return {
    responseDueAt: add(start, target.responseMins, policy),
    resolutionDueAt: add(start, target.resolutionMins, policy),
  };
}

/**
 * Evaluate current SLA state from persisted deadlines. Pure function of the
 * ticket plus "now", so it is correct whether or not any background job ran.
 *
 * Returns { response, resolution } each { state, dueAt, remainingMs, breached }
 * where state is "met" | "ok" | "warning" | "breached" | "n/a".
 */
export function evaluateSla(ticket, now = new Date(), policy = DEFAULT_SLA_POLICY) {
  const nearBreach = policy.nearBreachThreshold ?? 0.8;

  function clock(dueAtRaw, achievedAtRaw, createdAtRaw) {
    const dueAt = toDate(dueAtRaw);
    if (!dueAt) return { state: "n/a", dueAt: null, remainingMs: null, breached: false };

    const achievedAt = toDate(achievedAtRaw);
    if (achievedAt) {
      return {
        state: achievedAt <= dueAt ? "met" : "breached",
        dueAt,
        remainingMs: dueAt - achievedAt,
        breached: achievedAt > dueAt,
      };
    }

    const remainingMs = dueAt - now;
    if (remainingMs <= 0) {
      return { state: "breached", dueAt, remainingMs, breached: true };
    }

    const createdAt = toDate(createdAtRaw);
    if (createdAt) {
      const total = dueAt - createdAt;
      const elapsedFrac = total > 0 ? (now - createdAt) / total : 0;
      if (elapsedFrac >= nearBreach) {
        return { state: "warning", dueAt, remainingMs, breached: false };
      }
    }
    return { state: "ok", dueAt, remainingMs, breached: false };
  }

  return {
    response: clock(ticket.slaResponseDueAt, ticket.firstResponseAt, ticket.createdAt),
    resolution: clock(ticket.slaResolutionDueAt, ticket.resolvedAt, ticket.createdAt),
  };
}

/** True if the ticket is currently in near-breach or breach on either clock. */
export function needsEscalationAttention(ticket, now = new Date(), policy = DEFAULT_SLA_POLICY) {
  const sla = evaluateSla(ticket, now, policy);
  const states = [sla.response.state, sla.resolution.state];
  return states.includes("breached") || states.includes("warning");
}

export function formatRemaining(ms) {
  if (ms == null) return "—";
  const breached = ms < 0;
  let s = Math.abs(Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return (breached ? "-" : "") + parts.join(" ");
}
