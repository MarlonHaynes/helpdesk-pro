import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { PERMISSIONS as P, roleLabel } from "../../auth/roles";

// Sidebar items. Each item declares the permission needed to see it; items a
// role cannot use are hidden (no dead links). `built` marks modules that are
// implemented — unbuilt modules are omitted from navigation rather than shown
// as fake links.
const NAV = [
  { to: "/app", label: "Dashboard", icon: "grid", end: true },
  { to: "/app/tickets", label: "Ticket Queue", icon: "inbox", perm: P.TICKET_VIEW_ALL },
  { to: "/app/my-tickets", label: "My Tickets", icon: "ticket", perm: P.TICKET_VIEW_OWN },
  { to: "/app/submit", label: "Submit Request", icon: "plus", perm: P.TICKET_CREATE },
  { to: "/app/audit", label: "Audit Log", icon: "shield", perm: P.ADMIN_AUDIT },
];

function Icon({ name }) {
  // Minimal inline icon set (no external icon font).
  const paths = {
    grid: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
    inbox: "M3 4h18v12H3zM3 16l3 4h12l3-4",
    ticket: "M4 7h16v4a2 2 0 0 0 0 4v2H4v-2a2 2 0 0 0 0-4z",
    plus: "M12 5v14M5 12h14",
    shield: "M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z",
  };
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? paths.grid} />
    </svg>
  );
}

export default function AppShell() {
  const { role, profile, currentUser, can, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((item) => !item.perm || can(item.perm));

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const name = profile?.displayName || currentUser?.email || "User";

  return (
    <div className={`shell ${open ? "shell--open" : ""}`}>
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <Link to="/app" className="shell-brand-link">
            <img src="/logo.png" alt="" className="shell-logo" />
            <span>HelpDesk Pro</span>
          </Link>
        </div>
        <nav className="shell-nav" aria-label="Primary">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="shell-nav-link"
              onClick={() => setOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="shell-sim-badge">Demo / Simulated Environment</div>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <button
            className="shell-menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <div className="shell-topbar-spacer" />
          <div className="shell-user">
            <span className="shell-user-name">{name}</span>
            <span className="role-chip">{roleLabel(role)}</span>
            <button className="nav-logout-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </header>
        <main className="shell-content">
          <Outlet />
        </main>
      </div>
      {open && <div className="shell-overlay" onClick={() => setOpen(false)} />}
    </div>
  );
}
