import { useEffect, useState } from "react";
import { Sun, Moon, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import SearchModal from "@/components/search/SearchModal";

export default function TopBar() {
  const { theme, toggleTheme } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="h-14 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shrink-0">
        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-sm text-gray-400 dark:text-slate-500 hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
        >
          <Search size={14} />
          <span>Buscar...</span>
          <kbd className="ml-2 text-xs bg-gray-100 dark:bg-slate-600 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </button>

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

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
