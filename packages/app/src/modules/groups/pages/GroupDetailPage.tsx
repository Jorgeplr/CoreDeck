import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Check, Trash2, Crown, Shield, User, UserMinus, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "../api/groupsApi";
import { useAuthStore } from "@/store/authStore";
import type { GroupRole } from "@/types";
import clsx from "clsx";

const ROLE_LABELS: Record<GroupRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Admin",
  MEMBER: "Miembro",
  VIEWER: "Visor",
};

const ROLE_ICONS: Record<GroupRole, React.ReactNode> = {
  OWNER: <Crown size={12} className="text-yellow-500" />,
  ADMIN: <Shield size={12} className="text-blue-500" />,
  MEMBER: <User size={12} className="text-gray-400" />,
  VIEWER: <User size={12} className="text-gray-300" />,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["groups", id],
    queryFn: () => groupsApi.getGroup(id!),
    enabled: !!id,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["groups", id, "members"],
    queryFn: () => groupsApi.getMembers(id!),
    enabled: !!id,
  });

  const myMembership = members.find((m) => m.userId === currentUser?.id);
  const isOwner = myMembership?.role === "OWNER";

  const deleteMutation = useMutation({
    mutationFn: () => groupsApi.deleteGroup(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      navigate("/vault");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(id!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups", id, "members"] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupsApi.removeMember(id!, currentUser!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      navigate("/vault");
    },
  });

  if (groupLoading || membersLoading) {
    return <div className="text-center text-gray-400 py-16">Cargando grupo...</div>;
  }
  if (!group) {
    return <div className="text-center text-gray-400 py-16">Grupo no encontrado</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{group.name}</h1>
          {group.description && (
            <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
          <Users size={14} />
          <span>{group._count?.members ?? members.length} miembros</span>
        </div>
      </div>

      {/* Invite code card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
          Código de invitación
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 dark:bg-slate-700/60 rounded-xl px-5 py-3 border border-gray-200 dark:border-slate-600">
            <span className="text-2xl font-mono font-bold tracking-[0.3em] text-gray-900 dark:text-white select-all">
              {group.inviteCode}
            </span>
          </div>
          <CopyButton text={group.inviteCode} />
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
          Comparte este código para que otros se unan al grupo.
        </p>
      </div>

      {/* Members */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">
          Integrantes
        </h2>
        <div className="space-y-1">
          {members.map((member) => {
            const isSelf = member.userId === currentUser?.id;
            const canRemove = isOwner && !isSelf;
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                  {member.user.avatarUrl ? (
                    <img src={member.user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                      {(member.user.displayName ?? member.user.username).charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.user.displayName ?? member.user.username}
                      {isSelf && (
                        <span className="ml-1.5 text-xs text-gray-400 dark:text-slate-500 font-normal">(tú)</span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-slate-500 truncate">{member.user.email}</span>
                </div>

                {/* Role badge */}
                <div className={clsx(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  member.role === "OWNER" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                  member.role === "ADMIN" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                  "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400"
                )}>
                  {ROLE_ICONS[member.role]}
                  {ROLE_LABELS[member.role]}
                </div>

                {/* Remove button (OWNER only, not self) */}
                {canRemove && (
                  <button
                    onClick={() => removeMutation.mutate(member.userId)}
                    disabled={removeMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-all"
                    title="Eliminar del grupo"
                  >
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 p-5">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Zona de peligro</h2>

        {isOwner ? (
          confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                ¿Seguro que deseas eliminar <strong>{group.name}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                >
                  {deleteMutation.isPending ? "Eliminando..." : "Eliminar grupo"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 size={15} />
              Eliminar grupo
            </button>
          )
        ) : (
          <button
            onClick={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            <UserMinus size={15} />
            {leaveMutation.isPending ? "Saliendo..." : "Salir del grupo"}
          </button>
        )}
      </div>
    </div>
  );
}
