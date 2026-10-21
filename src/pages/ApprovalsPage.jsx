import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../components/layout/AuthContext";
import { PERMISSIONS as P } from "../auth/roles";
import {
  createApproval, getAllApprovals, getMyApprovals, decideApproval, APPROVAL_TYPES,
} from "../services/approvalService";
import formatDate from "../utils/formatDate";

export default function ApprovalsPage() {
  const { currentUser, role, can, profile } = useAuth();
  const canDecide = can(P.APPROVAL_DECIDE);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ type: APPROVAL_TYPES[0], description: "" });

  const actor = useMemo(
    () => ({ uid: currentUser.uid, email: currentUser.email, displayName: profile?.displayName, role }),
    [currentUser, profile, role]
  );

  const load = useCallback(async () => {
    const data = canDecide ? await getAllApprovals() : await getMyApprovals(currentUser.uid);
    setRows(data);
  }, [canDecide, currentUser.uid]);

  useEffect(() => {
    let active = true;
    (async () => {
      try { await load(); } catch (e) { console.error(e); if (active) setError("Could not load approvals."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    if (!form.description.trim()) return;
    setBusy(true);
    try { await createApproval(form, actor); setForm({ type: APPROVAL_TYPES[0], description: "" }); await load(); }
    catch (err) { console.error(err); setError("Could not submit the request."); }
    finally { setBusy(false); }
  }

  async function decide(row, decision) {
    setBusy(true);
    try { await decideApproval(row, decision, actor, null); await load(); }
    catch (err) { console.error(err); setError(err.message); }
    finally { setBusy(false); }
  }

  const statusBadge = (s) => ({ Pending: "sla-warn", Approved: "sla-ok", Rejected: "sla-breached" }[s] || "sla-na");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Approvals</h1>
          <p className="muted">{canDecide ? "Review and decide requests." : "Your approval requests."}</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <section className="panel">
        <h2>Request an approval</h2>
        <form className="form-row" onSubmit={submit}>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {APPROVAL_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Details</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What are you requesting and why?" />
          </div>
          <div className="form-group" style={{ alignSelf: "flex-end" }}>
            <button className="primary-btn" disabled={busy || !form.description.trim()}>Submit</button>
          </div>
        </form>
      </section>

      {loading ? (
        <div className="center-state"><div className="spinner" /><p>Loading…</p></div>
      ) : rows.length === 0 ? (
        <p className="empty-state">No approval requests.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Type</th><th>Details</th><th>Requester</th><th>Status</th><th>Submitted</th>{canDecide && <th>Decision</th>}</tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.type}</td>
                  <td>{r.description}</td>
                  <td>{r.requesterName}</td>
                  <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>{r.approverName ? <div className="muted small">by {r.approverName}</div> : null}</td>
                  <td className="small nowrap">{formatDate(r.createdAt)}</td>
                  {canDecide && (
                    <td>
                      {r.status === "Pending" ? (
                        <div className="btn-wrap">
                          <button className="chip-btn" disabled={busy} onClick={() => decide(r, "Approved")}>Approve</button>
                          <button className="chip-btn" disabled={busy} onClick={() => decide(r, "Rejected")}>Reject</button>
                        </div>
                      ) : <span className="muted small">—</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
