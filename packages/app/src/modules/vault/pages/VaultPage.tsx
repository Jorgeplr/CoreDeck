import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Lock, KeyRound, User, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useVaultStore } from "@/store/vaultStore";
import { useAuthStore } from "@/store/authStore";
import { vaultApi } from "../api/vaultApi";
import { groupsApi } from "@/modules/groups/api/groupsApi";
import PasswordCard from "../components/PasswordCard";
import PasswordForm from "../components/PasswordForm";
import type { Group } from "@/types";
import clsx from "clsx";

type VaultTab = "personal" | string; // string = groupId

export default function VaultPage() {
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<VaultTab>("personal");

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.listGroups,
    enabled: isUnlocked,
  });

  const selectedGroup: Group | null = activeTab === "personal"
    ? null
    : groups.find((g) => g.id === activeTab) ?? null;

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["vault", "entries", activeTab],
    queryFn: () =>
      activeTab === "personal"
        ? vaultApi.list("PERSONAL")
        : vaultApi.list("GROUP", activeTab),
    enabled: isUnlocked,
  });

  const deleteMutation = useMutation({
    mutationFn: vaultApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vault"] }),
  });

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
          <Lock size={36} className="text-amber-500 dark:text-amber-400" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vault bloqueado</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs">
            Ingresa tu contraseña maestra para descifrar y acceder a tus contraseñas.
          </p>
        </div>
        <button
          onClick={() => navigate("/vault/unlock")}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Lock size={16} />
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
            <KeyRound size={22} className="text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vault</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {entries.length} contraseña{entries.length !== 1 ? "s" : ""} cifrada{entries.length !== 1 ? "s" : ""}
              {selectedGroup ? ` · ${selectedGroup.name}` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      {/* Scope tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab("personal")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
            activeTab === "personal"
              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
              : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
          )}
        >
          <User size={15} />
          Personal
        </button>
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setActiveTab(group.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
              activeTab === group.id
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
            )}
          >
            <Users size={15} />
            {group.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nombre o URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Group cipher note */}
      {selectedGroup && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
          <KeyRound size={13} />
          Las entradas de grupo se cifran con tu clave maestra personal. Solo tú puedes descifrarlas.
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            <KeyRound size={24} className="text-gray-300 dark:text-slate-600" />
          </div>
          <p className="text-sm text-gray-400 dark:text-slate-500">
            {search ? "Sin resultados para esa búsqueda" : "Aún no hay contraseñas aquí"}
          </p>
          {!search && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              Agregar la primera contraseña
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
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
          defaultScope={activeTab === "personal" ? "PERSONAL" : "GROUP"}
          defaultGroupId={activeTab === "personal" ? undefined : activeTab}
        />
      )}
    </div>
  );
}
