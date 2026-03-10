import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, FileText, Bell, Clock, StickyNote } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { contextApi } from "../api/contextApi";
import ReminderCard from "../components/ReminderCard";
import ReminderForm from "../components/ReminderForm";
import clsx from "clsx";

const NOTE_COLORS = [
  "border-l-blue-400",
  "border-l-purple-400",
  "border-l-green-400",
  "border-l-amber-400",
  "border-l-pink-400",
  "border-l-teal-400",
];

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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <StickyNote size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Context</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {tab === "notes"
                ? `${notes.length} nota${notes.length !== 1 ? "s" : ""}`
                : `${pendingReminders.length} pendiente${pendingReminders.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => (tab === "notes" ? createNoteMutation.mutate() : setShowReminderForm(true))}
          disabled={createNoteMutation.isPending}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60"
        >
          <Plus size={16} />
          {tab === "notes" ? "Nueva nota" : "Nuevo recordatorio"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl w-fit border border-gray-200 dark:border-slate-700">
        {([
          { key: "notes" as const, label: "Notas", icon: FileText },
          { key: "reminders" as const, label: "Recordatorios", icon: Bell, badge: pendingReminders.length },
        ]).map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === key
                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-slate-600"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
            )}
          >
            <Icon size={15} />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notes tab */}
      {tab === "notes" && (
        notesLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Cargando notas...</div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
              <FileText size={24} className="text-gray-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-gray-400 dark:text-slate-500">Crea tu primera nota</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note, i) => (
              <div
                key={note.id}
                className={clsx(
                  "bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 border-l-4 p-4 group hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all cursor-pointer",
                  NOTE_COLORS[i % NOTE_COLORS.length]
                )}
                onClick={() => navigate(`/context/notes/${note.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                      {note.title}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNoteMutation.mutate(note.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {note.isCollaborative && (
                  <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
                    Colaborativa
                  </span>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Reminders tab */}
      {tab === "reminders" && (
        remindersLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Cargando recordatorios...</div>
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
              <Bell size={24} className="text-gray-300 dark:text-slate-600" />
            </div>
            <p className="text-sm text-gray-400 dark:text-slate-500">No hay recordatorios aún</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingReminders.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Pendientes · {pendingReminders.length}
                </p>
                <div className="space-y-2">
                  {pendingReminders.map((r) => <ReminderCard key={r.id} reminder={r} />)}
                </div>
              </div>
            )}
            {doneReminders.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Completados · {doneReminders.length}
                </p>
                <div className="space-y-2 opacity-60">
                  {doneReminders.map((r) => <ReminderCard key={r.id} reminder={r} />)}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {showReminderForm && <ReminderForm onClose={() => setShowReminderForm(false)} />}
    </div>
  );
}
