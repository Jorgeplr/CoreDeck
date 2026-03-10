import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { flowApi } from "../api/flowApi";
import type { TicketPriority, TicketStatus } from "@/types";

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "NORMAL" as TicketPriority,
    status: "OPEN" as TicketStatus,
    dueDate: "",
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
      ...form,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
    });
  };

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

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Título *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Título del ticket"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Descripción
          </label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            placeholder="Describe el problema o tarea..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Prioridad
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TicketPriority }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
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
