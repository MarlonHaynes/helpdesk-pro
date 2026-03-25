import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import formatDate from "../../utils/formatDate";

export default function TicketTable({ tickets }) {
  if (!tickets.length) {
    return <p className="empty-state-text">No tickets found.</p>;
  }

  return (
    <div className="ticket-table-wrapper">
      <table className="ticket-table">
        <thead>
          <tr>
            <th>Ticket Code</th>
            <th>Requester</th>
            <th>Issue</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Date Created</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>{ticket.ticketCode}</td>
              <td>
                <div className="ticket-requester-cell">
                  <strong>{ticket.fullName}</strong>
                  <span>{ticket.email}</span>
                </div>
              </td>
              <td>{ticket.issueTitle}</td>
              <td>{ticket.category}</td>
              <td>{ticket.priority}</td>
              <td>
                <StatusBadge status={ticket.status} />
              </td>
              <td>{formatDate(ticket.createdAt)}</td>
              <td>
                <Link to={`/tickets/${ticket.id}`} className="table-link-btn">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}