import { Navigate } from "react-router-dom";
import { useAuth } from "../components/layout/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <section className="page-section">
        <p>Checking access...</p>
      </section>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}