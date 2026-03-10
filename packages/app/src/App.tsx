import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/modules/auth/pages/LoginPage";
import RegisterPage from "@/modules/auth/pages/RegisterPage";
import VaultPage from "@/modules/vault/pages/VaultPage";
import VaultUnlockPage from "@/modules/vault/pages/VaultUnlockPage";
import FlowPage from "@/modules/flow/pages/FlowPage";
import TicketDetailPage from "@/modules/flow/pages/TicketDetailPage";
import CreateTicketPage from "@/modules/flow/pages/CreateTicketPage";
import ContextPage from "@/modules/context/pages/ContextPage";
import NoteDetailPage from "@/modules/context/pages/NoteDetailPage";

export default function App() {
  const { setAuth, logout } = useAuthStore();

  // Attempt silent token refresh on startup
  useEffect(() => {
    api
      .post("/auth/refresh")
      .then(({ data }) => setAuth(data.accessToken, data.user))
      .catch(() => logout());
  }, [setAuth, logout]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/vault" replace />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/vault/unlock" element={<VaultUnlockPage />} />
            <Route path="/flow" element={<FlowPage />} />
            <Route path="/flow/tickets/new" element={<CreateTicketPage />} />
            <Route path="/flow/tickets/:id" element={<TicketDetailPage />} />
            <Route path="/context" element={<ContextPage />} />
            <Route path="/context/notes/:id" element={<NoteDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
