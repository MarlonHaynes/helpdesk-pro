import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllTickets } from "../services/ticketService";
import { toTicketViews } from "../domain/ticketView";
import { computeMetrics, agingBuckets, msToHours } from "../domain/metrics";
import { isOpenStatus, PRIORITIES, SUPPORT_GROUPS } from "../domain/itsm";
import { PriorityBadge, StatusBadge, SlaBadge } from "../components/tickets/Badges";
import { toCsv, downloadCsv } from "../utils/csv";
import formatDate from "../utils/formatDate";

function BarRow({ label, value, max, onClick, active }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <button className={`bar-row barbtn ${active ? "bar-active" : ""}`} onClick={onClick} type="button">
      <span className="bar-label">{label}</span>
      <span className="bar-track"><span className="bar-fill" style={{ width: `${pct}%` }} /></span>
      <span className="bar-value">{value}</span>
    </button>
  );
}

export default function ReportsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dept, setDept] = useState("");
  const [tech, setTech] = useState("");
  const [priority, setPriority] = useState("");
  const [group, setGroup] = useState("");
  const [drill, setDrill] = useState(null); // { kind: 'category'|'priority'|'tech', value }

  useEffect(() => {
    let active = true;
    (async () => {
      try { const raw = await getAllTickets(); if (active) setTickets(raw); }
      catch (e) { console.error(e); if (active) setError("Could not load report data."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const allViews = useMemo(() => toTicketViews(tickets), [tickets]);
  const depts = useMemo(() => [...new Set(allViews.map((v) => v.department).filter(Boolean))].sort(), [allViews]);
  const techs = useMemo(() => [...new Set(allViews.map((v) => v.assignedTechName).filter(Boolean))].sort(), [allViews]);

  const views = useMemo(() => {
    const fromT = from ? new Date(from).getTime() : null;
    const toT = to ? new Date(to).getTime() + 86400000 : null; // inclusive day
    return allViews.filter((v) => {
      const c = v._createdAt?.getTime() ?? 0;
      if (fromT && c < fromT) return false;
      if (toT && c > toT) return false;
      if (dept && v.department !== dept) return false;
      if (tech && v.assignedTechName !== tech) return false;
      if (priority && v.priority !== priority) return false;
      if (group && v.supportGroup !== group) return false;
      return true;
    });
  }, [allViews, from, to, dept, tech, priority, group]);

  const metrics = useMemo(() => computeMetrics(views), [views]);
  const aging = useMemo(() => agingBuckets(views), [views]);

  // Per-technician workload (open counts, SLA breaches).
  const workload = useMemo(() => {
    const map = {};
    for (const v of views) {
      if (!v.assignedTechName) continue;
      const w = (map[v.assignedTechName] ||= { tech: v.assignedTechName, open: 0, breached: 0, resolved: 0 });
      if (isOpenStatus(v.status)) w.open += 1;
      if (v.slaBreached && isOpenStatus(v.status)) w.breached += 1;
      if (v.status === "Resolved" || v.status === "Closed") w.resolved += 1;
    }
    return Object.values(map).sort((a, b) => b.open - a.open);
  }, [views]);

  const drilled = useMemo(() => {
    if (!drill) return views;
    return views.filter((v) =>
      drill.kind === "category" ? v.category === drill.value
      : drill.kind === "priority" ? v.priority === drill.value
      : drill.kind === "tech" ? v.assignedTechName === drill.value
      : true
    );
  }, [views, drill]);

  function exportTickets() {
    const csv = toCsv(views, [
      { key: "ticketNumber", label: "Ticket" },
      { key: "shortDescription", label: "Summary" },
      { key: "recordType", label: "Type" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "category", label: "Category" },
      { key: "supportGroup", label: "Support Group" },
      { key: "department", label: "Department" },
      { key: "requesterName", label: "Requester" },
      { key: "assignedTechName", label: "Assignee" },
      { label: "Created", get: (r) => formatDate(r._createdAt) },
      { label: "Resolved", get: (r) => (r._resolvedAt ? formatDate(r._resolvedAt) : "") },
      { label: "SLA breached", get: (r) => (r.slaBreached ? "yes" : "no") },
    ]);
    downloadCsv(`helpdesk-tickets-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function exportSummary() {
    const rows = [
      { metric: "Total tickets", value: metrics.total },
      { metric: "Open", value: metrics.open },
      { metric: "Resolved", value: metrics.resolved },
      { metric: "Closed", value: metrics.closed },
      { metric: "Escalated", value: metrics.escalated },
      { metric: "Overdue (SLA)", value: metrics.overdue },
      { metric: "SLA compliance %", value: metrics.slaCompliancePct ?? "n/a" },
      { metric: "MTTR (hours)", value: msToHours(metrics.mttrMs) ?? "n/a" },
      { metric: "Avg first response (hours)", value: msToHours(metrics.avgFirstResponseMs) ?? "n/a" },
      { metric: "Avg time to close (hours)", value: msToHours(metrics.avgTimeToCloseMs) ?? "n/a" },
      { metric: "Reopen rate %", value: metrics.reopenRatePct },
    ];
    downloadCsv(`helpdesk-summary-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(rows, [{ key: "metric", label: "Metric" }, { key: "value", label: "Value" }]));
  }

  const catMax = Math.max(1, ...Object.values(metrics.byCategory));
  const prioMax = Math.max(1, ...Object.values(metrics.byPriority));

  if (loading) return <div className="center-state"><div className="spinner" /><p>Loading reports…</p></div>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Reports &amp; Analytics</h1>
          <p className="muted">{views.length} of {allViews.length} tickets in range. All figures computed from persisted demonstration data.</p>
        </div>
        <div className="btn-wrap">
          <button className="secondary-btn" onClick={exportTickets}>Export tickets CSV</button>
          <button className="secondary-btn" onClick={exportSummary}>Export summary CSV</button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="filters">
        <label className="chk">From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="chk">To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <select value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All departments</option>{depts.map((d) => <option key={d}>{d}</option>)}</select>
        <select value={tech} onChange={(e) => setTech(e.target.value)}><option value="">All technicians</option>{techs.map((t) => <option key={t}>{t}</option>)}</select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="">All priorities</option>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select>
        <select value={group} onChange={(e) => setGroup(e.target.value)}><option value="">All groups</option>{SUPPORT_GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
        {(from || to || dept || tech || priority || group) && (
          <button className="chip-btn" onClick={() => { setFrom(""); setTo(""); setDept(""); setTech(""); setPriority(""); setGroup(""); }}>Clear</button>
        )}
      </div>

      <div className="stat-grid">
        <Stat label="Total" value={metrics.total} />
        <Stat label="Open" value={metrics.open} tone="info" />
        <Stat label="Overdue" value={metrics.overdue} tone="danger" />
        <Stat label="SLA compliance" value={metrics.slaCompliancePct == null ? "—" : `${metrics.slaCompliancePct}%`} tone="ok" />
        <Stat label="MTTR" value={fmtHrs(metrics.mttrMs)} />
        <Stat label="Avg 1st response" value={fmtHrs(metrics.avgFirstResponseMs)} />
      </div>

      <div className="dash-grid">
        <section className="panel">
          <h2>By priority <span className="muted small">(click to drill down)</span></h2>
          {PRIORITIES.map((p) => (
            <BarRow key={p} label={p} value={metrics.byPriority[p] || 0} max={prioMax}
              active={drill?.kind === "priority" && drill.value === p}
              onClick={() => setDrill(drill?.kind === "priority" && drill.value === p ? null : { kind: "priority", value: p })} />
          ))}
        </section>
        <section className="panel">
          <h2>By category <span className="muted small">(click to drill down)</span></h2>
          {Object.entries(metrics.byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <BarRow key={k} label={k} value={v} max={catMax}
              active={drill?.kind === "category" && drill.value === k}
              onClick={() => setDrill(drill?.kind === "category" && drill.value === k ? null : { kind: "category", value: k })} />
          ))}
        </section>
        <section className="panel">
          <h2>Ticket aging (open)</h2>
          <div className="prio-row">
            {Object.entries(aging).map(([k, v]) => (
              <div key={k} className="prio-stat"><span className="age-label">{k}</span><span>{v}</span></div>
            ))}
          </div>
          <h3 className="mt">Performance</h3>
          <dl className="kv">
            <div><dt>Avg time to close</dt><dd>{fmtHrs(metrics.avgTimeToCloseMs)}</dd></div>
            <div><dt>Reopen rate</dt><dd>{metrics.reopenRatePct}%</dd></div>
            <div><dt>Backlog</dt><dd>{metrics.backlog}</dd></div>
          </dl>
        </section>
      </div>

      <section className="panel">
        <h2>Technician workload</h2>
        {workload.length === 0 ? <p className="empty-state">No assigned tickets in range.</p> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Technician</th><th>Open</th><th>SLA breaches</th><th>Resolved/Closed</th><th></th></tr></thead>
              <tbody>
                {workload.map((w) => (
                  <tr key={w.tech} className={w.breached > 0 ? "row-warn" : ""}>
                    <td>{w.tech}</td><td>{w.open}</td><td>{w.breached}</td><td>{w.resolved}</td>
                    <td><button className="link linkbtn" onClick={() => setDrill({ kind: "tech", value: w.tech })}>View tickets</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>
          {drill ? `Drill-down: ${drill.kind} = ${drill.value}` : "All tickets in range"}
          {drill && <button className="chip-btn" style={{ marginLeft: 12 }} onClick={() => setDrill(null)}>Clear drill-down</button>}
        </h2>
        {drilled.length === 0 ? <p className="empty-state">No tickets.</p> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Ticket</th><th>Summary</th><th>Priority</th><th>Status</th><th>SLA</th><th>Assignee</th><th></th></tr></thead>
              <tbody>
                {drilled.slice(0, 100).map((t) => (
                  <tr key={t.id}>
                    <td className="mono">{t.ticketNumber}</td>
                    <td>{t.shortDescription}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SlaBadge sla={t.sla} /></td>
                    <td>{t.assignedTechName || <span className="muted">—</span>}</td>
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

function Stat({ label, value, tone }) {
  return (
    <div className={`stat-card ${tone ? `stat-${tone}` : ""}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
function fmtHrs(ms) { const h = msToHours(ms); return h == null ? "—" : `${h} h`; }
