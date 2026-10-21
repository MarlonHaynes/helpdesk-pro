import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { PERMISSIONS as P, roleLabel } from "../../auth/roles";
import NotificationCenter from "./NotificationCenter";

// Sidebar items. Each item declares the permission needed to see it; items a
// role cannot use are hidden (no dead links). `built` marks modules that are
// implemented — unbuilt modules are omitted from navigation rather than shown
// as fake links.
const NAV = [
  { to: "/app", label: "Dashboard", icon: "grid", end: true },
  { to: "/app/guide", label: "Guided Demo", icon: "map" },
  { to: "/app/tickets", label: "Ticket Queue", icon: "inbox", perm: P.TICKET_VIEW_ALL },
  { to: "/app/my-tickets", label: "My Tickets", icon: "ticket", perm: P.TICKET_VIEW_OWN },
  { to: "/app/submit", label: "Submit Request", icon: "plus", perm: P.TICKET_CREATE },
  { to: "/app/workbench", label: "Workbench", icon: "wrench", perm: P.WORKBENCH_RUN },
  { to: "/app/knowledge", label: "Knowledge Base", icon: "book", perm: P.KB_VIEW_PUBLIC },
  { to: "/app/assets", label: "Assets", icon: "monitor", perm: P.ASSET_VIEW },
  { to: "/app/identity", label: "Identity Lab", icon: "users", perm: P.IDENTITY_VIEW },
  { to: "/app/approvals", label: "Approvals", icon: "check", perm: P.APPROVAL_REQUEST },
  { to: "/app/reports", label: "Reports", icon: "chart", perm: P.REPORTS_TEAM },
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
    wrench: "M14 7a4 4 0 0 1-5 5l-6 6 2 2 6-6a4 4 0 0 0 5-5z",
    book: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM8 7h8M8 11h8",
    monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
    users: "M16 18v-2a4 4 0 0 0-8 0v2M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
    check: "M4 12l5 5L20 6",
    bell: "M6 8a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7M10 21h4",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    map: "M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15",
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
          <NotificationCenter />
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
