import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";
import { PERMISSIONS as P } from "../auth/roles";
import {
  getAllTickets,
  getTicketsForRequester,
} from "../services/ticketService";
import { toTicketViews } from "../domain/ticketView";
import { computeMetrics, agingBuckets, msToHours } from "../domain/metrics";
import { PriorityBadge, StatusBadge, SlaBadge } from "../components/tickets/Badges";

function Stat({ label, value, tone }) {
  return (
    <div className={`stat-card ${tone ? `stat-${tone}` : ""}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function BarRow({ label, value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <span className="bar-track"><span className="bar-fill" style={{ width: `${pct}%` }} /></span>
      <span className="bar-value">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser, can, isStaff } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        let raw;
        if (can(P.TICKET_VIEW_ALL)) raw = await getAllTickets();
        else raw = await getTicketsForRequester(currentUser.uid);
        if (active) setTickets(raw);
      } catch (e) {
        console.error(e);
        if (active) setError("Could not load tickets. Is the demo data seeded?");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser, can]);

  const views = useMemo(() => toTicketViews(tickets), [tickets]);
  const metrics = useMemo(() => computeMetrics(views), [views]);
  const aging = useMemo(() => agingBuckets(views), [views]);
  const attention = useMemo(
    () =>
      views
        .filter((v) => v.slaBreached || v.slaWarning)
        .slice(0, 8),
    [views]
  );

  if (loading) return <div className="center-state"><div className="spinner" /><p>Loading dashboard…</p></div>;

  const catMax = Math.max(1, ...Object.values(metrics.byCategory));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{isStaff ? "Service Operations" : "My Support Overview"}</h1>
          <p className="muted">
            {isStaff
              ? "Live metrics calculated from persisted ticket data. All data is simulated demonstration data."
              : "Track your requests and their service-level targets."}
          </p>
        </div>
        {can(P.TICKET_CREATE) && (
          <Link to="/app/submit" className="primary-btn">New Request</Link>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="stat-grid">
        <Stat label="Total tickets" value={metrics.total} />
        <Stat label="Open" value={metrics.open} tone="info" />
        <Stat label="Escalated" value={metrics.escalated} tone="warn" />
        <Stat label="Overdue (SLA)" value={metrics.overdue} tone="danger" />
        {isStaff && <Stat label="Resolved" value={metrics.resolved} tone="ok" />}
        {isStaff && (
          <Stat
            label="SLA compliance"
            value={metrics.slaCompliancePct == null ? "—" : `${metrics.slaCompliancePct}%`}
            tone="ok"
          />
        )}
      </div>

      {isStaff && (
        <div className="dash-grid">
          <section className="panel">
            <h2>Performance</h2>
            <dl className="kv">
              <div><dt>Avg. first response</dt><dd>{fmtHrs(metrics.avgFirstResponseMs)}</dd></div>
              <div><dt>MTTR</dt><dd>{fmtHrs(metrics.mttrMs)}</dd></div>
              <div><dt>Avg. time to close</dt><dd>{fmtHrs(metrics.avgTimeToCloseMs)}</dd></div>
              <div><dt>Reopen rate</dt><dd>{metrics.reopenRatePct}%</dd></div>
              <div><dt>Backlog</dt><dd>{metrics.backlog}</dd></div>
            </dl>
          </section>

          <section className="panel">
            <h2>By priority</h2>
            <div className="prio-row">
              {["P1", "P2", "P3", "P4"].map((p) => (
                <div key={p} className="prio-stat">
                  <PriorityBadge priority={p} />
                  <span>{metrics.byPriority[p] || 0}</span>
                </div>
              ))}
            </div>
            <h3 className="mt">Ticket aging (open)</h3>
            <div className="prio-row">
              {Object.entries(aging).map(([k, v]) => (
                <div key={k} className="prio-stat">
                  <span className="age-label">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>By category</h2>
            {Object.entries(metrics.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <BarRow key={k} label={k} value={v} max={catMax} />
              ))}
          </section>
        </div>
      )}

      <section className="panel">
        <h2>{isStaff ? "Needs attention (SLA)" : "My recent requests"}</h2>
        {(isStaff ? attention : views.slice(0, 8)).length === 0 ? (
          <p className="empty-state">
            {isStaff ? "Nothing breaching SLA. 🎉" : "You have no requests yet."}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th><th>Summary</th><th>Priority</th><th>Status</th><th>SLA</th><th></th>
                </tr>
              </thead>
              <tbody>
                {(isStaff ? attention : views.slice(0, 8)).map((t) => (
                  <tr key={t.id}>
                    <td className="mono">{t.ticketNumber}</td>
                    <td>{t.shortDescription}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SlaBadge sla={t.sla} /></td>
                    <td><Link className="link" to={`/app/tickets/${t.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function fmtHrs(ms) {
  const h = msToHours(ms);
  return h == null ? "—" : `${h} h`;
}
