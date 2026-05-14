import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Square, Trash2, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { timeApi } from "../api/timeApi";
import { useAuthStore } from "@/store/authStore";
import clsx from "clsx";

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const sec = Math.floor((now - new Date(startedAt).getTime()) / 1000);
  return <span className="font-mono">{formatDuration(sec)}</span>;
}

interface Props {
  ticketId: string;
}

export default function TimeTrackingPanel({ ticketId }: Props) {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["flow", "ticket", ticketId, "time"],
    queryFn: () => timeApi.list(ticketId),
    refetchInterval: 30_000,
  });

  const startMutation = useMutation({
    mutationFn: () => timeApi.start(ticketId, note.trim() || undefined),
    onSuccess: () => {
      setNote("");
      qc.invalidateQueries({ queryKey: ["flow", "ticket", ticketId, "time"] });
    },
  });

  const stopMutation = useMutation({
    mutationFn: (entryId: string) => timeApi.stop(entryId, note.trim() || undefined),
    onSuccess: () => {
      setNote("");
      qc.invalidateQueries({ queryKey: ["flow", "ticket", ticketId, "time"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (entryId: string) => timeApi.remove(entryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flow", "ticket", ticketId, "time"] }),
  });

  const myOpen = data?.items.find((e) => e.userId === me?.id && !e.endedAt);

  if (isLoading) return <div className="text-sm text-gray-400 py-4">Cargando…</div>;

  return (
    <div className="space-y-5">
      {/* Header / total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
          <Clock size={15} className="text-primary-600 dark:text-primary-400" />
          <span className="font-semibold">Total</span>
          <span className="font-mono">{formatDuration(data?.totalSec ?? 0)}</span>
        </div>
      </div>

      {/* Start/stop */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
        {myOpen ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">Timer activo</p>
              <p className="text-lg font-mono text-primary-600 dark:text-primary-400">
                <LiveTimer startedAt={myOpen.startedAt} />
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Iniciado {formatDistanceToNow(new Date(myOpen.startedAt), { locale: es, addSuffix: true })}
              </p>
            </div>
            <button
              onClick={() => stopMutation.mutate(myOpen.id)}
              disabled={stopMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
            >
              <Square size={14} fill="currentColor" />
              Detener
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota opcional…"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
            />
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              <Play size={14} fill="currentColor" />
              Iniciar
            </button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
          Historial ({data?.items.length ?? 0})
        </h4>
        {data?.items.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-slate-500 py-4 text-center">
            Aún no se registró tiempo en este ticket.
          </p>
        )}
        {data?.items.map((e) => {
          const isMine = e.userId === me?.id;
          return (
            <div
              key={e.id}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl border",
                e.endedAt
                  ? "border-gray-200 dark:border-slate-700"
                  : "border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/10"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {(e.user?.displayName ?? e.user?.username ?? "?")[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                    {e.user?.displayName ?? e.user?.username ?? "—"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(e.startedAt), "d MMM HH:mm", { locale: es })}
                  </span>
                </div>
                {e.note && <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{e.note}</p>}
              </div>
              <span className="font-mono text-sm text-gray-700 dark:text-slate-300">
                {e.endedAt ? formatDuration(e.durationSec ?? 0) : <LiveTimer startedAt={e.startedAt} />}
              </span>
              {isMine && e.endedAt && (
                <button
                  onClick={() => removeMutation.mutate(e.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
