import { Routes, Route, Navigate } from "react-router-dom";
import PageLayout from "./components/layout/PageLayout";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./routes/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TicketQueuePage from "./pages/TicketQueuePage";
import TicketDetailPage from "./pages/TicketDetailPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import SubmitTicketPage from "./pages/SubmitTicketPage";
import AuditPage from "./pages/AuditPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import WorkbenchPage from "./pages/WorkbenchPage";
import AssetsPage from "./pages/AssetsPage";
import AssetDetailPage from "./pages/AssetDetailPage";
import IdentityLabPage from "./pages/IdentityLabPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import NotFoundPage from "./pages/NotFoundPage";
import { PERMISSIONS as P } from "./auth/roles";

export default function App() {
  return (
    <Routes>
      {/* Public marketing + auth */}
      <Route element={<PageLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated enterprise app */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route
          path="tickets"
          element={
            <ProtectedRoute permission={P.TICKET_VIEW_ALL}>
              <TicketQueuePage />
            </ProtectedRoute>
          }
        />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="my-tickets" element={<MyTicketsPage />} />
        <Route path="knowledge" element={<KnowledgeBasePage />} />
        <Route path="knowledge/:id" element={<ArticleDetailPage />} />
        <Route
          path="workbench"
          element={
            <ProtectedRoute permission={P.WORKBENCH_RUN}>
              <WorkbenchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="assets"
          element={
            <ProtectedRoute permission={P.ASSET_VIEW}>
              <AssetsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="assets/:id"
          element={
            <ProtectedRoute permission={P.ASSET_VIEW}>
              <AssetDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="identity"
          element={
            <ProtectedRoute permission={P.IDENTITY_VIEW}>
              <IdentityLabPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="approvals"
          element={
            <ProtectedRoute permission={P.APPROVAL_REQUEST}>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="submit"
          element={
            <ProtectedRoute permission={P.TICKET_CREATE}>
              <SubmitTicketPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit"
          element={
            <ProtectedRoute requireAdmin>
              <AuditPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Legacy redirects from the pre-upgrade app */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/submit-ticket" element={<Navigate to="/app/submit" replace />} />
      <Route path="/my-tickets" element={<Navigate to="/app/my-tickets" replace />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
