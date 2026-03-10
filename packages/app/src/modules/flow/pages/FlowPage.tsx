import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, User, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { flowApi } from "../api/flowApi";
import { groupsApi } from "@/modules/groups/api/groupsApi";
import KanbanBoard from "../components/KanbanBoard";
import clsx from "clsx";
import type { Group } from "@/types";

type ViewMode = "personal" | "group";

export default function FlowPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("personal");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.listGroups,
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["flow", "tickets", viewMode, selectedGroup?.id],
    queryFn: () =>
      viewMode === "group" && selectedGroup
        ? flowApi.listTickets({ scope: "GROUP", groupId: selectedGroup.id })
        : flowApi.listTickets(),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flow</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            {viewMode === "group" && selectedGroup ? ` · ${selectedGroup.name}` : ""}
          </p>
        </div>
        <button
          onClick={() => navigate("/flow/tickets/new")}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} />
          Nuevo ticket
        </button>
      </div>

      {/* View mode tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setViewMode("personal");
            setSelectedGroup(null);
          }}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            viewMode === "personal"
              ? "bg-primary-600 text-white"
              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
          )}
        >
          <User size={15} />
          Personal
        </button>

        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => {
              setViewMode("group");
              setSelectedGroup(group);
            }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              viewMode === "group" && selectedGroup?.id === group.id
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            )}
          >
            <Users size={15} />
            {group.name}
          </button>
        ))}
      </div>

      {/* Board */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-16">Cargando tickets...</div>
      ) : (
        <KanbanBoard tickets={tickets} />
      )}
    </div>
  );
}
