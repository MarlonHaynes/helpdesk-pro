import { describe, it, expect } from "vitest";
import {
  derivePriority,
  canTransition,
  allowedTransitions,
  isOpenStatus,
} from "./itsm.js";

describe("derivePriority (ITIL impact/urgency matrix)", () => {
  it("maps High/High to P1", () => {
    expect(derivePriority("High", "High")).toBe("P1");
  });

  it("maps High/Medium and Medium/High to P2", () => {
    expect(derivePriority("High", "Medium")).toBe("P2");
    expect(derivePriority("Medium", "High")).toBe("P2");
  });

  it("maps the P3 band", () => {
    expect(derivePriority("High", "Low")).toBe("P3");
    expect(derivePriority("Medium", "Medium")).toBe("P3");
    expect(derivePriority("Low", "High")).toBe("P3");
  });

  it("maps the P4 band", () => {
    expect(derivePriority("Medium", "Low")).toBe("P4");
    expect(derivePriority("Low", "Medium")).toBe("P4");
    expect(derivePriority("Low", "Low")).toBe("P4");
  });
});

describe("canTransition (status graph)", () => {
  it("permits identity transition", () => {
    expect(canTransition("New", "New")).toBe(true);
  });

  it("permits valid forward transitions", () => {
    expect(canTransition("New", "Assigned")).toBe(true);
    expect(canTransition("In Progress", "Resolved")).toBe(true);
    expect(canTransition("Resolved", "Closed")).toBe(true);
    expect(canTransition("Resolved", "Reopened")).toBe(true);
  });

  it("rejects illegal jumps", () => {
    expect(canTransition("New", "Resolved")).toBe(false);
    expect(canTransition("New", "Closed")).toBe(false);
    expect(canTransition("Closed", "In Progress")).toBe(false);
    expect(canTransition("Resolved", "New")).toBe(false);
  });

  it("closed is terminal", () => {
    expect(allowedTransitions("Closed")).toEqual([]);
  });
});

describe("isOpenStatus", () => {
  it("counts active statuses as open", () => {
    expect(isOpenStatus("In Progress")).toBe(true);
    expect(isOpenStatus("Reopened")).toBe(true);
  });
  it("counts resolved/closed as not open", () => {
    expect(isOpenStatus("Resolved")).toBe(false);
    expect(isOpenStatus("Closed")).toBe(false);
  });
});
