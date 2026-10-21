import { Link } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";
import { roleLabel } from "../auth/roles";

const STEPS = [
  { n: 1, title: "Review the operations dashboard", body: "Live metrics computed from persisted data — SLA compliance, MTTR, overdue, breakdowns.", to: "/app", cta: "Open dashboard" },
  { n: 2, title: "Open a high-priority incident", body: "In the queue, filter to P1 or 'SLA risk only', then open a ticket.", to: "/app/tickets", cta: "Open ticket queue" },
  { n: 3, title: "Run a simulated diagnostic", body: "Launch a Troubleshooting Workbench scenario (safe simulation — no commands run).", to: "/app/workbench", cta: "Open Workbench" },
  { n: 4, title: "Document & escalate", body: "Add internal notes, record first response, then escalate to L2 with a handoff. Try this on a ticket.", to: "/app/tickets", cta: "Go to tickets" },
  { n: 5, title: "Manage identity (simulated)", body: "In the M365/Entra Lab, unlock an account or reset MFA — fully simulated, audit-logged.", to: "/app/identity", cta: "Open Identity Lab" },
  { n: 6, title: "Browse the knowledge base", body: "Search articles; staff see internal articles, employees see public ones.", to: "/app/knowledge", cta: "Open Knowledge Base" },
  { n: 7, title: "Check assets", body: "Search the asset inventory and open an asset to see its linked incidents and warranty.", to: "/app/assets", cta: "Open Assets" },
  { n: 8, title: "Review reports & export", body: "Filter by date/department/technician, drill down, and export CSV.", to: "/app/reports", cta: "Open Reports" },
  { n: 9, title: "Inspect the audit trail", body: "Every privileged action is recorded, append-only and tamper-proof (admin only).", to: "/app/audit", cta: "Open Audit Log" },
];

export default function GuidedTourPage() {
  const { role, isStaff, can } = useAuth();
  const visible = STEPS.filter((s) => {
    // Hide steps a role can't reach so there are no dead ends.
    if (["/app/tickets", "/app/workbench", "/app/identity", "/app/assets"].includes(s.to) && !isStaff) return false;
    if (s.to === "/app/audit" && !can("admin:audit")) return false;
    if (s.to === "/app/reports" && !can("reports:team")) return false;
    return true;
  });

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <h1>Guided Demo</h1>
          <p className="muted">You're signed in as <strong>{roleLabel(role)}</strong>. Follow the steps your role can access. All data is simulated.</p>
        </div>
      </div>

      <ol className="tour">
        {visible.map((s) => (
          <li key={s.n} className="tour-step">
            <span className="tour-num">{s.n}</span>
            <div className="tour-body">
              <h3>{s.title}</h3>
              <p className="muted">{s.body}</p>
              <Link className="secondary-btn" to={s.to}>{s.cta}</Link>
            </div>
          </li>
        ))}
      </ol>

      <div className="panel">
        <h2>What to notice</h2>
        <ul className="bullets">
          <li>Authorization is enforced by security rules, not the UI — an employee literally cannot read another user's ticket.</li>
          <li>Priority is derived from impact × urgency and validated server-side; requesters can't self-assign P1.</li>
          <li>SLA is recomputed on read using business hours, so it's correct whenever you look.</li>
          <li>Every privileged action lands in an append-only audit log.</li>
        </ul>
      </div>
    </div>
  );
}
