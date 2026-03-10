import { Check, Trash2, Clock, Bell } from "lucide-react";
import { format, isPast, isWithinInterval, addHours } from "date-fns";
import { es } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contextApi } from "../api/contextApi";
import type { Reminder } from "@/types";
import clsx from "clsx";

interface Props {
  reminder: Reminder;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pendiente", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  NOTIFIED: { label: "Notificado", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  DISMISSED: { label: "Descartado", cls: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400" },
  DONE: { label: "Listo", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
};

export default function ReminderCard({ reminder }: Props) {
  const qc = useQueryClient();
  const due = new Date(reminder.dueAt);
  const overdue = isPast(due) && reminder.status === "PENDING";
  const soon = isWithinInterval(due, { start: new Date(), end: addHours(new Date(), 24) }) && reminder.status === "PENDING";
  const status = STATUS_LABELS[reminder.status] ?? STATUS_LABELS.PENDING;

  const updateMutation = useMutation({
    mutationFn: () => contextApi.updateReminder(reminder.id, { status: "DONE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["context", "reminders"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => contextApi.deleteReminder(reminder.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["context", "reminders"] }),
  });

  return (
    <div className={clsx(
      "bg-white dark:bg-slate-800 rounded-2xl border p-4 flex items-start gap-3 hover:shadow-sm transition-all group",
      overdue
        ? "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10"
        : soon
        ? "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10"
        : "border-gray-100 dark:border-slate-700"
    )}>
      {/* Icon */}
      <div className={clsx(
        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
        overdue ? "bg-red-100 dark:bg-red-900/30" : soon ? "bg-amber-100 dark:bg-amber-900/30" : "bg-gray-100 dark:bg-slate-700"
      )}>
        {overdue || soon ? (
          <Clock size={16} className={overdue ? "text-red-500" : "text-amber-500"} />
        ) : (
          <Bell size={16} className="text-gray-400 dark:text-slate-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={clsx(
          "font-semibold text-sm",
          reminder.status === "DONE"
            ? "line-through text-gray-400 dark:text-slate-500"
            : "text-gray-900 dark:text-white"
        )}>
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{reminder.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className={clsx("text-xs font-medium", overdue ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-slate-400")}>
            {format(due, "d MMM yyyy · HH:mm", { locale: es })}
          </span>
          <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", status.cls)}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {reminder.status !== "DONE" && (
          <button
            onClick={() => updateMutation.mutate()}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-500 dark:hover:text-green-400 transition-colors"
            title="Marcar como listo"
          >
            <Check size={15} />
          </button>
        )}
        <button
          onClick={() => deleteMutation.mutate()}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
