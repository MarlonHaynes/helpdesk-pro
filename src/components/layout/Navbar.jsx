import { Link, NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-mark" aria-hidden="true">
            <img src="/logo.png" alt="" className="logo-img" />
          </span>
          <span className="brand-text-wrap">
            <strong>HelpDesk Pro</strong>
            <span>Enterprise IT Service Desk</span>
          </span>
        </Link>

        <nav className="navbar-links" aria-label="Primary">
          <NavLink to="/" className="nav-link" end>Home</NavLink>
          {isAuthenticated ? (
            <Link to="/app" className="nav-link admin-link">Open App</Link>
          ) : (
            <Link to="/login" className="nav-link admin-link">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
