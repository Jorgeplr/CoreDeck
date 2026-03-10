import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, User, Users, Kanban, SlidersHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { flowApi } from "../api/flowApi";
import { groupsApi } from "@/modules/groups/api/groupsApi";
import KanbanBoard from "../components/KanbanBoard";
import clsx from "clsx";
import type { Group, TicketPriority, Label } from "@/types";

type ViewMode = "personal" | "group";

const PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: "CRITICAL", label: "Crítico", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  { value: "URGENT", label: "Urgente", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { value: "NORMAL", label: "Normal", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "LOW", label: "Bajo", color: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400" },
];

export default function FlowPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("personal");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filterPriorities, setFilterPriorities] = useState<TicketPriority[]>([]);
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>("");
  const [filterLabelIds, setFilterLabelIds] = useState<string[]>([]);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.listGroups,
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ["groups", selectedGroup?.id, "members"],
    queryFn: () => groupsApi.getMembers(selectedGroup!.id),
    enabled: viewMode === "group" && !!selectedGroup,
  });

  const { data: labels = [] } = useQuery({
    queryKey: ["flow", "labels"],
    queryFn: flowApi.listLabels,
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["flow", "tickets", viewMode, selectedGroup?.id],
    queryFn: () =>
      viewMode === "group" && selectedGroup
        ? flowApi.listTickets({ scope: "GROUP", groupId: selectedGroup.id })
        : flowApi.listTickets(),
  });

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (filterPriorities.length > 0 && !filterPriorities.includes(t.priority)) return false;
      if (filterAssigneeId && t.assignedToId !== filterAssigneeId) return false;
      if (filterLabelIds.length > 0 && !filterLabelIds.some((id) => t.labels.some((l) => l.label.id === id))) return false;
      return true;
    });
  }, [tickets, filterPriorities, filterAssigneeId, filterLabelIds]);

  const activeFilterCount =
    filterPriorities.length + (filterAssigneeId ? 1 : 0) + filterLabelIds.length;

  const clearFilters = () => {
    setFilterPriorities([]);
    setFilterAssigneeId("");
    setFilterLabelIds([]);
  };

  const togglePriority = (p: TicketPriority) =>
    setFilterPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const toggleLabel = (id: string) =>
    setFilterLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 flex items-center justify-center shrink-0">
            <Kanban size={22} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flow</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {filteredTickets.length}
              {activeFilterCount > 0 ? ` de ${tickets.length}` : ""} ticket{tickets.length !== 1 ? "s" : ""}
              {viewMode === "group" && selectedGroup ? ` · ${selectedGroup.name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
              showFilters || activeFilterCount > 0
                ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300"
            )}
          >
            <SlidersHorizontal size={15} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-white/30 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/flow/tickets/new")}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            <Plus size={16} />
            Nuevo ticket
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setViewMode("personal"); setSelectedGroup(null); }}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
            viewMode === "personal"
              ? "bg-primary-600 text-white border-primary-600 shadow-sm"
              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
          )}
        >
          <User size={15} />
          Personal
        </button>

        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => { setViewMode("group"); setSelectedGroup(group); }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
              viewMode === "group" && selectedGroup?.id === group.id
                ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
            )}
          >
            <Users size={15} />
            {group.name}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Filtros</span>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={13} />
                Limpiar todo
              </button>
            )}
          </div>

          {/* Priority filter */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Prioridad</p>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => togglePriority(value)}
                  className={clsx(
                    "text-xs px-3 py-1.5 rounded-full font-medium transition-all border-2",
                    filterPriorities.includes(value)
                      ? `${color} border-current`
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-transparent hover:border-gray-300 dark:hover:border-slate-500"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee filter — only for group view */}
          {viewMode === "group" && groupMembers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Asignado a</p>
              <select
                value={filterAssigneeId}
                onChange={(e) => setFilterAssigneeId(e.target.value)}
                className="w-full max-w-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos los miembros</option>
                {groupMembers.map(({ user }) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName ?? user.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Label filter */}
          {labels.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Etiquetas</p>
              <div className="flex flex-wrap gap-2">
                {labels.map((label: Label) => (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    className={clsx(
                      "text-xs px-3 py-1.5 rounded-full font-medium text-white transition-all border-2",
                      filterLabelIds.includes(label.id) ? "border-white/60 scale-105" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Board */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Cargando tickets...</div>
      ) : (
        <KanbanBoard tickets={filteredTickets} />
      )}
    </div>
  );
}
