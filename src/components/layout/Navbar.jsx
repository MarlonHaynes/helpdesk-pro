import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          HelpDesk Pro
        </Link>

        <nav className="navbar-links">
          <NavLink to="/" className="nav-link">
            Home
          </NavLink>
          <NavLink to="/submit-ticket" className="nav-link">
            Submit Ticket
          </NavLink>
          <NavLink to="/my-tickets" className="nav-link">
            My Tickets
          </NavLink>
          <NavLink to="/admin/login" className="nav-link admin-link">
            Admin
          </NavLink>
        </nav>
      </div>
    </header>
  );
}