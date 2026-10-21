import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllTickets } from "../services/ticketService";
import { toTicketViews } from "../domain/ticketView";
import { PriorityBadge, StatusBadge, SlaBadge } from "../components/tickets/Badges";
import { PRIORITIES, INCIDENT_STATUSES, SUPPORT_GROUPS } from "../domain/itsm";

export default function TicketQueuePage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [group, setGroup] = useState("");
  const [slaOnly, setSlaOnly] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await getAllTickets();
        if (active) setTickets(raw);
      } catch (e) {
        console.error(e);
        if (active) setError("Could not load the queue. Is the demo data seeded?");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const views = useMemo(() => toTicketViews(tickets), [tickets]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return views.filter((t) => {
      if (priority && t.priority !== priority) return false;
      if (status && t.status !== status) return false;
      if (group && t.supportGroup !== group) return false;
      if (slaOnly && !(t.slaBreached || t.slaWarning)) return false;
      if (term) {
        const hay = `${t.ticketNumber} ${t.shortDescription} ${t.requesterName} ${t.category} ${t.assignedTechName ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [views, q, priority, status, group, slaOnly]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Ticket Queue</h1>
          <p className="muted">{filtered.length} of {views.length} tickets</p>
        </div>
      </div>

      <div className="filters">
        <input
          className="filter-search"
          placeholder="Search number, summary, requester, technician…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {INCIDENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={group} onChange={(e) => setGroup(e.target.value)}>
          <option value="">All groups</option>
          {SUPPORT_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <label className="chk">
          <input type="checkbox" checked={slaOnly} onChange={(e) => setSlaOnly(e.target.checked)} />
          SLA risk only
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <div className="center-state"><div className="spinner" /><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No tickets match your filters.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket</th><th>Summary</th><th>Requester</th><th>Group</th>
                <th>Priority</th><th>Status</th><th>SLA</th><th>Assignee</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className={t.slaBreached ? "row-danger" : t.slaWarning ? "row-warn" : ""}>
                  <td className="mono">{t.ticketNumber}</td>
                  <td>{t.shortDescription}</td>
                  <td>{t.requesterName}</td>
                  <td className="nowrap">{t.supportGroup}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><SlaBadge sla={t.sla} /></td>
                  <td>{t.assignedTechName || <span className="muted">Unassigned</span>}</td>
                  <td><Link className="link" to={`/app/tickets/${t.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
