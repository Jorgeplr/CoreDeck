import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import clsx from "clsx";
import type { Ticket, TicketPriority, TicketStatus } from "@/types";

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  RESOLVED: "Resuelto",
};

const STATUS_CLS: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  IN_REVIEW: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  CRITICAL: "Crítico",
  URGENT: "Urgente",
  NORMAL: "Normal",
  LOW: "Bajo",
};

const PRIORITY_CLS: Record<TicketPriority, string> = {
  CRITICAL: "text-red-600 dark:text-red-400 font-semibold",
  URGENT: "text-orange-600 dark:text-orange-400 font-medium",
  NORMAL: "text-blue-600 dark:text-blue-400",
  LOW: "text-gray-400 dark:text-slate-500",
};

interface Props {
  tickets: Ticket[];
}

export default function TicketTable({ tickets }: Props) {
  const navigate = useNavigate();

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-slate-500 text-sm">
        Sin tickets que mostrar
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700 text-left">
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Título</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Prioridad</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Asignado a</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Vence</th>
            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Etiquetas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => navigate(`/flow/tickets/${ticket.id}`)}
              className="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{ticket.title}</p>
                {ticket.scope === "GROUP" && (
                  <span className="text-xs text-primary-500 dark:text-primary-400">grupo</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", STATUS_CLS[ticket.status])}>
                  {STATUS_LABEL[ticket.status]}
                </span>
              </td>
              <td className={clsx("px-4 py-3 text-xs", PRIORITY_CLS[ticket.priority])}>
                {PRIORITY_LABEL[ticket.priority]}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400 hidden sm:table-cell">
                {ticket.assignedTo
                  ? (ticket.assignedTo.displayName ?? ticket.assignedTo.username)
                  : <span className="text-gray-300 dark:text-slate-600">—</span>}
              </td>
              <td className="px-4 py-3 text-gray-500 dark:text-slate-400 hidden md:table-cell">
                {ticket.dueDate
                  ? format(new Date(ticket.dueDate), "d MMM", { locale: es })
                  : <span className="text-gray-300 dark:text-slate-600">—</span>}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {ticket.labels.slice(0, 3).map(({ label }) => (
                    <span
                      key={label.id}
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                  {ticket.labels.length > 3 && (
                    <span className="text-xs text-gray-400">+{ticket.labels.length - 3}</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
