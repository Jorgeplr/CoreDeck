import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Ticket, TicketStatus } from "@/types";
import TicketCard from "./TicketCard";
import { flowApi } from "../api/flowApi";

const COLUMNS: { status: TicketStatus; label: string; bg: string; dot: string }[] = [
  {
    status: "OPEN",
    label: "Abierto",
    bg: "bg-gray-100 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700",
    dot: "bg-gray-400 dark:bg-gray-500",
  },
  {
    status: "IN_PROGRESS",
    label: "En progreso",
    bg: "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50",
    dot: "bg-blue-500",
  },
  {
    status: "IN_REVIEW",
    label: "En revisión",
    bg: "bg-amber-50 dark:bg-yellow-950/30 border border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  {
    status: "RESOLVED",
    label: "Resuelto",
    bg: "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50",
    dot: "bg-green-500",
  },
];

interface Props {
  tickets: Ticket[];
}

export default function KanbanBoard({ tickets }: Props) {
  const qc = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      flowApi.updateTicket(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flow", "tickets"] }),
  });

  const handleDrop = (e: React.DragEvent, targetStatus: TicketStatus) => {
    const ticketId = e.dataTransfer.getData("ticketId");
    if (ticketId) updateMutation.mutate({ id: ticketId, status: targetStatus });
  };

  const byStatus = (status: TicketStatus) => tickets.filter((t) => t.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map(({ status, label, bg, dot }) => (
        <div
          key={status}
          className={`${bg} rounded-xl p-3 min-h-48`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{label}</span>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-slate-500 bg-white dark:bg-slate-700 rounded-full px-2 py-0.5 border border-gray-200 dark:border-slate-600">
              {byStatus(status).length}
            </span>
          </div>
          <div className="space-y-2">
            {byStatus(status).map((ticket) => (
              <div
                key={ticket.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("ticketId", ticket.id)}
              >
                <TicketCard ticket={ticket} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
