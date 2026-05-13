import { NavLink, useNavigate } from "react-router-dom";
import { Shield, Kanban, Bell, ChevronLeft, ChevronRight, LogOut, BarChart2 } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useVaultStore } from "@/store/vaultStore";
import { api } from "@/lib/api";
import GroupsSection from "./GroupsSection";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/vault", label: "Vault", icon: Shield },
  { to: "/flow", label: "Flow", icon: Kanban, end: true },
  { to: "/flow/dashboard", label: "Dashboard", icon: BarChart2 },
  { to: "/context", label: "Context", icon: Bell },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const logout = useAuthStore((s) => s.logout);
  const lock = useVaultStore((s) => s.lock);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      lock();
      navigate("/login");
    }
  };

  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-[var(--app-panel)]/95 border-r border-[var(--app-border)] shadow-[var(--app-shadow)] backdrop-blur-xl transition-all duration-200",
        sidebarOpen ? "w-72" : "w-20"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-5 border-b border-[var(--app-border)]">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--app-accent)] to-[var(--app-accent-2)] flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.5)]">
          CD
        </div>
        {sidebarOpen && (
          <span className="ml-3 font-display text-lg text-[var(--app-text)]">CoreDesk</span>
        )}
      </div>

      {/* Navigation + Groups (scrollable middle area) */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="py-4 space-y-1.5 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-[var(--app-accent)] to-[var(--app-accent-2)] text-white shadow-[0_12px_26px_-20px_rgba(0,0,0,0.6)]"
                    : "text-[var(--app-muted)] hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)]"
                )
              }
            >
              <Icon size={20} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <GroupsSection sidebarOpen={sidebarOpen} />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--app-border)] space-y-1">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[var(--app-muted)] hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)] text-sm transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          {sidebarOpen && <span>Colapsar</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[var(--app-muted)] hover:bg-red-50 hover:text-red-600 text-sm transition-colors"
        >
          <LogOut size={20} className="shrink-0" />
          {sidebarOpen && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
