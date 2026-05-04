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
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-all duration-200",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
          CD
        </div>
        {sidebarOpen && (
          <span className="ml-3 font-semibold text-lg tracking-tight text-gray-900 dark:text-white">CoreDesk</span>
        )}
      </div>

      {/* Navigation + Groups (scrollable middle area) */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="py-4 space-y-1 px-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
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
      <div className="p-2 border-t border-gray-200 dark:border-slate-700 space-y-1">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white text-sm transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          {sidebarOpen && <span>Colapsar</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-300 text-sm transition-colors"
        >
          <LogOut size={20} className="shrink-0" />
          {sidebarOpen && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
