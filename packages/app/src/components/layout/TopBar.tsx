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
      <header className="h-16 bg-[var(--app-panel)]/85 border-b border-[var(--app-border)] backdrop-blur-xl flex items-center justify-between px-6 shrink-0 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.6)]">
        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-3 px-4 py-2 rounded-full border border-[var(--app-border)] bg-[var(--app-panel-2)] text-sm text-[var(--app-muted)] hover:text-[var(--app-text)] hover:shadow-sm transition-all"
        >
          <Search size={14} />
          <span>Buscar...</span>
          <kbd className="ml-2 text-xs bg-white/70 dark:bg-white/10 px-2 py-0.5 rounded-full font-mono text-[var(--app-muted)]">⌘K</kbd>
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-[var(--app-muted)] hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-3 text-sm text-[var(--app-text)] hover:bg-[var(--app-panel-2)] px-2.5 py-1.5 rounded-full transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--app-panel-2)] ring-1 ring-[var(--app-border)] flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-[var(--app-accent)]">
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
