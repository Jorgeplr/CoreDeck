import { NavLink, useNavigate } from "react-router-dom";
import { Shield, Kanban, Bell, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useVaultStore } from "@/store/vaultStore";
import { api } from "@/lib/api";
import clsx from "clsx";

const NAV_ITEMS = [
  { to: "/vault", label: "Vault", icon: Shield },
  { to: "/flow", label: "Flow", icon: Kanban },
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
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-900 text-white transition-all duration-200",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
          CD
        </div>
        {sidebarOpen && (
          <span className="ml-3 font-semibold text-lg tracking-tight">CoreDesk</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            <Icon size={20} className="flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-slate-700 space-y-1">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          {sidebarOpen && <span>Colapsar</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-900/40 hover:text-red-300 text-sm transition-colors"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {sidebarOpen && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
