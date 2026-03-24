export default function AdminDashboardPage() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-header-card">
        <div>
          <span className="section-label">Admin Dashboard</span>
          <h1>Ticket Management Overview</h1>
          <p>
            Review incoming support tickets, filter requests, and manage issue
            resolution workflow.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Open Tickets</span>
          <strong>0</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">In Progress</span>
          <strong>0</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Resolved</span>
          <strong>0</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">High Priority</span>
          <strong>0</strong>
        </div>
      </section>

      <section className="page-section">
        <h2>All Tickets</h2>
        <p>Ticket table and filters will be added in the next phase.</p>
      </section>
    </div>
  );
}