import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../components/layout/AuthContext";
import { PERMISSIONS as P } from "../auth/roles";
import {
  getDirectoryUsers, performOperation, IDENTITY_OPERATIONS,
} from "../services/identityService";

export default function IdentityLabPage() {
  const { currentUser, role, can, profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const actor = useMemo(
    () => ({ uid: currentUser.uid, email: currentUser.email, displayName: profile?.displayName, role }),
    [currentUser, profile, role]
  );
  const canOperate = can(P.IDENTITY_OPERATE);

  async function load() {
    const data = await getDirectoryUsers();
    setUsers(data);
    if (selected) setSelected(data.find((u) => u.id === selected.id) || null);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try { const data = await getDirectoryUsers(); if (active) setUsers(data); }
      catch (e) { console.error(e); if (active) setError("Could not load the directory."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => `${u.displayName} ${u.username} ${u.email} ${u.department}`.toLowerCase().includes(term));
  }, [users, q]);

  async function runOp(op) {
    setBusy(true); setFlash("");
    try {
      await performOperation(selected, op.key, actor);
      await load();
      setFlash(`${op.label} completed (simulated) and recorded in the audit log.`);
    } catch (e) {
      console.error(e); setError(e.message);
    } finally { setBusy(false); }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Identity &amp; Microsoft 365 Administration Lab</h1>
          <p className="muted"><strong>Demo / Simulated Environment.</strong> All operations affect only the local simulated directory — never a real Microsoft 365 / Entra ID tenant.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {flash && <p className="banner-ok">{flash}</p>}

      <div className="idlab-grid">
        <div className="panel">
          <div className="filters"><input className="filter-search" placeholder="Search directory…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {loading ? <div className="center-state"><div className="spinner" /></div> : (
            <ul className="idlab-list">
              {filtered.map((u) => (
                <li key={u.id}>
                  <button className={`idlab-user ${selected?.id === u.id ? "active" : ""}`} onClick={() => { setSelected(u); setFlash(""); }}>
                    <span className="idlab-name">{u.displayName}</span>
                    <span className="idlab-sub muted small">{u.email}</span>
                    <span className="idlab-flags">
                      <span className={`badge ${u.accountStatus === "Active" ? "sla-ok" : "sla-breached"}`}>{u.accountStatus}</span>
                      {u.locked && <span className="badge sla-breached">Locked</span>}
                      <span className="badge sla-na">MFA: {u.mfaStatus}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          {!selected ? <p className="empty-state">Select a directory user to view details and simulated operations.</p> : (
            <>
              <h2>{selected.displayName}</h2>
              <dl className="kv two-col">
                <div><dt>Username</dt><dd className="mono">{selected.username}</dd></div>
                <div><dt>Email</dt><dd>{selected.email}</dd></div>
                <div><dt>Department</dt><dd>{selected.department}</dd></div>
                <div><dt>Account status</dt><dd>{selected.accountStatus}</dd></div>
                <div><dt>Locked</dt><dd>{selected.locked ? "Yes" : "No"}</dd></div>
                <div><dt>MFA</dt><dd>{selected.mfaStatus}</dd></div>
                <div><dt>Licenses</dt><dd>{(selected.licenses || []).join(", ") || "—"}</dd></div>
                <div><dt>Groups</dt><dd>{(selected.groups || []).join(", ") || "—"}</dd></div>
              </dl>

              <h3 className="mt">Simulated operations</h3>
              {!canOperate ? (
                <p className="muted small">Your role can view the directory but not perform operations (requires L2+).</p>
              ) : (
                <div className="btn-wrap">
                  {IDENTITY_OPERATIONS.filter((op) => op.applies(selected)).map((op) => (
                    <button key={op.key} className="chip-btn" disabled={busy} onClick={() => runOp(op)}>{op.label}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
