import { ROLES } from "./roles.js";

// Seeded demo accounts for recruiter exploration. These are FICTIONAL demo
// identities in an isolated demo project — not real corporate credentials. The
// shared demo password is intentionally public for a portfolio sandbox; each
// account's privileges are strictly limited by its role via security rules, so
// no demo visitor can gain real admin access to anything beyond demo data.
export const DEMO_PASSWORD = "Demo123!";

export const DEMO_ACCOUNTS = [
  {
    email: "admin@helpdesk.demo",
    role: ROLES.ADMIN,
    displayName: "Avery Chen",
    department: "IT Service Management",
    supportGroups: ["Service Desk L1"],
  },
  {
    email: "l1@helpdesk.demo",
    role: ROLES.L1,
    displayName: "Jordan Blake",
    department: "IT Service Desk",
    supportGroups: ["Service Desk L1"],
  },
  {
    email: "l2@helpdesk.demo",
    role: ROLES.L2,
    displayName: "Priya Nair",
    department: "Technical Support",
    supportGroups: ["Technical Support L2", "Microsoft 365 Support"],
  },
  {
    email: "l3@helpdesk.demo",
    role: ROLES.L3,
    displayName: "Marcus Oyelaran",
    department: "Specialist Support",
    supportGroups: ["Specialist Support L3", "Network Support"],
  },
  {
    email: "employee@helpdesk.demo",
    role: ROLES.EMPLOYEE,
    displayName: "Dana Whitfield",
    department: "Finance",
    supportGroups: [],
  },
];

export function demoAccountFor(role) {
  return DEMO_ACCOUNTS.find((a) => a.role === role);
}
