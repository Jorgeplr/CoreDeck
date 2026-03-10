import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Ticket, TicketStatus } from "@/types";
import TicketCard from "./TicketCard";
import { flowApi } from "../api/flowApi";

const COLUMNS: { status: TicketStatus; label: string; color: string }[] = [
  { status: "OPEN", label: "Abierto", color: "bg-slate-100 dark:bg-slate-800/60" },
  { status: "IN_PROGRESS", label: "En progreso", color: "bg-blue-50 dark:bg-blue-950/30" },
  { status: "IN_REVIEW", label: "En revisión", color: "bg-yellow-50 dark:bg-yellow-950/30" },
  { status: "RESOLVED", label: "Resuelto", color: "bg-green-50 dark:bg-green-950/30" },
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
      {COLUMNS.map(({ status, label, color }) => (
        <div
          key={status}
          className={`${color} rounded-xl p-3 min-h-48`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{label}</span>
            <span className="text-xs text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-700 rounded-full px-2 py-0.5">
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
