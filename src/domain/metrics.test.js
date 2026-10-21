import { describe, it, expect } from "vitest";
import { computeMetrics, agingBuckets, msToHours } from "./metrics.js";
import { toTicketViews } from "./ticketView.js";

// Build raw tickets then run them through the real view-model so the metrics
// test exercises the same SLA recomputation the app uses.
function rawTicket(over) {
  return {
    id: Math.random().toString(36).slice(2),
    status: "New",
    impact: "Low",
    urgency: "Low",
    priority: "P4",
    category: "Other",
    supportGroup: "Service Desk L1",
    department: "Finance",
    createdAt: new Date("2026-03-02T10:00:00"),
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    assignedTechName: null,
    ...over,
  };
}

describe("computeMetrics", () => {
  it("counts statuses and backlog", () => {
    const views = toTicketViews([
      rawTicket({ status: "New" }),
      rawTicket({ status: "In Progress" }),
      rawTicket({ status: "Resolved", resolvedAt: new Date("2026-03-02T12:00:00") }),
      rawTicket({ status: "Closed", resolvedAt: new Date("2026-03-02T12:00:00"), closedAt: new Date("2026-03-03T09:00:00") }),
    ]);
    const m = computeMetrics(views);
    expect(m.total).toBe(4);
    expect(m.open).toBe(2);
    expect(m.resolved).toBe(1);
    expect(m.closed).toBe(1);
    expect(m.backlog).toBe(2);
  });

  it("computes MTTR from createdAt -> resolvedAt", () => {
    const views = toTicketViews([
      rawTicket({
        status: "Resolved",
        createdAt: new Date("2026-03-02T10:00:00"),
        resolvedAt: new Date("2026-03-02T12:00:00"), // 2h
      }),
      rawTicket({
        status: "Resolved",
        createdAt: new Date("2026-03-02T10:00:00"),
        resolvedAt: new Date("2026-03-02T14:00:00"), // 4h
      }),
    ]);
    const m = computeMetrics(views);
    expect(msToHours(m.mttrMs)).toBe(3); // mean of 2h and 4h
  });

  it("computes SLA compliance over resolved tickets with a deadline", () => {
    const views = toTicketViews([
      // P4 Low/Low resolved quickly -> met
      rawTicket({
        status: "Resolved",
        createdAt: new Date("2026-03-02T10:00:00"),
        resolvedAt: new Date("2026-03-02T11:00:00"),
      }),
    ]);
    const m = computeMetrics(views);
    expect(m.slaCompliancePct).toBe(100);
  });

  it("groups by priority and category", () => {
    const views = toTicketViews([
      rawTicket({ impact: "High", urgency: "High", category: "Network & Connectivity" }),
      rawTicket({ impact: "Low", urgency: "Low", category: "Other" }),
    ]);
    const m = computeMetrics(views);
    expect(m.byPriority.P1).toBe(1);
    expect(m.byPriority.P4).toBe(1);
    expect(m.byCategory["Network & Connectivity"]).toBe(1);
  });
});

describe("agingBuckets", () => {
  it("buckets open tickets by age", () => {
    const now = new Date("2026-03-10T10:00:00");
    const views = toTicketViews([
      rawTicket({ status: "In Progress", createdAt: new Date("2026-03-10T08:00:00") }), // <1d
      rawTicket({ status: "In Progress", createdAt: new Date("2026-03-08T10:00:00") }), // ~2d
      rawTicket({ status: "In Progress", createdAt: new Date("2026-03-01T10:00:00") }), // >7d
      rawTicket({ status: "Closed", createdAt: new Date("2026-01-01T10:00:00") }), // excluded
    ], now);
    const b = agingBuckets(views, now);
    expect(b["0-1d"]).toBe(1);
    expect(b["1-3d"]).toBe(1);
    expect(b["7d+"]).toBe(1);
  });
});
