import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";
import { getArticles } from "../services/kbService";

export default function KnowledgeBasePage() {
  const { isStaff } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getArticles({ isStaff });
        if (active) setArticles(data);
      } catch (e) {
        console.error(e);
        if (active) setError("Could not load knowledge articles.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isStaff]);

  const categories = useMemo(
    () => [...new Set(articles.map((a) => a.category))].sort(),
    [articles]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return articles.filter((a) => {
      if (cat && a.category !== cat) return false;
      if (term) {
        const hay = `${a.title} ${a.category} ${(a.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [articles, q, cat]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Knowledge Base</h1>
          <p className="muted">{filtered.length} article{filtered.length === 1 ? "" : "s"}{isStaff ? " (incl. internal)" : ""}.</p>
        </div>
      </div>

      <div className="filters">
        <input className="filter-search" placeholder="Search titles, tags…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <div className="center-state"><div className="spinner" /><p>Loading…</p></div>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No articles match.</p>
      ) : (
        <div className="kb-grid">
          {filtered.map((a) => (
            <Link key={a.id} to={`/app/knowledge/${a.id}`} className="kb-card">
              <div className="kb-card-top">
                <span className="kb-cat">{a.category}</span>
                {a.visibility === "internal" && <span className="kb-internal">Internal</span>}
              </div>
              <h3>{a.title}</h3>
              <div className="kb-tags">
                {(a.tags || []).slice(0, 4).map((t) => <span key={t} className="kb-tag">#{t}</span>)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
