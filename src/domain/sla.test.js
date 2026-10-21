import { describe, it, expect } from "vitest";
import {
  DEFAULT_SLA_POLICY,
  addBusinessMinutes,
  addCalendarMinutes,
  computeDeadlines,
  evaluateSla,
} from "./sla.js";

const policy = DEFAULT_SLA_POLICY;

describe("addCalendarMinutes", () => {
  it("adds wall-clock minutes", () => {
    const start = new Date("2026-03-02T10:00:00");
    expect(addCalendarMinutes(start, 90).getTime()).toBe(
      new Date("2026-03-02T11:30:00").getTime()
    );
  });
});

describe("addBusinessMinutes", () => {
  it("stays within the same business day when it fits", () => {
    // Monday 2026-03-02 09:00 + 120 business mins -> 11:00
    const start = new Date("2026-03-02T09:00:00");
    const end = addBusinessMinutes(start, 120, policy);
    expect(end.getHours()).toBe(11);
    expect(end.getMinutes()).toBe(0);
  });

  it("rolls over the end of the business day to the next business day", () => {
    // Monday 17:00 + 120 mins; business day ends 18:00 -> 60 mins carried to
    // Tuesday 08:00 -> 09:00
    const start = new Date("2026-03-02T17:00:00");
    const end = addBusinessMinutes(start, 120, policy);
    expect(end.getDate()).toBe(3); // Tuesday
    expect(end.getHours()).toBe(9);
  });

  it("skips the weekend", () => {
    // Friday 2026-03-06 17:30 + 60 mins -> 30 mins Friday to 18:00, then
    // Monday 2026-03-09 08:00 + 30 -> 08:30
    const start = new Date("2026-03-06T17:30:00");
    const end = addBusinessMinutes(start, 60, policy);
    expect(end.getDay()).toBe(1); // Monday
    expect(end.getHours()).toBe(8);
    expect(end.getMinutes()).toBe(30);
  });

  it("skips a configured holiday", () => {
    const withHoliday = { ...policy, holidays: ["2026-03-03"] };
    // Monday 17:30 + 60; 30 mins to Monday 18:00, Tuesday is holiday, so
    // Wednesday 2026-03-04 08:00 + 30 -> 08:30
    const start = new Date("2026-03-02T17:30:00");
    const end = addBusinessMinutes(start, 60, withHoliday);
    expect(end.getDate()).toBe(4); // Wednesday
    expect(end.getHours()).toBe(8);
    expect(end.getMinutes()).toBe(30);
  });
});

describe("computeDeadlines", () => {
  it("uses calendar clock for P1", () => {
    const created = new Date("2026-03-02T10:00:00");
    const { responseDueAt, resolutionDueAt } = computeDeadlines(created, "P1", policy);
    expect(responseDueAt.getTime()).toBe(new Date("2026-03-02T10:15:00").getTime());
    expect(resolutionDueAt.getTime()).toBe(new Date("2026-03-02T14:00:00").getTime());
  });

  it("uses business clock for P3", () => {
    // P3 response = 4 business hours. Monday 10:00 -> 14:00.
    const created = new Date("2026-03-02T10:00:00");
    const { responseDueAt } = computeDeadlines(created, "P3", policy);
    expect(responseDueAt.getHours()).toBe(14);
  });
});

describe("evaluateSla", () => {
  const base = {
    createdAt: new Date("2026-03-02T10:00:00"),
    slaResponseDueAt: new Date("2026-03-02T10:15:00"),
    slaResolutionDueAt: new Date("2026-03-02T14:00:00"),
  };

  it("reports ok when well within target", () => {
    const now = new Date("2026-03-02T10:05:00");
    const sla = evaluateSla(base, now, policy);
    expect(sla.response.state).toBe("ok");
    expect(sla.response.breached).toBe(false);
  });

  it("reports warning near the threshold", () => {
    // response window is 15 mins; 80% = 12 mins -> now at 10:13 is warning
    const now = new Date("2026-03-02T10:13:00");
    const sla = evaluateSla(base, now, policy);
    expect(sla.response.state).toBe("warning");
  });

  it("reports breached after the deadline with no response", () => {
    const now = new Date("2026-03-02T10:30:00");
    const sla = evaluateSla(base, now, policy);
    expect(sla.response.state).toBe("breached");
    expect(sla.response.breached).toBe(true);
  });

  it("reports met when responded before the deadline", () => {
    const ticket = { ...base, firstResponseAt: new Date("2026-03-02T10:10:00") };
    const now = new Date("2026-03-02T12:00:00");
    const sla = evaluateSla(ticket, now, policy);
    expect(sla.response.state).toBe("met");
  });

  it("does not depend on a browser being open — pure function of now", () => {
    const now = new Date("2026-03-05T10:00:00"); // days later
    const sla = evaluateSla(base, now, policy);
    expect(sla.resolution.state).toBe("breached");
  });
});
