import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { flowApi } from "../api/flowApi";
import KanbanBoard from "../components/KanbanBoard";

export default function FlowPage() {
  const navigate = useNavigate();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["flow", "tickets"],
    queryFn: () => flowApi.listTickets(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flow</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} total
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

      {isLoading ? (
        <div className="text-center text-gray-400 py-16">Cargando tickets...</div>
      ) : (
        <KanbanBoard tickets={tickets} />
      )}
    </div>
  );
}
