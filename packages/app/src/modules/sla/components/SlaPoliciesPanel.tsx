import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Save, Timer } from "lucide-react";
import { slaApi } from "../api/slaApi";
import type { TicketPriority } from "@/types";

const PRIORITIES: TicketPriority[] = ["CRITICAL", "URGENT", "NORMAL", "LOW"];
const LABELS: Record<TicketPriority, string> = {
  CRITICAL: "Crítico", URGENT: "Urgente", NORMAL: "Normal", LOW: "Bajo",
};
const COLORS: Record<TicketPriority, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  URGENT: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  NORMAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  LOW: "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300",
};

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h < 24) return rem ? `${h}h ${rem}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const hr = h % 24;
  return hr ? `${d}d ${hr}h` : `${d}d`;
}

interface Props {
  groupId: string;
  canManage: boolean;
}

export default function SlaPoliciesPanel({ groupId, canManage }: Props) {
  const qc = useQueryClient();
  const [draftPriority, setDraftPriority] = useState<TicketPriority>("URGENT");
  const [firstResp, setFirstResp] = useState<number>(60);
  const [resolution, setResolution] = useState<number>(480);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ["sla", groupId],
    queryFn: () => slaApi.list(groupId),
  });

  const upsert = useMutation({
    mutationFn: () =>
      slaApi.upsert({
        groupId,
        priority: draftPriority,
        firstResponseMinutes: firstResp,
        resolutionMinutes: resolution,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sla", groupId] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => slaApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sla", groupId] }),
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1 flex items-center gap-2">
        <Timer size={15} className="text-primary-600 dark:text-primary-400" />
        Políticas SLA
      </h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
        Define tiempos máximos de primera respuesta y resolución según la prioridad. Se notifica + dispara webhook al incumplirse.
      </p>

      {isLoading ? (
        <div className="text-sm text-gray-400">Cargando…</div>
      ) : policies.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 italic mb-4">
          Aún no hay políticas configuradas para este grupo.
        </p>
      ) : (
        <div className="space-y-2 mb-4">
          {policies.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700"
            >
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COLORS[p.priority]}`}>
                {LABELS[p.priority]}
              </span>
              <div className="flex-1 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">1ª respuesta:</span>{" "}
                  <span className="font-medium text-gray-800 dark:text-slate-200">
                    {formatMinutes(p.firstResponseMinutes)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Resolución:</span>{" "}
                  <span className="font-medium text-gray-800 dark:text-slate-200">
                    {formatMinutes(p.resolutionMinutes)}
                  </span>
                </div>
              </div>
              {canManage && (
                <button
                  onClick={() => remove.mutate(p.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                Prioridad
              </label>
              <select
                value={draftPriority}
                onChange={(e) => setDraftPriority(e.target.value as TicketPriority)}
                className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                1ª resp. (min)
              </label>
              <input
                type="number"
                min={1}
                value={firstResp}
                onChange={(e) => setFirstResp(Number(e.target.value) || 1)}
                className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                Resolución (min)
              </label>
              <input
                type="number"
                min={1}
                value={resolution}
                onChange={(e) => setResolution(Number(e.target.value) || 1)}
                className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={() => upsert.mutate()}
            disabled={upsert.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {policies.some((p) => p.priority === draftPriority) ? <Save size={14} /> : <Plus size={14} />}
            {policies.some((p) => p.priority === draftPriority) ? "Actualizar" : "Añadir"} política
          </button>
        </div>
      )}
    </div>
  );
}
