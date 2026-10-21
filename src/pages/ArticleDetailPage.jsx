import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";
import { getArticle, submitArticleFeedback } from "../services/kbService";
import formatDate from "../utils/formatDate";

export default function ArticleDetailPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const a = await getArticle(id);
        if (active) setArticle(a);
      } catch (e) {
        console.error(e);
        if (active) setError("Could not load this article (you may not have access).");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  async function vote(helpful) {
    try {
      await submitArticleFeedback(id, currentUser.uid, helpful);
      setFeedbackGiven(true);
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <div className="center-state"><div className="spinner" /><p>Loading…</p></div>;
  if (!article) return (
    <div className="page"><p className="empty-state">{error || "Article not found."}</p>
      <Link className="link" to="/app/knowledge">← Back to Knowledge Base</Link></div>
  );

  // Render the simple markdown-ish body (headings + numbered steps) as text.
  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="crumb"><Link className="link" to="/app/knowledge">← Knowledge Base</Link></div>
          <h1>{article.title}</h1>
          <p className="muted small">
            {article.category} · v{article.version} · by {article.author}
            {article.lastReviewed ? ` · last reviewed ${formatDate(article.lastReviewed)}` : ""}
            {article.visibility === "internal" ? " · Internal" : " · Public"}
          </p>
        </div>
      </div>

      <article className="panel kb-article">
        <pre className="pre">{article.body}</pre>
      </article>

      <div className="panel kb-feedback">
        {feedbackGiven ? (
          <p className="muted">Thanks for your feedback.</p>
        ) : (
          <>
            <span>Was this article helpful?</span>
            <button className="chip-btn" onClick={() => vote(true)}>👍 Yes</button>
            <button className="chip-btn" onClick={() => vote(false)}>👎 No</button>
          </>
        )}
      </div>
    </div>
  );
}
