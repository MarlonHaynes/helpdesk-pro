import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";
import { isStaffRole } from "../auth/roles";

/**
 * Route guard. Options:
 *   <ProtectedRoute>                         → any signed-in user
 *   <ProtectedRoute requireStaff>            → technicians/specialists/admin
 *   <ProtectedRoute requireAdmin>            → admin only
 *   <ProtectedRoute permission="asset:view">→ any role holding that permission
 *
 * NOTE: this only controls what the SPA renders. Real authorization is enforced
 * by Firestore/Storage rules — a user who bypasses this guard still cannot read
 * or write data their role is not permitted.
 */
export default function ProtectedRoute({
  children,
  requireStaff = false,
  requireAdmin = false,
  permission = null,
}) {
  const { currentUser, role, authLoading, isAdmin, can } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <section className="page-section center-state">
        <div className="spinner" aria-label="Checking access" />
        <p>Checking access…</p>
      </section>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const denied =
    (requireAdmin && !isAdmin) ||
    (requireStaff && !isStaffRole(role)) ||
    (permission && !can(permission));

  if (denied) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
