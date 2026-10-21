import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAssets } from "../services/assetService";
import formatDate from "../utils/formatDate";

function warrantyState(iso) {
  if (!iso) return null;
  const now = Date.now();
  const exp = new Date(iso).getTime();
  const days = (exp - now) / 86400000;
  if (days < 0) return { cls: "sla-breached", label: "Expired" };
  if (days < 90) return { cls: "sla-warn", label: "Expiring" };
  return { cls: "sla-ok", label: "Active" };
}

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getAssets();
        if (active) setAssets(data);
      } catch (e) {
        console.error(e);
        if (active) setError("Could not load assets.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const types = useMemo(() => [...new Set(assets.map((a) => a.assetType))].sort(), [assets]);
  const depts = useMemo(() => [...new Set(assets.map((a) => a.department).filter(Boolean))].sort(), [assets]);
  const statuses = useMemo(() => [...new Set(assets.map((a) => a.lifecycleStatus))].sort(), [assets]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return assets.filter((a) => {
      if (type && a.assetType !== type) return false;
      if (dept && a.department !== dept) return false;
      if (status && a.lifecycleStatus !== status) return false;
      if (term) {
        const hay = `${a.assetTag} ${a.manufacturer} ${a.model} ${a.serialNumber} ${a.assignedName ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [assets, q, type, dept, status]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>IT Asset Management</h1>
          <p className="muted">{filtered.length} of {assets.length} assets. Simulated inventory.</p>
        </div>
      </div>

      <div className="filters">
        <input className="filter-search" placeholder="Search tag, model, serial, owner…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
        <select value={dept} onChange={(e) => setDept(e.target.value)}><option value="">All departments</option>{depts.map((d) => <option key={d}>{d}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <div className="center-state"><div className="spinner" /><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No assets match.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Tag</th><th>Type</th><th>Model</th><th>Assigned to</th><th>Dept</th><th>Status</th><th>Warranty</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const w = warrantyState(a.warrantyExpiry);
                return (
                  <tr key={a.id}>
                    <td className="mono">{a.assetTag}</td>
                    <td>{a.assetType}</td>
                    <td>{a.manufacturer} {a.model}</td>
                    <td>{a.assignedName || <span className="muted">—</span>}</td>
                    <td>{a.department}</td>
                    <td>{a.lifecycleStatus}</td>
                    <td>{w ? <span className={`badge ${w.cls}`} title={formatDate(a.warrantyExpiry)}>{w.label}</span> : "—"}</td>
                    <td><Link className="link" to={`/app/assets/${a.id}`}>Open</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
