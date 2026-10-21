import { useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "../services/auditService";
import { formatDateTime } from "../utils/formatDate";

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getAuditLogs({ max: 200 });
        if (active) setLogs(data);
      } catch (e) {
        console.error(e);
        if (active) setError("Could not load audit logs.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((l) =>
      `${l.eventType} ${l.actorName} ${l.targetType} ${l.targetId} ${l.newValue}`.toLowerCase().includes(term)
    );
  }, [logs, q]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Audit Log</h1>
          <p className="muted">Immutable, append-only record of privileged actions. Entries cannot be edited or deleted — enforced by security rules.</p>
        </div>
      </div>

      <div className="filters">
        <input className="filter-search" placeholder="Search events, actors, targets…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <div className="center-state"><div className="spinner" /><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No audit entries.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>When</th><th>Actor</th><th>Event</th><th>Target</th><th>Change</th></tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td className="nowrap small">{formatDateTime(l.at)}</td>
                  <td>{l.actorName} <span className="muted small">({l.actorRole})</span></td>
                  <td className="mono small">{l.eventType}</td>
                  <td className="small">{l.targetType}{l.targetId ? ` · ${String(l.targetId).slice(0, 8)}` : ""}</td>
                  <td className="small">
                    {l.previousValue != null && <><span className="muted">{String(l.previousValue)}</span> → </>}
                    {l.newValue != null ? String(l.newValue) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
