import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

export default function TopBar() {
  const { theme, toggleTheme } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 px-2 py-1.5 rounded-xl transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                {(user?.displayName ?? user?.username ?? "?")[0].toUpperCase()}
              </span>
            )}
          </div>
          <span className="font-medium">{user?.displayName ?? user?.username}</span>
        </button>
      </div>
    </header>
  );
}
