import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Ticket, TicketStatus } from "@/types";
import TicketCard from "./TicketCard";
import { flowApi } from "../api/flowApi";
import clsx from "clsx";

const COLUMNS: { status: TicketStatus; label: string; bg: string; dot: string; ring: string }[] = [
  {
    status: "OPEN",
    label: "Abierto",
    bg: "bg-gray-100 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700",
    dot: "bg-gray-400 dark:bg-gray-500",
    ring: "ring-gray-400",
  },
  {
    status: "IN_PROGRESS",
    label: "En progreso",
    bg: "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50",
    dot: "bg-blue-500",
    ring: "ring-blue-400",
  },
  {
    status: "IN_REVIEW",
    label: "En revisión",
    bg: "bg-amber-50 dark:bg-yellow-950/30 border border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
    ring: "ring-amber-400",
  },
  {
    status: "RESOLVED",
    label: "Resuelto",
    bg: "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50",
    dot: "bg-green-500",
    ring: "ring-green-400",
  },
];

function DraggableTicket({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={clsx("touch-none", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TicketCard ticket={ticket} />
    </div>
  );
}

function DroppableColumn({
  status,
  label,
  bg,
  dot,
  ring,
  tickets,
}: {
  status: TicketStatus;
  label: string;
  bg: string;
  dot: string;
  ring: string;
  tickets: Ticket[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        bg,
        "rounded-xl p-3 min-h-48 transition-all duration-150",
        isOver && `ring-2 ${ring} ring-offset-1`
      )}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dot}`} />
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{label}</span>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-slate-500 bg-white dark:bg-slate-700 rounded-full px-2 py-0.5 border border-gray-200 dark:border-slate-600">
          {tickets.length}
        </span>
      </div>
      <div className="space-y-2">
        {tickets.map((ticket) => (
          <DraggableTicket key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  tickets: Ticket[];
}

export default function KanbanBoard({ tickets }: Props) {
  const qc = useQueryClient();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      flowApi.updateTicket(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flow", "tickets"] }),
  });

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as TicketStatus;
    const ticket = tickets.find((t) => t.id === active.id);
    if (ticket && ticket.status !== newStatus) {
      updateMutation.mutate({ id: ticket.id, status: newStatus });
    }
  };

  const byStatus = (status: TicketStatus) => tickets.filter((t) => t.status === status);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(({ status, label, bg, dot, ring }) => (
          <DroppableColumn
            key={status}
            status={status}
            label={label}
            bg={bg}
            dot={dot}
            ring={ring}
            tickets={byStatus(status)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeTicket ? (
          <div className="rotate-2 shadow-2xl opacity-95">
            <TicketCard ticket={activeTicket} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
