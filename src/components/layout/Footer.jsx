import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <strong>HelpDesk Pro</strong>
          <p>Friendly, straightforward support for everyone.</p>
        </div>

        <nav className="footer-nav" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/submit-ticket">Submit a Ticket</Link>
          <Link to="/my-tickets">My Tickets</Link>
          <Link to="/admin/login">Admin Login</Link>
        </nav>
      </div>

      <p className="footer-copy">
        &copy; {year} HelpDesk Pro. Built to make support a little easier.
      </p>
    </footer>
  );
}
