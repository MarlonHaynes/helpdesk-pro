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
              Admin
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}