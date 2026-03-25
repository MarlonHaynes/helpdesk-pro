import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { logoutAdmin } from "../../services/authService";

export default function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logoutAdmin();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-mark" aria-hidden="true">
            <img src="/logo.png" alt="HelpDesk Pro Logo" className="logo-img" />
          </span>
          <span className="brand-text-wrap">
            <strong>HelpDesk Pro</strong>
            <span>Customer Support</span>
          </span>
        </Link>

        <nav className="navbar-links" aria-label="Primary">
          <NavLink to="/" className="nav-link">
            Home
          </NavLink>

          <NavLink to="/submit-ticket" className="nav-link">
            Submit Ticket
          </NavLink>

          <NavLink to="/my-tickets" className="nav-link">
            My Tickets
          </NavLink>

          <span className="navbar-divider" aria-hidden="true" />

          {currentUser ? (
            <>
              <NavLink to="/admin/dashboard" className="nav-link admin-link">
                Dashboard
              </NavLink>
              <button onClick={handleLogout} className="nav-logout-btn">
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/admin/login" className="nav-link admin-link">
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}