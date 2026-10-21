// Deterministic demo-data generator. Produces internally consistent fictional
// employees, assets, tickets, knowledge articles, and directory users. All data
// is simulated for the portfolio demonstration (company.example domain).

import { derivePriority } from "../src/domain/itsm.js";
import { computeDeadlines, DEFAULT_SLA_POLICY } from "../src/domain/sla.js";

// Small seeded PRNG so repeated runs produce the same dataset (idempotent).
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const rng = makeRng(20260321);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const chance = (p) => rng() < p;

export const DEPARTMENTS = [
  "Finance", "Human Resources", "Sales", "Marketing", "Engineering",
  "Operations", "Legal", "Customer Success", "IT", "Executive",
];

export const SUPPORT_TEAMS = [
  { id: "sd-l1", name: "Service Desk L1", tier: 1 },
  { id: "ts-l2", name: "Technical Support L2", tier: 2 },
  { id: "ss-l3", name: "Specialist Support L3", tier: 3 },
  { id: "iam", name: "Identity and Access Support", tier: 2 },
  { id: "net", name: "Network Support", tier: 2 },
  { id: "endpoint", name: "Endpoint Support", tier: 2 },
  { id: "m365", name: "Microsoft 365 Support", tier: 2 },
];

const FIRST = ["Dana", "Priya", "Marcus", "Jordan", "Avery", "Sam", "Lena", "Tom", "Ivy", "Noah",
  "Maya", "Leo", "Zoe", "Omar", "Ruth", "Kai", "Nina", "Paul", "Gia", "Eli",
  "Cora", "Theo", "Mila", "Hugo", "Isla", "Reed", "Faye", "Max", "Beth", "Wren",
  "Cole", "Anya", "Dev", "Rhea", "Finn", "Opal"];
const LAST = ["Whitfield", "Nair", "Oyelaran", "Blake", "Chen", "Patel", "Ross", "Nguyen", "Khan", "Silva",
  "Walsh", "Osei", "Romero", "Haas", "Flynn", "Abara", "Duval", "Mercer", "Yoon", "Frost"];

export function makeEmployees(count, startIndex = 0) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST[(startIndex + i) % FIRST.length];
    const last = LAST[(startIndex + i * 3) % LAST.length];
    const dept = DEPARTMENTS[(startIndex + i) % DEPARTMENTS.length];
    const uname = `${first}.${last}`.toLowerCase();
    out.push({
      uid: `emp-${startIndex + i}`,
      displayName: `${first} ${last}`,
      email: `${uname}@company.example`,
      department: dept,
      role: "employee",
    });
  }
  return out;
}

const ASSET_TYPES = [
  { type: "Laptop", makes: [["Dell", "Latitude 7440"], ["Lenovo", "ThinkPad X1"], ["HP", "EliteBook 840"]] },
  { type: "Desktop", makes: [["Dell", "OptiPlex 7010"], ["HP", "ProDesk 600"]] },
  { type: "Monitor", makes: [["Dell", "U2723QE"], ["LG", "27UN880"]] },
  { type: "Network Printer", makes: [["HP", "LaserJet M479"], ["Brother", "HL-L8360"]] },
  { type: "Mobile Device", makes: [["Apple", "iPhone 15"], ["Samsung", "Galaxy S24"]] },
  { type: "Docking Station", makes: [["Dell", "WD19"], ["Lenovo", "Thunderbolt 4"]] },
];
const OS = ["Windows 11 Pro", "Windows 10 Pro", "macOS 14", "iOS 17", "Android 14", "—"];
const LIFECYCLE = ["In Use", "In Stock", "In Repair", "Retired"];

