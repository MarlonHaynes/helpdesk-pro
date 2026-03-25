import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import formatDate from "../../utils/formatDate";

export default function TicketCard({ ticket }) {
  return (
    <article className="ticket-card">
      <div className="ticket-card-top">
        <div>
          <p className="ticket-code">{ticket.ticketCode}</p>
          <h3>{ticket.issueTitle}</h3>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <div className="ticket-card-meta">
        <span>
          <strong>Category:</strong> {ticket.category}
        </span>
        <span>
          <strong>Priority:</strong> {ticket.priority}
        </span>
        <span>
          <strong>Created:</strong> {formatDate(ticket.createdAt)}
        </span>
      </div>

      <p className="ticket-card-description">{ticket.issueDescription}</p>

      <Link to={`/tickets/${ticket.id}`} className="secondary-btn">
        View Details
      </Link>
    </article>
  );
}