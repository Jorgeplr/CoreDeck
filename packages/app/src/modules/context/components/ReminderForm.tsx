import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contextApi } from "../api/contextApi";

interface Props {
  onClose: () => void;
}

export default function ReminderForm({ onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", dueAt: "" });

  const mutation = useMutation({
    mutationFn: () =>
      contextApi.createReminder({
        ...form,
        dueAt: new Date(form.dueAt).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["context", "reminders"] });
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo recordatorio</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Título *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Descripción</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Fecha y hora *</label>
            <input
              type="datetime-local"
              required
              value={form.dueAt}
              onChange={(e) => setForm((p) => ({ ...p, dueAt: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {mutation.isError && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-4 py-3 rounded-lg">
              Error al crear el recordatorio
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
