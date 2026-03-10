import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Lock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useVaultStore } from "@/store/vaultStore";
import { vaultApi } from "../api/vaultApi";
import PasswordCard from "../components/PasswordCard";
import PasswordForm from "../components/PasswordForm";

export default function VaultPage() {
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["vault", "entries", "PERSONAL"],
    queryFn: () => vaultApi.list("PERSONAL"),
    enabled: isUnlocked,
  });

  const deleteMutation = useMutation({
    mutationFn: vaultApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vault"] }),
  });

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="p-4 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30">
          <Lock size={32} className="text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Vault bloqueado</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-xs">
          Ingresa tu contraseña maestra para acceder a tus contraseñas cifradas.
        </p>
        <button
          onClick={() => navigate("/vault/unlock")}
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Desbloquear Vault
        </button>
      </div>
    );
  }

  const filtered = entries.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.url ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vault</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {entries.length} contraseña{entries.length !== 1 ? "s" : ""} guardada{entries.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar contraseñas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-slate-500">
            {search ? "Sin resultados" : "No hay contraseñas guardadas aún"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((entry) => (
            <PasswordCard
              key={entry.id}
              entry={entry}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PasswordForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ["vault"] });
          }}
        />
      )}
    </div>
  );
}
