import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <span className="eyebrow">Modern IT Support Workflow</span>
          <h1>Professional help desk ticket management for support teams.</h1>
          <p>
            HelpDesk Pro is a portfolio-quality IT support ticket system built
            with React, Firebase, and a modern SaaS-style interface. Users can
            submit support requests, track tickets, and admins can manage
            issues through a clean dashboard.
          </p>

          <div className="hero-actions">
            <Link to="/submit-ticket" className="primary-btn">
              Submit a Ticket
            </Link>
            <Link to="/my-tickets" className="secondary-btn">
              View My Tickets
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-card">
            <h3>System Snapshot</h3>
            <ul className="hero-list">
              <li>Ticket submission workflow</li>
              <li>Status tracking</li>
              <li>Priority and category management</li>
              <li>Admin dashboard controls</li>
              <li>Optional screenshot uploads</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="feature-grid-section">
        <div className="section-heading">
          <span className="section-label">Core Features</span>
          <h2>Built to look and feel like real business software.</h2>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <h3>Ticket Submission</h3>
            <p>
              Users can submit support requests with issue details, category,
              priority, and optional screenshots.
            </p>
          </article>

          <article className="feature-card">
            <h3>Ticket Tracking</h3>
            <p>
              Users can search by email to view previously submitted tickets and
              track status updates.
            </p>
          </article>

          <article className="feature-card">
            <h3>Admin Management</h3>
            <p>
              Admins can review all tickets, update statuses, assign
              technicians, and document internal notes.
            </p>
          </article>

          <article className="feature-card">
            <h3>Portfolio Ready</h3>
            <p>
              Designed to demonstrate React, Firebase, CRUD workflows, auth,
              storage, filtering, and dashboard UI.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}