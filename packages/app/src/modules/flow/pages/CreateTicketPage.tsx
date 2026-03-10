import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flowApi } from "../api/flowApi";
import { groupsApi } from "@/modules/groups/api/groupsApi";
import type { TicketPriority, TicketScope, TicketStatus } from "@/types";
import clsx from "clsx";

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [scope, setScope] = useState<TicketScope>("INDIVIDUAL");
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "NORMAL" as TicketPriority,
    status: "OPEN" as TicketStatus,
    dueDate: "",
    groupId: "",
    assignedToId: "",
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.listGroups,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["groups", form.groupId, "members"],
    queryFn: () => groupsApi.getMembers(form.groupId),
    enabled: scope === "GROUP" && !!form.groupId,
  });

  const mutation = useMutation({
    mutationFn: flowApi.createTicket,
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ["flow", "tickets"] });
      navigate(`/flow/tickets/${ticket.id}`);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      status: form.status,
      scope,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      groupId: scope === "GROUP" && form.groupId ? form.groupId : undefined,
      assignedToId: form.assignedToId || undefined,
    });
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo ticket</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-5">
        {/* Scope selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Tipo de ticket
          </label>
          <div className="flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden">
            {(["INDIVIDUAL", "GROUP"] as TicketScope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setScope(s);
                  setForm((p) => ({ ...p, groupId: "", assignedToId: "" }));
                }}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors",
                  scope === s
                    ? "bg-primary-600 text-white"
                    : "bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600"
                )}
              >
                {s === "INDIVIDUAL" ? <User size={15} /> : <Users size={15} />}
                {s === "INDIVIDUAL" ? "Personal" : "Grupo"}
              </button>
            ))}
          </div>
        </div>

        {/* Group selector */}
        {scope === "GROUP" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Grupo *
            </label>
            {groups.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500">
                No perteneces a ningún grupo aún.
              </p>
            ) : (
              <select
                required
                value={form.groupId}
                onChange={(e) => setForm((p) => ({ ...p, groupId: e.target.value, assignedToId: "" }))}
                className={inputCls}
              >
                <option value="">Seleccionar grupo...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Assignee (from group members) */}
        {scope === "GROUP" && form.groupId && members.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Asignar a
            </label>
            <select
              value={form.assignedToId}
              onChange={(e) => setForm((p) => ({ ...p, assignedToId: e.target.value }))}
              className={inputCls}
            >
              <option value="">Sin asignar</option>
              {members.map(({ user }) => (
                <option key={user.id} value={user.id}>
                  {user.displayName ?? user.username} ({user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Título *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className={inputCls}
            placeholder="Título del ticket"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Descripción
          </label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className={`${inputCls} resize-none`}
            placeholder="Describe el problema o tarea..."
          />
        </div>

        {/* Priority + Due date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Prioridad
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TicketPriority }))}
              className={inputCls}
            >
              <option value="CRITICAL">Crítico</option>
              <option value="URGENT">Urgente</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Bajo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Fecha límite
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              className={inputCls}
            />
          </div>
        </div>

        {mutation.isError && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-4 py-3 rounded-lg">
            Error al crear el ticket
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {mutation.isPending ? "Creando..." : "Crear ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
