import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";
import { PERMISSIONS as P } from "../auth/roles";
import { getAsset, getAssetIncidents, assignAsset } from "../services/assetService";
import formatDate from "../utils/formatDate";
import { PriorityBadge, StatusBadge } from "../components/tickets/Badges";

export default function AssetDetailPage() {
  const { id } = useParams();
  const { currentUser, role, can, profile } = useAuth();
  const [asset, setAsset] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const actor = useMemo(
    () => ({ uid: currentUser.uid, email: currentUser.email, displayName: profile?.displayName, role }),
    [currentUser, profile, role]
  );

  async function load() {
    const a = await getAsset(id);
    setAsset(a);
    if (a) setIncidents(await getAssetIncidents(id).catch(() => []));
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try { await load(); } catch (e) { console.error(e); if (active) setError("Could not load this asset."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function returnAsset() {
    setBusy(true);
    try { await assignAsset(asset, null, actor); await load(); }
    catch (e) { console.error(e); setError(e.message); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="center-state"><div className="spinner" /><p>Loading…</p></div>;
  if (!asset) return <div className="page"><p className="empty-state">{error || "Asset not found."}</p><Link className="link" to="/app/assets">← Back</Link></div>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="crumb"><Link className="link" to="/app/assets">← Assets</Link></div>
          <h1>{asset.manufacturer} {asset.model}</h1>
          <p className="muted mono">{asset.assetTag} · {asset.assetType}</p>
        </div>
        {can(P.ASSET_MANAGE) && asset.assignedUid && (
          <button className="secondary-btn" disabled={busy} onClick={returnAsset}>Return asset</button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <h2>Details</h2>
            <dl className="kv two-col">
              <div><dt>Serial number</dt><dd className="mono">{asset.serialNumber}</dd></div>
              <div><dt>Operating system</dt><dd>{asset.operatingSystem}</dd></div>
              <div><dt>Assigned to</dt><dd>{asset.assignedName || "Unassigned"}</dd></div>
              <div><dt>Department</dt><dd>{asset.department}</dd></div>
              <div><dt>Location</dt><dd>{asset.location}</dd></div>
              <div><dt>Lifecycle</dt><dd>{asset.lifecycleStatus}</dd></div>
              <div><dt>Purchased</dt><dd>{formatDate(asset.purchaseDate)}</dd></div>
              <div><dt>Warranty expiry</dt><dd>{formatDate(asset.warrantyExpiry)}</dd></div>
            </dl>
          </section>

          <section className="panel">
            <h2>Support history ({incidents.length})</h2>
            {incidents.length === 0 ? <p className="empty-state">No linked incidents.</p> : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Ticket</th><th>Summary</th><th>Priority</th><th>Status</th></tr></thead>
                  <tbody>
                    {incidents.map((t) => (
                      <tr key={t.id}>
                        <td className="mono"><Link className="link" to={`/app/tickets/${t.id}`}>{t.ticketNumber}</Link></td>
                        <td>{t.shortDescription}</td>
                        <td><PriorityBadge priority={t.priority} /></td>
                        <td><StatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
