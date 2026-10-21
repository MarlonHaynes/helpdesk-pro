// Shared ITSM domain logic. This mirrors the enforcement in firestore.rules so
// the client computes the same values the server will accept. Keep the priority
// matrix and transition graph in sync with firestore.rules.

export const RECORD_TYPES = Object.freeze([
  "Incident",
  "Service Request",
  "Problem",
  "Change Request",
]);

export const INCIDENT_STATUSES = Object.freeze([
  "New",
  "Assigned",
  "In Progress",
  "Pending User",
  "Pending Vendor",
  "Escalated",
  "Resolved",
  "Closed",
  "Reopened",
]);

export const IMPACT_LEVELS = Object.freeze(["High", "Medium", "Low"]);
export const URGENCY_LEVELS = Object.freeze(["High", "Medium", "Low"]);

export const PRIORITIES = Object.freeze(["P1", "P2", "P3", "P4"]);

export const PRIORITY_LABELS = Object.freeze({
  P1: "P1 — Critical",
  P2: "P2 — High",
  P3: "P3 — Medium",
  P4: "P4 — Low",
});

export const CATEGORIES = Object.freeze([
  "Identity & Access",
  "Email & Microsoft 365",
  "Network & Connectivity",
  "Hardware",
  "Software",
  "Printing",
  "Security",
  "Other",
]);

export const SUBCATEGORIES = Object.freeze({
  "Identity & Access": ["Password Reset", "Account Lockout", "MFA", "Permissions", "Onboarding", "Offboarding"],
  "Email & Microsoft 365": ["Outlook", "Teams", "OneDrive", "Licensing", "Mailbox"],
  "Network & Connectivity": ["DNS", "DHCP", "VPN", "Wi-Fi", "Gateway", "Firewall"],
  Hardware: ["Laptop", "Desktop", "Monitor", "Docking Station", "Peripheral"],
  Software: ["Install Request", "Crash", "Update", "Licensing"],
  Printing: ["Network Printer", "Driver", "Queue"],
  Security: ["Phishing", "Suspicious Activity", "Access Review"],
  Other: ["General"],
});

export const SUPPORT_GROUPS = Object.freeze([
  "Service Desk L1",
  "Technical Support L2",
  "Specialist Support L3",
  "Identity and Access Support",
  "Network Support",
  "Endpoint Support",
  "Microsoft 365 Support",
]);

/**
 * ITIL impact/urgency -> priority. MUST match derivedPriority() in
 * firestore.rules.
 */
export function derivePriority(impact, urgency) {
  if (impact === "High" && urgency === "High") return "P1";
  if (
    (impact === "High" && urgency === "Medium") ||
    (impact === "Medium" && urgency === "High")
  )
    return "P2";
  if (
    (impact === "High" && urgency === "Low") ||
    (impact === "Medium" && urgency === "Medium") ||
    (impact === "Low" && urgency === "High")
  )
    return "P3";
  return "P4";
}

// Allowed status transitions. MUST match validTransition() in firestore.rules.
const TRANSITIONS = Object.freeze({
  New: ["Assigned", "In Progress", "Escalated"],
  Assigned: ["In Progress", "Escalated", "Pending User", "Pending Vendor"],
  "In Progress": ["Pending User", "Pending Vendor", "Escalated", "Resolved"],
  "Pending User": ["In Progress", "Resolved"],
  "Pending Vendor": ["In Progress", "Resolved"],
  Escalated: ["In Progress", "Assigned", "Resolved"],
  Resolved: ["Closed", "Reopened"],
  Closed: [],
  Reopened: ["In Progress", "Assigned", "Escalated", "Resolved"],
});

export function allowedTransitions(fromStatus) {
  return TRANSITIONS[fromStatus] ?? [];
}

export function canTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  return allowedTransitions(fromStatus).includes(toStatus);
}

// Statuses considered "open" for backlog/aging metrics.
export const OPEN_STATUSES = Object.freeze([
  "New",
  "Assigned",
  "In Progress",
  "Pending User",
  "Pending Vendor",
  "Escalated",
  "Reopened",
]);

export function isOpenStatus(status) {
  return OPEN_STATUSES.includes(status);
}

export const RESOLUTION_CODES = Object.freeze([
  "Fixed — Configuration",
  "Fixed — Reset/Restart",
  "Fixed — Replacement",
  "Fixed — User Education",
  "Fixed — Software Update",
  "Workaround Provided",
  "No Fault Found",
  "Duplicate",
]);