export function makeAssets(count, employees) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const at = pick(ASSET_TYPES);
    const [mfr, model] = pick(at.makes);
    const owner = chance(0.8) ? pick(employees) : null;
    const purchase = new Date(2022 + Math.floor(rng() * 3), Math.floor(rng() * 12), 1 + Math.floor(rng() * 27));
    const warranty = new Date(purchase.getFullYear() + 3, purchase.getMonth(), purchase.getDate());
    out.push({
      id: `asset-${i}`,
      assetTag: `AST-${String(1000 + i)}`,
      assetType: at.type,
      manufacturer: mfr,
      model,
      serialNumber: `SN${Math.floor(rng() * 1e8).toString().padStart(8, "0")}`,
      assignedUid: owner?.uid ?? null,
      assignedName: owner?.displayName ?? null,
      department: owner?.department ?? "IT",
      location: pick(["HQ Floor 1", "HQ Floor 2", "HQ Floor 3", "Remote", "Branch - North"]),
      operatingSystem: at.type === "Monitor" || at.type === "Network Printer" || at.type === "Docking Station" ? "—" : pick(OS),
      lifecycleStatus: owner ? "In Use" : pick(LIFECYCLE),
      purchaseDate: purchase.toISOString(),
      warrantyExpiry: warranty.toISOString(),
      lastMaintenance: null,
    });
  }
  return out;
}

const TICKET_TEMPLATES = [
  { cat: "Identity & Access", sub: "Account Lockout", group: "Identity and Access Support", sd: "Account locked after password change", impact: "Medium", urgency: "High" },
  { cat: "Identity & Access", sub: "Password Reset", group: "Service Desk L1", sd: "Cannot sign in — password reset needed", impact: "Low", urgency: "Medium" },
  { cat: "Network & Connectivity", sub: "DNS", group: "Network Support", sd: "Cannot reach internal portal — DNS error", impact: "High", urgency: "High" },
  { cat: "Network & Connectivity", sub: "VPN", group: "Network Support", sd: "VPN disconnects every few minutes", impact: "Medium", urgency: "High" },
  { cat: "Network & Connectivity", sub: "Wi-Fi", group: "Service Desk L1", sd: "Office Wi-Fi keeps dropping", impact: "Low", urgency: "Medium" },
  { cat: "Email & Microsoft 365", sub: "Outlook", group: "Microsoft 365 Support", sd: "Outlook stuck on 'trying to connect'", impact: "Medium", urgency: "Medium" },
  { cat: "Email & Microsoft 365", sub: "Teams", group: "Microsoft 365 Support", sd: "No audio in Teams calls", impact: "Low", urgency: "Medium" },
  { cat: "Email & Microsoft 365", sub: "OneDrive", group: "Microsoft 365 Support", sd: "OneDrive stuck syncing", impact: "Low", urgency: "Low" },
  { cat: "Hardware", sub: "Laptop", group: "Endpoint Support", sd: "Laptop won't power on", impact: "High", urgency: "High" },
  { cat: "Hardware", sub: "Docking Station", group: "Endpoint Support", sd: "Dock won't drive external monitors", impact: "Medium", urgency: "Medium" },
  { cat: "Printing", sub: "Network Printer", group: "Service Desk L1", sd: "Floor printer offline", impact: "Low", urgency: "Medium" },
  { cat: "Software", sub: "Crash", group: "Technical Support L2", sd: "Finance app crashes on export", impact: "Medium", urgency: "Medium" },
  { cat: "Security", sub: "Phishing", group: "Specialist Support L3", sd: "Suspicious email reported", impact: "High", urgency: "Medium" },
];

const RESOLUTIONS = [
  { code: "Fixed — Configuration", rc: "Misconfigured DNS suffix", rs: "Corrected the DNS search suffix and flushed the resolver cache; verified resolution." },
  { code: "Fixed — Reset/Restart", rc: "Stale credential cache", rs: "Cleared cached credentials and restarted the service; user confirmed access." },
  { code: "Fixed — Replacement", rc: "Failed hardware component", rs: "Replaced the faulty unit and validated operation." },
  { code: "Fixed — User Education", rc: "Workflow misunderstanding", rs: "Walked the user through the correct steps; issue not reproducible afterwards." },
];

/**
 * Build tickets with consistent timestamps, SLA deadlines, and a matching event
 * trail. `staff` are the demo technician accounts available for assignment.
 */
