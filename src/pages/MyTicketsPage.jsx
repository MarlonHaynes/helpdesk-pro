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

    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();

    try {
      const results = await getTicketsByEmail(normalizedEmail);
      setTickets(results);
    } catch (error) {
      console.error("Error fetching tickets in MyTicketsPage", {
        inputEmail: email,
        trimmedEmail,
        normalizedEmail,
        errorCode: error?.code,
        errorMessage: error?.message,
        error,
      });
      setErrorMessage("Unable to fetch tickets right now.");
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="my-tickets-page">
      <section className="page-section page-intro-card">
        <span className="section-label">My Tickets</span>
        <h1>Check in on your support requests.</h1>
        <p>
          Enter the email address you used when submitting your ticket and
          we&apos;ll show you everything associated with it.
        </p>
      </section>

      <section className="page-section lookup-card">
        <form onSubmit={handleSubmit} className="lookup-form">
          <div className="form-group">
            <label htmlFor="lookupEmail">Email Address</label>
            <input
              id="lookupEmail"
              type="email"
              placeholder="you@company.com"
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
                <p>Here&apos;s everything we have on file for that email address.</p>
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
              <p>
                We couldn&apos;t find any requests for that email address. Double-check
                the spelling, or submit a new ticket to get started.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}