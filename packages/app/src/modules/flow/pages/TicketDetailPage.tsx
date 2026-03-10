import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { flowApi } from "../api/flowApi";
import AuditLog from "../components/AuditLog";
import type { TicketStatus, TicketPriority } from "@/types";
import clsx from "clsx";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: "Abierto" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "IN_REVIEW", label: "En revisión" },
  { value: "RESOLVED", label: "Resuelto" },
];

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  URGENT: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  NORMAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  LOW: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400",
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"details" | "history">("details");

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["flow", "ticket", id],
    queryFn: () => flowApi.getTicket(id!),
    enabled: !!id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["flow", "ticket", id, "history"],
    queryFn: () => flowApi.getTicketHistory(id!),
    enabled: tab === "history" && !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<{ status: TicketStatus; priority: TicketPriority }>) =>
      flowApi.updateTicket(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow", "ticket", id] });
      qc.invalidateQueries({ queryKey: ["flow", "tickets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => flowApi.deleteTicket(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow", "tickets"] });
      navigate("/flow");
    },
  });

  if (isLoading) return <div className="text-gray-400 py-16 text-center">Cargando...</div>;
  if (!ticket) return <div className="text-gray-400 py-16 text-center">Ticket no encontrado</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1 truncate">{ticket.title}</h1>
        <button
          onClick={() => deleteMutation.mutate()}
          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-5">
        {/* Status + Priority */}
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Estado</label>
            <select
              value={ticket.status}
              onChange={(e) => updateMutation.mutate({ status: e.target.value as TicketStatus })}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Prioridad</label>
            <span className={clsx("inline-flex px-3 py-1.5 rounded-lg text-sm font-medium", PRIORITY_COLORS[ticket.priority])}>
              {ticket.priority}
            </span>
          </div>
          {ticket.dueDate && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">Fecha límite</label>
              <span className="text-sm text-gray-700 dark:text-slate-300">
                {format(new Date(ticket.dueDate), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {ticket.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Descripción</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>
        )}

        {/* Labels */}
        {ticket.labels.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ticket.labels.map(({ label }) => (
              <span
                key={label.id}
                className="text-xs px-2.5 py-1 rounded-full font-medium text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {/* Assignee & Author */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Creado por</span>
            <span className="font-medium text-gray-800 dark:text-slate-200">
              {ticket.createdBy.displayName ?? ticket.createdBy.username}
            </span>
          </div>
          {ticket.assignedTo && (
            <div>
              <span className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Asignado a</span>
              <span className="font-medium text-gray-800 dark:text-slate-200">
                {ticket.assignedTo.displayName ?? ticket.assignedTo.username}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6">
        <div className="flex gap-4 mb-5 border-b border-gray-200 dark:border-slate-700">
          {(["details", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "pb-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400"
              )}
            >
              {t === "details" ? "Detalles" : "Historial"}
            </button>
          ))}
        </div>
        {tab === "history" && <AuditLog history={history} />}
        {tab === "details" && (
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Creado {format(new Date(ticket.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        )}
      </div>
    </div>
  );
}
