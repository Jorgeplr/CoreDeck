import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Users, UserCheck, UserX, Send, Clock } from "lucide-react";
import AttachmentsPanel from "@/components/attachments/AttachmentsPanel";
import MarkdownView from "@/components/ui/MarkdownView";
import TimeTrackingPanel from "../components/TimeTrackingPanel";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { flowApi } from "../api/flowApi";
import { groupsApi } from "@/modules/groups/api/groupsApi";
import AuditLog from "../components/AuditLog";
import { useAuthStore } from "@/store/authStore";
import type { TicketStatus, TicketPriority } from "@/types";
import clsx from "clsx";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: "Abierto" },
  { value: "IN_PROGRESS", label: "En progreso" },
  { value: "IN_REVIEW", label: "En revisión" },
  { value: "RESOLVED", label: "Resuelto" },
];

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  CRITICAL: "Crítico", URGENT: "Urgente", NORMAL: "Normal", LOW: "Bajo",
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  URGENT: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  NORMAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  LOW: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400",
};

type Tab = "comments" | "history" | "time" | "details";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("comments");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["flow", "ticket", id],
    queryFn: () => flowApi.getTicket(id!),
    enabled: !!id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["flow", "ticket", id, "comments"],
    queryFn: () => flowApi.getComments(id!),
    enabled: tab === "comments" && !!id,
    refetchInterval: tab === "comments" ? 15000 : false,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["flow", "ticket", id, "history"],
    queryFn: () => flowApi.getTicketHistory(id!),
    enabled: tab === "history" && !!id,
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ["groups", ticket?.groupId, "members"],
    queryFn: () => groupsApi.getMembers(ticket!.groupId!),
    enabled: !!ticket?.groupId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<{ status: TicketStatus; priority: TicketPriority; assignedToId: string | null }>) =>
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

  const commentMutation = useMutation({
    mutationFn: (content: string) => flowApi.addComment(id!, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow", "ticket", id, "comments"] });
      setCommentText("");
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) commentMutation.mutate(commentText.trim());
  };

  // Auto-scroll when comments load
  useEffect(() => {
    if (tab === "comments" && comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length, tab]);

  if (isLoading) return <div className="text-gray-400 py-16 text-center">Cargando...</div>;
  if (!ticket) return <div className="text-gray-400 py-16 text-center">Ticket no encontrado</div>;

  const isSelfAssigned = ticket.assignedTo?.id === currentUser?.id;
  const selectCls = "px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500";

  const TABS: { key: Tab; label: string; count?: number; icon?: React.ReactNode }[] = [
    { key: "comments", label: "Comentarios", count: comments.length || undefined },
    { key: "history", label: "Historial" },
    { key: "time", label: "Tiempo", icon: <Clock size={13} /> },
    { key: "details", label: "Detalles" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1 truncate">{ticket.title}</h1>

        {/* Delete with confirmation */}
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-slate-400">¿Eliminar?</span>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
            >
              {deleteMutation.isPending ? "..." : "Sí"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Eliminar ticket"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-5">

        {/* Status + Priority + Due */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Estado</label>
            <select
              value={ticket.status}
              onChange={(e) => updateMutation.mutate({ status: e.target.value as TicketStatus })}
              className={selectCls}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Prioridad</label>
            <span className={clsx("inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium", PRIORITY_COLORS[ticket.priority])}>
              {PRIORITY_LABELS[ticket.priority]}
            </span>
          </div>
          {ticket.dueDate && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Fecha límite</label>
              <span className="text-sm text-gray-700 dark:text-slate-300">
                {format(new Date(ticket.dueDate), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {ticket.description && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">Descripción</h3>
            <MarkdownView content={ticket.description} className="text-sm" />
          </div>
        )}

        {/* Labels */}
        {ticket.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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

        {/* Group badge */}
        {ticket.scope === "GROUP" && (
          <div className="inline-flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg">
            <Users size={13} />
            Ticket de grupo
          </div>
        )}

        {/* Author + Assignee */}
        <div className="flex flex-wrap gap-6 pt-1 border-t border-gray-100 dark:border-slate-700">
          <div>
            <span className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Creado por</span>
            <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
              {ticket.createdBy.displayName ?? ticket.createdBy.username}
            </span>
          </div>
          <div>
            <span className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Asignado a</span>
            {ticket.scope === "GROUP" && groupMembers.length > 0 ? (
              /* Group ticket: dropdown with all members */
              <select
                value={ticket.assignedTo?.id ?? ""}
                onChange={(e) => updateMutation.mutate({ assignedToId: e.target.value || null })}
                className={selectCls}
              >
                <option value="">Sin asignar</option>
                {groupMembers.map(({ user }) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName ?? user.username}
                  </option>
                ))}
              </select>
            ) : (
              /* Individual ticket: show + self-assign/unassign */
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                  {ticket.assignedTo
                    ? (ticket.assignedTo.displayName ?? ticket.assignedTo.username)
                    : "—"}
                </span>
                {isSelfAssigned ? (
                  <button
                    onClick={() => updateMutation.mutate({ assignedToId: null })}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 transition-colors"
                    title="Desasignar"
                  >
                    <UserX size={13} />
                    Desasignar
                  </button>
                ) : (
                  <button
                    onClick={() => updateMutation.mutate({ assignedToId: currentUser?.id })}
                    className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
                    title="Asignarme"
                  >
                    <UserCheck size={13} />
                    Asignarme
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Comments / History / Details */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
        <div className="flex gap-1 px-4 pt-4 border-b border-gray-100 dark:border-slate-700">
          {TABS.map(({ key, label, count, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={clsx(
                "pb-3 px-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
                tab === key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
              )}
            >
              {icon}
              {label}
              {count !== undefined && (
                <span className={clsx(
                  "text-xs rounded-full px-1.5 py-0.5 font-medium",
                  tab === key
                    ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Comments tab */}
        {tab === "comments" && (
          <div className="flex flex-col">
            {/* Comment list */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">
                  Sin comentarios aún. ¡Sé el primero en comentar!
                </p>
              ) : (
                comments.map((comment) => {
                  const isMine = comment.userId === currentUser?.id;
                  return (
                    <div key={comment.id} className={clsx("flex gap-3", isMine && "flex-row-reverse")}>
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                          {(comment.user.displayName ?? comment.user.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {/* Bubble */}
                      <div className={clsx("max-w-[80%] space-y-1", isMine && "items-end flex flex-col")}>
                        <div className={clsx(
                          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          isMine
                            ? "bg-primary-600 text-white rounded-tr-sm"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-tl-sm"
                        )}>
                          <MarkdownView
                            content={comment.content}
                            className={clsx(
                              isMine && "prose-invert prose-headings:text-white prose-strong:text-white prose-a:text-white"
                            )}
                          />
                        </div>
                        <div className={clsx("flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500", isMine && "flex-row-reverse")}>
                          <span className="font-medium">{comment.user.displayName ?? comment.user.username}</span>
                          <span>·</span>
                          <span title={format(new Date(comment.createdAt), "PPpp", { locale: es })}>
                            {formatDistanceToNow(new Date(comment.createdAt), { locale: es, addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment input */}
            <form
              onSubmit={handleCommentSubmit}
              className="flex items-end gap-3 p-4 pt-0 border-t border-gray-100 dark:border-slate-700"
            >
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (commentText.trim()) commentMutation.mutate(commentText.trim());
                  }
                }}
                rows={2}
                placeholder="Escribe un comentario... (Enter para enviar)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400 dark:placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || commentMutation.isPending}
                className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white transition-colors shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* History tab */}
        {tab === "history" && (
          <div className="p-4">
            <AuditLog history={history} />
          </div>
        )}

        {/* Time tracking tab */}
        {tab === "time" && id && (
          <div className="p-4">
            <TimeTrackingPanel ticketId={id} />
          </div>
        )}

        {/* Details tab */}
        {tab === "details" && (
          <div className="p-4 space-y-5">
            <div className="text-sm text-gray-500 dark:text-slate-400 space-y-1">
              <p>Creado {format(new Date(ticket.createdAt), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
              <p>Última actualización {format(new Date(ticket.updatedAt), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
            </div>
            <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
              <AttachmentsPanel ticketId={ticket.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
