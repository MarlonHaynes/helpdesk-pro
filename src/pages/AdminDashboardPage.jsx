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
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        ticket.ticketCode?.toLowerCase().includes(searchValue) ||
        ticket.fullName?.toLowerCase().includes(searchValue) ||
        (ticket.requesterEmail || ticket.email)?.toLowerCase().includes(searchValue) ||
        ticket.issueTitle?.toLowerCase().includes(searchValue);

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
          <span className="section-label">Support Dashboard</span>
          <h1>Ticket Queue Overview</h1>
          <p>
            Keep track of incoming requests, check workload at a glance, and
            make sure every ticket gets the attention it deserves.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Tickets</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Open</span>
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
        <div className="stat-card">
          <span className="stat-label">High Priority</span>
          <strong>{stats.highPriority}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Showing</span>
          <strong>{filteredTickets.length}</strong>
        </div>
      </section>

      <section className="page-section dashboard-main-section">
        <div className="section-heading dashboard-table-heading">
          <span className="section-label">Ticket Queue</span>
          <h2>All Requests</h2>
          <p>Filter and search through open, in-progress, and resolved tickets.</p>
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

        <div className="table-panel">
          {isLoading ? (
            <p className="loading-text">Loading tickets...</p>
          ) : (
            <TicketTable tickets={filteredTickets} />
          )}
        </div>
      </section>
    </div>
  );
}