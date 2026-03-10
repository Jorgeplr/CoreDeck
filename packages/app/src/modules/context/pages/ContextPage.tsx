import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, FileText, Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { contextApi } from "../api/contextApi";
import ReminderCard from "../components/ReminderCard";
import ReminderForm from "../components/ReminderForm";

export default function ContextPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"notes" | "reminders">("notes");
  const [showReminderForm, setShowReminderForm] = useState(false);

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["context", "notes"],
    queryFn: () => contextApi.listNotes(),
    enabled: tab === "notes",
  });

  const { data: reminders = [], isLoading: remindersLoading } = useQuery({
    queryKey: ["context", "reminders"],
    queryFn: () => contextApi.listReminders(),
    enabled: tab === "reminders",
  });

  const deleteNoteMutation = useMutation({
    mutationFn: contextApi.deleteNote,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["context", "notes"] }),
  });

  const createNoteMutation = useMutation({
    mutationFn: () => contextApi.createNote({ title: "Nueva nota", content: "" }),
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ["context", "notes"] });
      navigate(`/context/notes/${note.id}`);
    },
  });

  const pendingReminders = reminders.filter((r) => r.status === "PENDING" || r.status === "NOTIFIED");
  const doneReminders = reminders.filter((r) => r.status === "DONE" || r.status === "DISMISSED");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Context</h1>
        <button
          onClick={() => (tab === "notes" ? createNoteMutation.mutate() : setShowReminderForm(true))}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} />
          {tab === "notes" ? "Nueva nota" : "Nuevo recordatorio"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {([
          { key: "notes", label: "Notas", icon: FileText },
          { key: "reminders", label: "Recordatorios", icon: Bell },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700"
            }`}
          >
            <Icon size={15} />
            {label}
            {key === "reminders" && pendingReminders.length > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
                {pendingReminders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notes tab */}
      {tab === "notes" && (
        <>
          {notesLoading ? (
            <div className="text-center text-gray-400 py-12">Cargando notas...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-slate-500">
              No hay notas aún. Crea tu primera nota.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 group hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => navigate(`/context/notes/${note.id}`)}
                      className="flex-1 text-left"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary-600 transition-colors">
                        {note.title}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                        Editado{" "}
                        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true, locale: es })}
                      </p>
                    </button>
                    <button
                      onClick={() => deleteNoteMutation.mutate(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {note.isCollaborative && (
                    <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      Colaborativa
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reminders tab */}
      {tab === "reminders" && (
        <>
          {remindersLoading ? (
            <div className="text-center text-gray-400 py-12">Cargando recordatorios...</div>
          ) : (
            <div className="space-y-6">
              {pendingReminders.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                    Pendientes
                  </h3>
                  <div className="space-y-2">
                    {pendingReminders.map((r) => (
                      <ReminderCard key={r.id} reminder={r} />
                    ))}
                  </div>
                </div>
              )}
              {doneReminders.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">
                    Completados
                  </h3>
                  <div className="space-y-2 opacity-60">
                    {doneReminders.map((r) => (
                      <ReminderCard key={r.id} reminder={r} />
                    ))}
                  </div>
                </div>
              )}
              {reminders.length === 0 && (
                <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                  No hay recordatorios aún.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showReminderForm && <ReminderForm onClose={() => setShowReminderForm(false)} />}
    </div>
  );
}
