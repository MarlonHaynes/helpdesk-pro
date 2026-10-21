import { describe, it, expect } from "vitest";
import {
  ROLES,
  PERMISSIONS as P,
  can,
  canAll,
  canAny,
  isStaffRole,
  ROLE_TIER,
} from "./roles.js";

describe("role permission matrix", () => {
  it("employees can create and view their own tickets but not all tickets", () => {
    expect(can(ROLES.EMPLOYEE, P.TICKET_CREATE)).toBe(true);
    expect(can(ROLES.EMPLOYEE, P.TICKET_VIEW_OWN)).toBe(true);
    expect(can(ROLES.EMPLOYEE, P.TICKET_VIEW_ALL)).toBe(false);
    expect(can(ROLES.EMPLOYEE, P.TICKET_ASSIGN)).toBe(false);
  });

  it("employees cannot read internal notes or operate identity lab", () => {
    expect(can(ROLES.EMPLOYEE, P.TICKET_INTERNAL_NOTES)).toBe(false);
    expect(can(ROLES.EMPLOYEE, P.IDENTITY_OPERATE)).toBe(false);
    expect(can(ROLES.EMPLOYEE, P.KB_VIEW_INTERNAL)).toBe(false);
  });

  it("L1 can escalate and resolve but not set priority or operate identity", () => {
    expect(can(ROLES.L1, P.TICKET_ESCALATE)).toBe(true);
    expect(can(ROLES.L1, P.TICKET_RESOLVE)).toBe(true);
    expect(can(ROLES.L1, P.TICKET_SET_PRIORITY)).toBe(false);
    expect(can(ROLES.L1, P.IDENTITY_OPERATE)).toBe(false);
  });

  it("L2 adds priority control, identity operations, KB authoring", () => {
    expect(can(ROLES.L2, P.TICKET_SET_PRIORITY)).toBe(true);
    expect(can(ROLES.L2, P.IDENTITY_OPERATE)).toBe(true);
    expect(can(ROLES.L2, P.KB_AUTHOR)).toBe(true);
    expect(can(ROLES.L2, P.KB_APPROVE)).toBe(false);
  });

  it("L3 adds close, asset management, KB approval", () => {
    expect(can(ROLES.L3, P.TICKET_CLOSE)).toBe(true);
    expect(can(ROLES.L3, P.ASSET_MANAGE)).toBe(true);
    expect(can(ROLES.L3, P.KB_APPROVE)).toBe(true);
  });

  it("admin holds every permission", () => {
    expect(canAll(ROLES.ADMIN, Object.values(P))).toBe(true);
  });

  it("no role is granted for unknown/empty role", () => {
    expect(can(null, P.TICKET_VIEW_OWN)).toBe(false);
    expect(can("ghost", P.TICKET_VIEW_OWN)).toBe(false);
  });

  it("canAny works", () => {
    expect(canAny(ROLES.EMPLOYEE, [P.ADMIN_USERS, P.TICKET_CREATE])).toBe(true);
    expect(canAny(ROLES.EMPLOYEE, [P.ADMIN_USERS, P.ADMIN_SLA])).toBe(false);
  });

  it("staff role detection + tier ordering", () => {
    expect(isStaffRole(ROLES.L1)).toBe(true);
    expect(isStaffRole(ROLES.EMPLOYEE)).toBe(false);
    expect(ROLE_TIER[ROLES.L3] > ROLE_TIER[ROLES.L1]).toBe(true);
  });
});