export function makeTickets(count, employees, staff, assets, now = new Date()) {
  const tickets = [];
  const techs = staff.filter((s) => s.role !== "employee" && s.role !== "administrator");
  const assignable = techs.length ? techs : staff;

  for (let i = 0; i < count; i++) {
    const tpl = pick(TICKET_TEMPLATES);
    const requester = pick(employees);
    const impact = chance(0.15) ? "High" : tpl.impact;
    const urgency = tpl.urgency;
    const priority = derivePriority(impact, urgency);

    // Age tickets from a few hours up to ~20 days ago.
    const ageMs = Math.floor(rng() * 20 * 86400000) + 3600000;
    const createdAt = new Date(now.getTime() - ageMs);
    const { responseDueAt, resolutionDueAt } = computeDeadlines(createdAt, priority, DEFAULT_SLA_POLICY);

    // Decide a lifecycle outcome.
    const roll = rng();
    let status, assignee = null, firstResponseAt = null, resolvedAt = null, closedAt = null;
    let resolution = null, escalationLevel = 0, supportGroup = tpl.group, reopened = false;

    const respond = () => new Date(createdAt.getTime() + Math.floor(rng() * 90 + 5) * 60000);

    if (roll < 0.18) {
      status = "New";
    } else if (roll < 0.35) {
      status = "In Progress";
      assignee = pick(assignable);
      firstResponseAt = respond();
    } else if (roll < 0.45) {
      status = "Escalated";
      assignee = pick(assignable);
      firstResponseAt = respond();
      escalationLevel = 1;
      supportGroup = pick(["Technical Support L2", "Specialist Support L3", "Network Support"]);
    } else if (roll < 0.6) {
      status = "Pending User";
      assignee = pick(assignable);
      firstResponseAt = respond();
    } else if (roll < 0.82) {
      status = "Resolved";
      assignee = pick(assignable);
      firstResponseAt = respond();
      resolvedAt = new Date(firstResponseAt.getTime() + Math.floor(rng() * 24 + 1) * 3600000);
      resolution = pick(RESOLUTIONS);
    } else if (roll < 0.95) {
      status = "Closed";
      assignee = pick(assignable);
      firstResponseAt = respond();
      resolvedAt = new Date(firstResponseAt.getTime() + Math.floor(rng() * 24 + 1) * 3600000);
      closedAt = new Date(resolvedAt.getTime() + Math.floor(rng() * 48 + 1) * 3600000);
      resolution = pick(RESOLUTIONS);
    } else {
      status = "Reopened";
      assignee = pick(assignable);
      firstResponseAt = respond();
      reopened = true;
    }

    // Occasionally link an asset owned by the requester.
    const ownedAsset = assets.find((a) => a.assignedUid === requester.uid);

    tickets.push({
      id: `tkt-${i}`,
      data: {
        ticketNumber: `INC${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(1000 + i)}`,
        recordType: tpl.cat === "Software" && chance(0.3) ? "Service Request" : "Incident",
        shortDescription: tpl.sd,
        description: `${tpl.sd}. Reported by ${requester.displayName} (${requester.department}). ${chance(0.5) ? "Issue is intermittent." : "Issue is consistent and reproducible."}`,
        requesterUid: requester.uid,
        requesterName: requester.displayName,
        requesterEmail: requester.email,
        department: requester.department,
        contact: requester.email,
        serviceAffected: tpl.sub,
        category: tpl.cat,
        subcategory: tpl.sub,
        impact,
        urgency,
        priority,
        supportGroup,
        assignedTechUid: assignee?.uid ?? null,
        assignedTechName: assignee?.displayName ?? null,
        status,
        escalationLevel,
        firstResponseAt,
        resolvedAt,
        closedAt,
        resolutionSummary: resolution?.rs ?? null,
        resolutionCode: resolution?.code ?? null,
        rootCause: resolution?.rc ?? null,
        relatedAssetId: ownedAsset?.id ?? null,
        linkedArticleIds: [],
        requesterConfirmed: status === "Closed",
        slaResponseDueAt: responseDueAt,
        slaResolutionDueAt: resolutionDueAt,
        createdAt,
        updatedAt: closedAt ?? resolvedAt ?? firstResponseAt ?? createdAt,
      },
      meta: { assignee, firstResponseAt, resolvedAt, closedAt, resolution, createdAt, status, supportGroup, reopened },
    });
  }
  return tickets;
}

