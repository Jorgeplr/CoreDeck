import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, AtSign, MessageSquare, UserPlus, Clock, AlertTriangle, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import clsx from "clsx";
import { notificationsApi } from "../api/notificationsApi";
import type { NotificationType } from "@/types";

const ICONS: Record<NotificationType, React.ReactNode> = {
  TICKET_ASSIGNED: <UserPlus size={14} className="text-blue-500" />,
  TICKET_MENTIONED: <AtSign size={14} className="text-purple-500" />,
  TICKET_COMMENTED: <MessageSquare size={14} className="text-gray-500" />,
  TICKET_DUE_SOON: <Clock size={14} className="text-orange-500" />,
  REMINDER_DUE: <Clock size={14} className="text-yellow-500" />,
  SLA_BREACHED: <AlertTriangle size={14} className="text-red-500" />,
  VAULT_SHARED: <Share2 size={14} className="text-green-500" />,
};

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(false, 30),
    refetchInterval: 60_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const handleClick = (n: typeof items[number]) => {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full text-[var(--app-muted)] hover:bg-[var(--app-panel-2)] hover:text-[var(--app-text)] transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-[var(--app-panel)] border border-[var(--app-border)] rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--app-border)]">
            <h3 className="font-semibold text-[var(--app-text)] text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1.5 text-xs text-[var(--app-accent)] hover:underline"
              >
                <CheckCheck size={13} />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-12 text-center text-sm text-[var(--app-muted)]">
                Sin notificaciones por aquí.
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={clsx(
                    "group px-4 py-3 border-b border-[var(--app-border)] last:border-b-0 cursor-pointer transition-colors",
                    !n.readAt
                      ? "bg-[var(--app-accent)]/5 hover:bg-[var(--app-accent)]/10"
                      : "hover:bg-[var(--app-panel-2)]"
                  )}
                  onClick={() => handleClick(n)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-7 h-7 rounded-full bg-[var(--app-panel-2)] flex items-center justify-center shrink-0">
                      {ICONS[n.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--app-text)] truncate">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-[var(--app-muted)] line-clamp-2 mt-0.5">{n.body}</p>
                      )}
                      <p className="text-[11px] text-[var(--app-muted)] mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { locale: es, addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.readAt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markRead.mutate(n.id);
                          }}
                          className="p-1 rounded-md hover:bg-[var(--app-panel-2)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
                          title="Marcar como leída"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          remove.mutate(n.id);
                        }}
                        className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-[var(--app-muted)] hover:text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
