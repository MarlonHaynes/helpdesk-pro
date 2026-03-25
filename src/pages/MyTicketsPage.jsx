import { useState } from "react";
import TicketCard from "../components/tickets/TicketCard";
import { getTicketsByEmail } from "../services/ticketService";

export default function MyTicketsPage() {
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setHasSearched(true);
    setIsLoading(true);

    try {
      const results = await getTicketsByEmail(email.trim().toLowerCase());
      setTickets(results);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setErrorMessage("Unable to fetch tickets right now.");
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="my-tickets-page">
      <section className="page-section page-intro-card">
        <span className="section-label">User Portal</span>
        <h1>My Tickets</h1>
        <p>
          Enter the email address used when submitting a support request to view
          ticket history and current statuses.
        </p>
      </section>

      <section className="page-section lookup-card">
        <form onSubmit={handleSubmit} className="lookup-form">
          <div className="form-group">
            <label htmlFor="lookupEmail">Email Address</label>
            <input
              id="lookupEmail"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? "Searching..." : "Find My Tickets"}
          </button>
        </form>

        {errorMessage && <p className="form-error lookup-error">{errorMessage}</p>}
      </section>

      {hasSearched && !isLoading && (
        <section className="tickets-results-section">
          {tickets.length ? (
            <>
              <div className="results-header">
                <h2>Found {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</h2>
                <p>Review your support requests below.</p>
              </div>

              <div className="ticket-card-grid">
                {tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </>
          ) : (
            <div className="page-section empty-state-card">
              <h2>No tickets found</h2>
              <p>No support requests were found for that email address.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}