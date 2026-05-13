import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Ticket, FileText, Shield, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import clsx from "clsx";

interface SearchResult {
  tickets: Array<{ id: string; title: string; status: string; priority: string }>;
  notes: Array<{ id: string; title: string; isCollaborative: boolean }>;
  vault: Array<{ id: string; title: string; url: string | null }>;
}

interface Props {
  onClose: () => void;
}

export default function SearchModal({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    setLoading(true);
    const timeout = setTimeout(() => {
      api
        .get<SearchResult>(`/search?q=${encodeURIComponent(query)}`)
        .then((r) => { setResults(r.data); setSelected(0); })
        .catch(() => setResults(null))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  type FlatResult = { label: string; sub?: string; icon: React.ReactNode; path: string };

  const flat: FlatResult[] = [
    ...(results?.tickets.map((t) => ({
      label: t.title,
      sub: `Ticket · ${t.status}`,
      icon: <Ticket size={14} className="text-teal-500" />,
      path: `/flow/tickets/${t.id}`,
    })) ?? []),
    ...(results?.notes.map((n) => ({
      label: n.title,
      sub: n.isCollaborative ? "Nota colaborativa" : "Nota personal",
      icon: <FileText size={14} className="text-sky-500" />,
      path: `/context/notes/${n.id}`,
    })) ?? []),
    ...(results?.vault.map((v) => ({
      label: v.title,
      sub: v.url ?? "Vault",
      icon: <Shield size={14} className="text-amber-500" />,
      path: `/vault`,
    })) ?? []),
  ];

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, flat.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && flat[selected]) { go(flat[selected].path); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--app-panel)] rounded-3xl shadow-[var(--app-shadow)] ring-1 ring-[var(--app-border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--app-border)]">
          {loading ? (
            <Loader2 size={16} className="text-gray-400 animate-spin shrink-0" />
          ) : (
            <Search size={16} className="text-gray-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar tickets, notas, vault..."
            className="flex-1 text-sm text-[var(--app-text)] bg-transparent outline-none placeholder-[var(--app-muted)]"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-[var(--app-text)]">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        {flat.length > 0 && (
          <ul className="py-2 max-h-80 overflow-y-auto">
            {flat.map((item, i) => (
              <li key={i}>
                <button
                  onClick={() => go(item.path)}
                  onMouseEnter={() => setSelected(i)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    i === selected
                      ? "bg-[var(--app-panel-2)]"
                      : "hover:bg-[var(--app-panel-2)]/70"
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--app-text)] truncate">{item.label}</p>
                    {item.sub && (
                      <p className="text-xs text-[var(--app-muted)] truncate">{item.sub}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.length >= 2 && !loading && flat.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">
            Sin resultados para "{query}"
          </p>
        )}

        <div className="px-4 py-2 border-t border-[var(--app-border)] flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span>Esc cerrar</span>
        </div>
      </div>
    </div>
  );
}
