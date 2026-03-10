import { useNavigate } from "react-router-dom";
import { Calendar, User, Users } from "lucide-react";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import type { Ticket, TicketPriority } from "@/types";
import clsx from "clsx";

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  URGENT: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  NORMAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  LOW: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  CRITICAL: "Crítico",
  URGENT: "Urgente",
  NORMAL: "Normal",
  LOW: "Bajo",
};

interface Props {
  ticket: Ticket;
}

export default function TicketCard({ ticket }: Props) {
  const navigate = useNavigate();
  const overdue = ticket.dueDate && isPast(new Date(ticket.dueDate)) && ticket.status !== "RESOLVED";

  return (
    <div
      onClick={() => navigate(`/flow/tickets/${ticket.id}`)}
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 cursor-pointer hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
          {ticket.title}
        </h3>
        <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", PRIORITY_COLORS[ticket.priority])}>
          {PRIORITY_LABELS[ticket.priority]}
        </span>
      </div>

      {ticket.description && (
        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-3">
          {ticket.description}
        </p>
      )}

      {ticket.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {ticket.labels.map(({ label }) => (
            <span
              key={label.id}
              className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500">
        <div className="flex items-center gap-2">
          {ticket.scope === "GROUP" && (
            <div className="flex items-center gap-1 text-primary-500">
              <Users size={12} />
            </div>
          )}
          {ticket.assignedTo ? (
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>{ticket.assignedTo.displayName ?? ticket.assignedTo.username}</span>
            </div>
          ) : null}
        </div>
        {ticket.dueDate && (
          <div className={clsx("flex items-center gap-1", overdue && "text-red-500")}>
            <Calendar size={12} />
            <span>{format(new Date(ticket.dueDate), "d MMM", { locale: es })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
