import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "../../utils/constants";

export default function TicketFilters({
  searchTerm,
  selectedStatus,
  selectedCategory,
  selectedPriority,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onPriorityChange,
  onReset,
}) {
  return (
    <div className="filter-panel">
      <div className="filter-grid">
        <div className="form-group">
          <label htmlFor="searchTerm">Search</label>
          <input
            id="searchTerm"
            type="text"
            placeholder="Search by ticket code, name, email, or issue"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="statusFilter">Status</label>
          <select
            id="statusFilter"
            value={selectedStatus}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            <option value="">All Statuses</option>
            {TICKET_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="categoryFilter">Category</label>
          <select
            id="categoryFilter"
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">All Categories</option>
            {TICKET_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priorityFilter">Priority</label>
          <select
            id="priorityFilter"
            value={selectedPriority}
            onChange={(event) => onPriorityChange(event.target.value)}
          >
            <option value="">All Priorities</option>
            {TICKET_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" className="secondary-btn" onClick={onReset}>
        Reset Filters
      </button>
    </div>
  );
}