export const KNOWLEDGE_ARTICLES = [
  { id: "kb-pw-reset", title: "Reset a Windows / Entra ID password", category: "Identity & Access", tags: ["password", "entra", "reset"], visibility: "public" },
  { id: "kb-dns", title: "Troubleshooting DNS resolution failures", category: "Network & Connectivity", tags: ["dns", "nslookup", "ipconfig"], visibility: "public" },
  { id: "kb-vpn", title: "Resolving VPN connectivity problems", category: "Network & Connectivity", tags: ["vpn", "connectivity"], visibility: "public" },
  { id: "kb-outlook-sync", title: "Fixing Outlook synchronization issues", category: "Email & Microsoft 365", tags: ["outlook", "sync"], visibility: "public" },
  { id: "kb-printer", title: "Troubleshooting network printers", category: "Printing", tags: ["printer", "spooler"], visibility: "public" },
  { id: "kb-dhcp", title: "Resolving DHCP and APIPA issues", category: "Network & Connectivity", tags: ["dhcp", "apipa"], visibility: "internal" },
  { id: "kb-teams-audio", title: "Fixing Microsoft Teams audio", category: "Email & Microsoft 365", tags: ["teams", "audio"], visibility: "public" },
  { id: "kb-onedrive", title: "Resolving OneDrive synchronization", category: "Email & Microsoft 365", tags: ["onedrive", "sync"], visibility: "public" },
  { id: "kb-lockout", title: "Investigating account lockouts", category: "Identity & Access", tags: ["lockout", "security"], visibility: "internal" },
  { id: "kb-perf", title: "Troubleshooting workstation performance", category: "Hardware", tags: ["performance", "task manager"], visibility: "public" },
  { id: "kb-win-startup", title: "Diagnosing Windows startup failures", category: "Hardware", tags: ["windows", "boot"], visibility: "internal" },
  { id: "kb-mfa", title: "Resolving MFA enrollment problems", category: "Identity & Access", tags: ["mfa", "authenticator"], visibility: "public" },
  { id: "kb-license", title: "Microsoft 365 license assignment", category: "Email & Microsoft 365", tags: ["license", "m365"], visibility: "internal" },
  { id: "kb-gateway", title: "Fixing incorrect default gateway", category: "Network & Connectivity", tags: ["gateway", "routing"], visibility: "internal" },
  { id: "kb-phishing", title: "Responding to reported phishing", category: "Security", tags: ["phishing", "security"], visibility: "internal" },
];

export const DIRECTORY_SEED = [
  { status: "Active", mfa: "Enabled", locked: false },
  { status: "Active", mfa: "Enabled", locked: true },
  { status: "Active", mfa: "Disabled", locked: false },
  { status: "Disabled", mfa: "Enabled", locked: false },
];

export function makeDirectoryUsers(employees) {
  return employees.map((e, i) => {
    const d = DIRECTORY_SEED[i % DIRECTORY_SEED.length];
    return {
      id: e.uid,
      displayName: e.displayName,
      username: e.email.split("@")[0],
      email: e.email,
      department: e.department,
      manager: null,
      accountStatus: d.status,
      locked: d.locked,
      mfaStatus: d.mfa,
      licenses: chance(0.6) ? ["Microsoft 365 E3"] : ["Microsoft 365 E5"],
      groups: [`${e.department}-Staff`, "All-Employees"],
      lastSignIn: new Date(Date.now() - Math.floor(rng() * 7 * 86400000)).toISOString(),
    };
  });
}
