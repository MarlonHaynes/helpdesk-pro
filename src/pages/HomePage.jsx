import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <span className="eyebrow">IT Support Workflow Software</span>
          <h1>Modern help desk ticket management for internal support teams.</h1>
          <p>
            HelpDesk Pro is a portfolio-quality IT support ticket system built
            with React and Firebase. It allows users to submit support requests,
            track ticket status, and gives administrators a clean dashboard for
            managing issue resolution.
          </p>

          <div className="hero-actions">
            <Link to="/submit-ticket" className="primary-btn">
              Submit a Ticket
            </Link>
            <Link to="/my-tickets" className="secondary-btn">
              Track Existing Tickets
            </Link>
          </div>

          <div className="hero-mini-stats">
            <div className="mini-stat-card">
              <strong>React + Vite</strong>
              <span>Fast frontend workflow</span>
            </div>
            <div className="mini-stat-card">
              <strong>Firebase</strong>
              <span>Firestore, Auth, Storage</span>
            </div>
            <div className="mini-stat-card">
              <strong>Admin Workflow</strong>
              <span>Status, notes, assignment</span>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-card">
            <h3>What this system includes</h3>
            <ul className="hero-list">
              <li>Public ticket submission form</li>
              <li>User ticket lookup by email</li>
              <li>Admin dashboard with filters</li>
              <li>Technician assignment workflow</li>
              <li>Internal support notes</li>
              <li>Screenshot uploads for issue context</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="feature-grid-section">
        <div className="section-heading">
          <span className="section-label">Core Features</span>
          <h2>Designed to feel like real business software.</h2>
          <p className="section-support-text">
            This project demonstrates practical support workflow design, CRUD
            operations, protected admin access, and a polished responsive UI.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <h3>Ticket Submission</h3>
            <p>
              Users can submit support issues with detailed descriptions,
              priority levels, categories, and optional screenshots.
            </p>
          </article>

          <article className="feature-card">
            <h3>Ticket Tracking</h3>
            <p>
              Users can search by email to view previously submitted requests
              and monitor ticket status changes.
            </p>
          </article>

          <article className="feature-card">
            <h3>Admin Management</h3>
            <p>
              Support admins can review all tickets, update statuses, assign
              technicians, and document internal notes.
            </p>
          </article>

          <article className="feature-card">
            <h3>Portfolio Value</h3>
            <p>
              Demonstrates routing, Firebase integration, CRUD, auth, file
              uploads, filtering, and dashboard-style UI design.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}