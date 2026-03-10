import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
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
import GroupDetailPage from "@/modules/groups/pages/GroupDetailPage";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

function AuthInit() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const attempted = useRef(false);

  // Silent refresh on startup — runs once, 401 is expected when no session exists
  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    axios
      .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => setAuth(data.accessToken, data.user))
      .catch(() => {
        // No session cookie — user is not logged in, stay on current page
      });
  }, [setAuth]);

  // Listen for forced logout dispatched by the Axios interceptor
  useEffect(() => {
    const handler = () => navigate("/login", { replace: true });
    window.addEventListener("auth:logout", handler);
    return () => window.removeEventListener("auth:logout", handler);
  }, [navigate]);

  return null;
}

function ThemeSync() {
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeSync />
      <AuthInit />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
            <Route path="/groups/:id" element={<GroupDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
