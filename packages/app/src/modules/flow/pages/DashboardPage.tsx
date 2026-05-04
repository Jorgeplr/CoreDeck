import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, Users } from "lucide-react";
import { api } from "@/lib/api";
import { groupsApi } from "@/modules/groups/api/groupsApi";
import clsx from "clsx";

interface Stats {
  byStatus: Array<{ status: string; _count: number }>;
  byPriority: Array<{ priority: string; _count: number }>;
  recentActivity: number;
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  RESOLVED: "Resuelto",
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-blue-500",
  IN_PROGRESS: "bg-amber-500",
  IN_REVIEW: "bg-purple-500",
  RESOLVED: "bg-green-500",
};

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: "Crítico",
  URGENT: "Urgente",
  NORMAL: "Normal",
  LOW: "Bajo",
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "bg-red-500",
  URGENT: "bg-orange-500",
  NORMAL: "bg-blue-400",
  LOW: "bg-gray-400",
};

function BarRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700 dark:text-slate-300">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.listGroups,
  });

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["flow", "stats", selectedGroup],
    queryFn: () =>
      api
        .get("/flow/stats", { params: selectedGroup ? { groupId: selectedGroup } : {} })
        .then((r) => r.data),
  });

  const totalByStatus = stats?.byStatus.reduce((s, r) => s + r._count, 0) ?? 0;
  const totalByPriority = stats?.byPriority.reduce((s, r) => s + r._count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 flex items-center justify-center shrink-0">
            <BarChart2 size={22} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Métricas de tickets</p>
          </div>
        </div>

        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Personal</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Cargando métricas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Summary cards */}
          <div className="col-span-full grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["OPEN", "IN_PROGRESS", "IN_REVIEW", "RESOLVED"].map((status) => {
              const count = stats?.byStatus.find((s) => s.status === status)?._count ?? 0;
              return (
                <div key={status} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{STATUS_LABEL[status]}</p>
                  <div className={clsx("h-1 rounded-full mt-3 mx-auto w-8", STATUS_COLOR[status])} />
                </div>
              );
            })}
          </div>

          {/* By status */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Por estado</h2>
            {["OPEN", "IN_PROGRESS", "IN_REVIEW", "RESOLVED"].map((s) => (
              <BarRow
                key={s}
                label={STATUS_LABEL[s]}
                count={stats?.byStatus.find((x) => x.status === s)?._count ?? 0}
                total={totalByStatus}
                color={STATUS_COLOR[s]}
              />
            ))}
          </div>

          {/* By priority */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Por prioridad</h2>
            {["CRITICAL", "URGENT", "NORMAL", "LOW"].map((p) => (
              <BarRow
                key={p}
                label={PRIORITY_LABEL[p]}
                count={stats?.byPriority.find((x) => x.priority === p)?._count ?? 0}
                total={totalByPriority}
                color={PRIORITY_COLOR[p]}
              />
            ))}
          </div>

          {/* Recent activity */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
              <Users size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.recentActivity ?? 0}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">tickets con actividad en los últimos 7 días</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
