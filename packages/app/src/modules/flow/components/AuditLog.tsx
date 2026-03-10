import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { TicketHistoryEntry } from "@/types";

const ACTION_LABELS: Record<string, string> = {
  CREATED: "creó el ticket",
  STATUS_CHANGED: "cambió el estado",
  PRIORITY_CHANGED: "cambió la prioridad",
  ASSIGNED: "cambió la asignación",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  RESOLVED: "Resuelto",
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: "Crítico",
  URGENT: "Urgente",
  NORMAL: "Normal",
  LOW: "Bajo",
};

function formatValue(action: string, value: string | null): string {
  if (!value) return "—";
  if (action === "STATUS_CHANGED") return STATUS_LABELS[value] ?? value;
  if (action === "PRIORITY_CHANGED") return PRIORITY_LABELS[value] ?? value;
  return value;
}

interface Props {
  history: TicketHistoryEntry[];
}

export default function AuditLog({ history }: Props) {
  if (history.length === 0) {
    return <p className="text-sm text-gray-400 dark:text-slate-500 py-4">Sin historial aún.</p>;
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 text-sm">
          <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-700 dark:text-primary-300 mt-0.5">
            {(entry.user.displayName ?? entry.user.username).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <span className="font-medium text-gray-900 dark:text-white">
              {entry.user.displayName ?? entry.user.username}
            </span>{" "}
            <span className="text-gray-500 dark:text-slate-400">{ACTION_LABELS[entry.action] ?? entry.action}</span>
            {entry.oldValue && entry.newValue && (
              <span className="text-gray-500 dark:text-slate-400">
                {" "}
                de{" "}
                <span className="font-medium text-gray-700 dark:text-slate-300">
                  {formatValue(entry.action, entry.oldValue)}
                </span>{" "}
                a{" "}
                <span className="font-medium text-gray-700 dark:text-slate-300">
                  {formatValue(entry.action, entry.newValue)}
                </span>
              </span>
            )}
            <div className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: es })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
