import { Check, Trash2, Clock } from "lucide-react";
import { format, isPast, isWithinInterval, addHours } from "date-fns";
import { es } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contextApi } from "../api/contextApi";
import type { Reminder } from "@/types";
import clsx from "clsx";

interface Props {
  reminder: Reminder;
}

export default function ReminderCard({ reminder }: Props) {
  const qc = useQueryClient();
  const due = new Date(reminder.dueAt);
  const overdue = isPast(due) && reminder.status === "PENDING";
  const soon = isWithinInterval(due, { start: new Date(), end: addHours(new Date(), 24) });

  const updateMutation = useMutation({
    mutationFn: () => contextApi.updateReminder(reminder.id, { status: "DONE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["context", "reminders"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => contextApi.deleteReminder(reminder.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["context", "reminders"] }),
  });

  const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pendiente",
    NOTIFIED: "Notificado",
    DISMISSED: "Descartado",
    DONE: "Listo",
  };

  return (
    <div
      className={clsx(
        "bg-white dark:bg-slate-800 rounded-xl border p-4 flex items-start gap-3 transition-all",
        overdue
          ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20"
          : soon && reminder.status === "PENDING"
          ? "border-yellow-300 dark:border-yellow-700"
          : "border-gray-200 dark:border-slate-700"
      )}
    >
      <div className={clsx("mt-0.5 flex-shrink-0", overdue ? "text-red-500" : soon ? "text-yellow-500" : "text-gray-400")}>
        <Clock size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            "font-medium text-sm",
            reminder.status === "DONE"
              ? "line-through text-gray-400 dark:text-slate-500"
              : "text-gray-900 dark:text-white"
          )}
        >
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{reminder.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className={clsx("text-xs font-medium", overdue ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-slate-400")}>
            {format(due, "d MMM yyyy, HH:mm", { locale: es })}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400">
            {STATUS_LABELS[reminder.status]}
          </span>
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {reminder.status !== "DONE" && (
          <button
            onClick={() => updateMutation.mutate()}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-500 dark:hover:bg-green-900/30 transition-colors"
            title="Marcar como listo"
          >
            <Check size={15} />
          </button>
        )}
        <button
          onClick={() => deleteMutation.mutate()}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
