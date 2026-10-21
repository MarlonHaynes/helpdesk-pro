import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";
import { getTicketsForRequester } from "../services/ticketService";
import { toTicketViews } from "../domain/ticketView";
import { PriorityBadge, StatusBadge, SlaBadge } from "../components/tickets/Badges";

export default function MyTicketsPage() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await getTicketsForRequester(currentUser.uid);
        if (active) setTickets(raw);
      } catch (e) {
        console.error(e);
        if (active) setError("Could not load your tickets.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [currentUser]);

  const views = useMemo(() => toTicketViews(tickets), [tickets]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My Tickets</h1>
          <p className="muted">Requests you have submitted.</p>
        </div>
        <Link to="/app/submit" className="primary-btn">New Request</Link>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <div className="center-state"><div className="spinner" /><p>Loading…</p></div>
      ) : views.length === 0 ? (
        <p className="empty-state">You haven't submitted any requests yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Ticket</th><th>Summary</th><th>Priority</th><th>Status</th><th>SLA</th><th></th></tr>
            </thead>
            <tbody>
              {views.map((t) => (
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
    </div>
  );
}
