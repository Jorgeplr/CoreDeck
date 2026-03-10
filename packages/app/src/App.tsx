import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
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

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function AuthInit() {
  const { setAuth, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Use plain axios (not api instance) to avoid triggering the 401 interceptor loop
    axios
      .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => setAuth(data.accessToken, data.user))
      .catch(() => logout());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for forced logout from interceptor
  useEffect(() => {
    const handler = () => {
      logout();
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [logout, navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInit />
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
