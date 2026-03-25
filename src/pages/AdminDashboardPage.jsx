import { useEffect, useMemo, useState } from "react";
import TicketFilters from "../components/tickets/TicketFilters";
import TicketTable from "../components/tickets/TicketTable";
import { getAllTickets, getTicketStats } from "../services/ticketService";

export default function AdminDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);

      try {
        const [allTickets, ticketStats] = await Promise.all([
          getAllTickets(),
          getTicketStats(),
        ]);

        setTickets(allTickets);
        setStats(ticketStats);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        !searchTerm ||
        ticket.ticketCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.issueTitle?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !selectedStatus || ticket.status === selectedStatus;
      const matchesCategory =
        !selectedCategory || ticket.category === selectedCategory;
      const matchesPriority =
        !selectedPriority || ticket.priority === selectedPriority;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesPriority
      );
    });
  }, [tickets, searchTerm, selectedStatus, selectedCategory, selectedPriority]);

  function handleResetFilters() {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedCategory("");
    setSelectedPriority("");
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-header-card">
        <div>
          <span className="section-label">Admin Dashboard</span>
          <h1>Ticket Management Overview</h1>
          <p>
            Review support requests, search tickets, filter by workflow state,
            and open any ticket for full management details.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Tickets</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Open Tickets</span>
          <strong>{stats.open}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">In Progress</span>
          <strong>{stats.inProgress}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Resolved</span>
          <strong>{stats.resolved}</strong>
        </div>
      </section>

      <section className="stats-grid dashboard-secondary-stats">
        <div className="stat-card">
          <span className="stat-label">High Priority</span>
          <strong>{stats.highPriority}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Filtered Results</span>
          <strong>{filteredTickets.length}</strong>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading dashboard-table-heading">
          <h2>All Tickets</h2>
          <p>Search and filter tickets before opening the full details view.</p>
        </div>

        <TicketFilters
          searchTerm={searchTerm}
          selectedStatus={selectedStatus}
          selectedCategory={selectedCategory}
          selectedPriority={selectedPriority}
          onSearchChange={setSearchTerm}
          onStatusChange={setSelectedStatus}
          onCategoryChange={setSelectedCategory}
          onPriorityChange={setSelectedPriority}
          onReset={handleResetFilters}
        />

        {isLoading ? (
          <p className="loading-text">Loading tickets...</p>
        ) : (
          <TicketTable tickets={filteredTickets} />
        )}
      </section>
    </div>
  );
}