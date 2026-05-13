import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Lock, KeyRound, User, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useVaultStore } from "@/store/vaultStore";
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-full max-w-lg rounded-[32px] bg-[var(--app-panel)] ring-1 ring-[var(--app-border)] shadow-[var(--app-shadow)] px-8 py-10 text-center overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -right-10 h-40 w-40 rounded-full bg-[var(--app-accent)]/20 blur-[60px]" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[var(--app-accent-2)]/20 blur-[70px]" />
          <div className="relative mx-auto mb-6 w-20 h-20 rounded-[28px] bg-[var(--app-panel-2)] ring-1 ring-[var(--app-border)] flex items-center justify-center">
            <Lock size={36} className="text-[var(--app-accent-2)]" />
          </div>
          <div className="relative text-center">
            <h2 className="text-2xl font-display text-[var(--app-text)] mb-2">Vault bloqueado</h2>
            <p className="text-sm text-[var(--app-muted)] max-w-xs mx-auto">
              Ingresa tu contraseña maestra para descifrar y acceder a tus contraseñas.
            </p>
          </div>
          <button
            onClick={() => navigate("/vault/unlock")}
            className="relative mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-[var(--app-accent)] to-[var(--app-accent-2)] text-white font-semibold px-6 py-3 rounded-full text-sm transition-transform hover:scale-[1.01]"
          >
            <Lock size={16} />
            Desbloquear Vault
          </button>
        </div>
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
          <div className="w-12 h-12 rounded-2xl bg-[var(--app-panel-2)] ring-1 ring-[var(--app-border)] flex items-center justify-center shrink-0">
            <KeyRound size={22} className="text-[var(--app-accent-2)]" />
          </div>
          <div>
            <h1 className="text-2xl font-display text-[var(--app-text)]">Vault</h1>
            <p className="text-sm text-[var(--app-muted)]">
              {entries.length} contraseña{entries.length !== 1 ? "s" : ""} cifrada{entries.length !== 1 ? "s" : ""}
              {selectedGroup ? ` · ${selectedGroup.name}` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[var(--app-accent)] to-[var(--app-accent-2)] text-white font-medium px-4 py-2.5 rounded-full text-sm transition-transform hover:scale-[1.01]"
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
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
            activeTab === "personal"
              ? "bg-gradient-to-r from-[var(--app-accent)] to-[var(--app-accent-2)] text-white border-transparent shadow-sm"
              : "bg-[var(--app-panel-2)] text-[var(--app-muted)] border-[var(--app-border)] hover:text-[var(--app-text)]"
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
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
              activeTab === group.id
                ? "bg-gradient-to-r from-[var(--app-accent)] to-[var(--app-accent-2)] text-white border-transparent shadow-sm"
                : "bg-[var(--app-panel-2)] text-[var(--app-muted)] border-[var(--app-border)] hover:text-[var(--app-text)]"
            )}
          >
            <Users size={15} />
            {group.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
        <input
          type="text"
          placeholder="Buscar por nombre o URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-2)] text-sm text-[var(--app-text)] placeholder-[var(--app-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-ring)] shadow-sm"
        />
      </div>

      {/* Group cipher note */}
      {selectedGroup && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--app-panel-2)] border border-[var(--app-border)] rounded-xl text-xs text-[var(--app-muted)]">
          <KeyRound size={13} />
          Las entradas de grupo se cifran con tu clave maestra personal. Solo tú puedes descifrarlas.
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[var(--app-muted)]">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--app-panel-2)] ring-1 ring-[var(--app-border)] flex items-center justify-center">
            <KeyRound size={24} className="text-[var(--app-muted)]" />
          </div>
          <p className="text-sm text-[var(--app-muted)]">
            {search ? "Sin resultados para esa búsqueda" : "Aún no hay contraseñas aquí"}
          </p>
          {!search && (
            <button
              onClick={() => setShowForm(true)}
              className="text-sm text-[var(--app-accent)] hover:underline"
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
