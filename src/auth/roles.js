// Central role + permission model for HelpDesk Pro.
//
// This module is the single source of truth for authorization on the client.
// The SAME role semantics are mirrored in firestore.rules / storage.rules so
// that the UI gating here is backed by real server-side enforcement. Never
// treat the client checks as security on their own — they decide what to SHOW,
// the rules decide what is ALLOWED.

export const ROLES = Object.freeze({
  ADMIN: "administrator",
  L1: "l1",
  L2: "l2",
  L3: "l3",
  EMPLOYEE: "employee",
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: "Administrator",
  [ROLES.L1]: "L1 Technician",
  [ROLES.L2]: "L2 Technician",
  [ROLES.L3]: "L3 Specialist",
  [ROLES.EMPLOYEE]: "Employee",
});

export const ROLE_DESCRIPTIONS = Object.freeze({
  [ROLES.ADMIN]: "Full service-desk administration, configuration, and audit.",
  [ROLES.L1]: "Service Desk tier 1 — triage, diagnose, resolve, and escalate.",
  [ROLES.L2]: "Technical Support tier 2 — advanced troubleshooting on escalations.",
  [ROLES.L3]: "Specialist tier 3 — root-cause analysis and corrective actions.",
  [ROLES.EMPLOYEE]: "Requester — submit and track your own service requests.",
});

// Which roles count as "support staff" (any technician/specialist/admin).
export const STAFF_ROLES = Object.freeze([
  ROLES.ADMIN,
  ROLES.L1,
  ROLES.L2,
  ROLES.L3,
]);

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role);
}

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? "Unknown";
}

// Tier ordering used for escalation logic (higher = more senior support).
export const ROLE_TIER = Object.freeze({
  [ROLES.EMPLOYEE]: 0,
  [ROLES.L1]: 1,
  [ROLES.L2]: 2,
  [ROLES.L3]: 3,
  [ROLES.ADMIN]: 4,
});

// -------------------------------------------------------------------------
// Permission matrix
// -------------------------------------------------------------------------
// Permissions are coarse-grained capabilities. The UI calls can(role, perm)
// to decide whether to render an action. firestore.rules enforces the
// equivalent server-side.

export const PERMISSIONS = Object.freeze({
  // Tickets
  TICKET_CREATE: "ticket:create",
  TICKET_VIEW_ALL: "ticket:view_all",
  TICKET_VIEW_OWN: "ticket:view_own",
  TICKET_ASSIGN: "ticket:assign",
  TICKET_UPDATE_STATUS: "ticket:update_status",
  TICKET_ESCALATE: "ticket:escalate",
  TICKET_RESOLVE: "ticket:resolve",
  TICKET_CLOSE: "ticket:close",
  TICKET_REOPEN_OWN: "ticket:reopen_own",
  TICKET_SET_PRIORITY: "ticket:set_priority",
  TICKET_INTERNAL_NOTES: "ticket:internal_notes",

  // Knowledge base
  KB_VIEW_PUBLIC: "kb:view_public",
  KB_VIEW_INTERNAL: "kb:view_internal",
  KB_AUTHOR: "kb:author",
  KB_APPROVE: "kb:approve",

  // Assets
  ASSET_VIEW: "asset:view",
  ASSET_MANAGE: "asset:manage",

  // Identity / M365 lab
  IDENTITY_VIEW: "identity:view",
  IDENTITY_OPERATE: "identity:operate",

  // Approvals
  APPROVAL_REQUEST: "approval:request",
  APPROVAL_DECIDE: "approval:decide",

  // Administration
  ADMIN_USERS: "admin:users",
  ADMIN_SLA: "admin:sla",
  ADMIN_TEAMS: "admin:teams",
  ADMIN_AUDIT: "admin:audit",
  ADMIN_SETTINGS: "admin:settings",

  // Reporting
  REPORTS_ORG: "reports:org",
  REPORTS_TEAM: "reports:team",

  // Troubleshooting workbench
  WORKBENCH_RUN: "workbench:run",
});

const P = PERMISSIONS;

// Build each role's permission set. Higher tiers generally inherit lower-tier
// support capabilities, so we compose them explicitly for clarity.
const EMPLOYEE_PERMS = [
  P.TICKET_CREATE,
  P.TICKET_VIEW_OWN,
  P.TICKET_REOPEN_OWN,
  P.KB_VIEW_PUBLIC,
  P.APPROVAL_REQUEST,
];

const L1_PERMS = [
  P.TICKET_VIEW_ALL,
  P.TICKET_ASSIGN,
  P.TICKET_UPDATE_STATUS,
  P.TICKET_ESCALATE,
  P.TICKET_RESOLVE,
  P.TICKET_INTERNAL_NOTES,
  P.KB_VIEW_PUBLIC,
  P.KB_VIEW_INTERNAL,
  P.ASSET_VIEW,
  P.IDENTITY_VIEW,
  P.REPORTS_TEAM,
  P.WORKBENCH_RUN,
  P.APPROVAL_REQUEST,
];

const L2_PERMS = [
  ...L1_PERMS,
  P.TICKET_SET_PRIORITY,
  P.IDENTITY_OPERATE,
  P.KB_AUTHOR,
];

const L3_PERMS = [
  ...L2_PERMS,
  P.TICKET_CLOSE,
  P.ASSET_MANAGE,
  P.KB_APPROVE,
];

const ADMIN_PERMS = [
  // Admin gets everything.
  ...Object.values(PERMISSIONS),
];

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.EMPLOYEE]: Object.freeze([...new Set(EMPLOYEE_PERMS)]),
  [ROLES.L1]: Object.freeze([...new Set(L1_PERMS)]),
  [ROLES.L2]: Object.freeze([...new Set(L2_PERMS)]),
  [ROLES.L3]: Object.freeze([...new Set(L3_PERMS)]),
  [ROLES.ADMIN]: Object.freeze([...new Set(ADMIN_PERMS)]),
});

/**
 * Returns true if the given role holds the given permission.
 * @param {string} role
 * @param {string} permission
 */
export function can(role, permission) {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

/** Returns true if the role holds ALL of the listed permissions. */
export function canAll(role, permissions = []) {
  return permissions.every((p) => can(role, p));
}

/** Returns true if the role holds ANY of the listed permissions. */
export function canAny(role, permissions = []) {
  return permissions.some((p) => can(role, p));
}
