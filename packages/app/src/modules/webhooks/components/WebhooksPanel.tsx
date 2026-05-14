import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Webhook as WebhookIcon, Trash2, Plus, Copy, Check, Power, PowerOff, Send,
} from "lucide-react";
import clsx from "clsx";
import { webhooksApi, type CreateWebhookPayload } from "../api/webhooksApi";
import type { Webhook, WebhookEvent } from "@/types";

const ALL_EVENTS: WebhookEvent[] = [
  "ticket.created",
  "ticket.updated",
  "ticket.status_changed",
  "ticket.assigned",
  "ticket.deleted",
  "ticket.commented",
  "ticket.sla_breached",
];

const EVENT_LABELS: Record<WebhookEvent, string> = {
  "ticket.created": "Ticket creado",
  "ticket.updated": "Ticket actualizado",
  "ticket.status_changed": "Cambio de estado",
  "ticket.assigned": "Asignación",
  "ticket.deleted": "Eliminación",
  "ticket.commented": "Comentario",
  "ticket.sla_breached": "SLA incumplido",
};

interface Props {
  groupId?: string;
  canManage: boolean;
}

function SecretField({ secret }: { secret: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 text-xs">
      <code className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 font-mono text-gray-700 dark:text-slate-300">
        {shown ? secret : "•".repeat(20)}
      </code>
      <button
        onClick={() => setShown((s) => !s)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
      >
        {shown ? "Ocultar" : "Mostrar"}
      </button>
      <button
        onClick={() => {
          navigator.clipboard.writeText(secret);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
      >
        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

function WebhookCard({ wh, canManage }: { wh: Webhook; canManage: boolean }) {
  const qc = useQueryClient();
  const queryKey = ["webhooks", wh.groupId ?? "personal"];

  const update = useMutation({
    mutationFn: (data: Partial<CreateWebhookPayload>) => webhooksApi.update(wh.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: () => webhooksApi.remove(wh.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const test = useMutation({
    mutationFn: () => webhooksApi.test(wh.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const events = wh.events.split(",").filter(Boolean) as WebhookEvent[];

  return (
    <div className={clsx(
      "rounded-xl border p-4 space-y-3",
      wh.isActive
        ? "border-gray-200 dark:border-slate-700"
        : "border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30 opacity-70"
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{wh.name}</h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 truncate font-mono">{wh.url}</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => test.mutate()}
              disabled={test.isPending}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-500 transition-colors"
              title="Disparar prueba"
            >
              <Send size={13} />
            </button>
            <button
              onClick={() => update.mutate({ isActive: !wh.isActive })}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title={wh.isActive ? "Desactivar" : "Activar"}
            >
              {wh.isActive ? <Power size={13} className="text-green-500" /> : <PowerOff size={13} />}
            </button>
            <button
              onClick={() => remove.mutate()}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {events.map((e) => (
          <span
            key={e}
            className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium"
          >
            {EVENT_LABELS[e] ?? e}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <SecretField secret={wh.secret} />
        <div className="text-gray-400">
          {wh.lastFiredAt ? (
            <span>
              Último: <span className={wh.lastStatus && wh.lastStatus >= 200 && wh.lastStatus < 300 ? "text-green-500" : "text-red-500"}>
                {wh.lastStatus ?? "error"}
              </span>
            </span>
          ) : (
            <span>Nunca disparado</span>
          )}
          {wh.failureCount > 0 && (
            <span className="ml-2 text-orange-500">· {wh.failureCount} fallo{wh.failureCount > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WebhooksPanel({ groupId, canManage }: Props) {
  const qc = useQueryClient();
  const queryKey = ["webhooks", groupId ?? "personal"];
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEvent>>(new Set(["ticket.created"]));

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => webhooksApi.list(groupId),
  });

  const create = useMutation({
    mutationFn: () =>
      webhooksApi.create({
        name,
        url,
        events: [...selectedEvents],
        groupId,
      }),
    onSuccess: () => {
      setName("");
      setUrl("");
      setSelectedEvents(new Set(["ticket.created"]));
      setShowForm(false);
      qc.invalidateQueries({ queryKey });
    },
  });

  const toggleEvent = (e: WebhookEvent) =>
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(e)) next.delete(e);
      else next.add(e);
      return next;
    });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
          <WebhookIcon size={15} className="text-primary-600 dark:text-primary-400" />
          Webhooks {groupId ? "del grupo" : "personales"}
        </h2>
        {canManage && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            <Plus size={13} />
            Nuevo
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-slate-400">
        Cada evento se firma con HMAC-SHA256 usando el secret. Verifica el header <code className="font-mono">x-coredesk-signature</code> en tu servidor.
      </p>

      {isLoading ? (
        <div className="text-sm text-gray-400">Cargando…</div>
      ) : webhooks.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 italic">
          Aún no hay webhooks configurados.
        </p>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => (
            <WebhookCard key={wh.id} wh={wh} canManage={canManage} />
          ))}
        </div>
      )}

      {showForm && canManage && (
        <div className="border border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
            />
            <input
              type="url"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white font-mono"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5">Eventos</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_EVENTS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggleEvent(e)}
                  className={clsx(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    selectedEvents.has(e)
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-600"
                  )}
                >
                  {EVENT_LABELS[e]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={() => create.mutate()}
              disabled={!name.trim() || !url.trim() || selectedEvents.size === 0 || create.isPending}
              className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium"
            >
              {create.isPending ? "Creando…" : "Crear webhook"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
