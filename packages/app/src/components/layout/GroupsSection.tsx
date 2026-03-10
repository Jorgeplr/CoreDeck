import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Copy, Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "@/modules/groups/api/groupsApi";
import clsx from "clsx";

type Modal = "create" | "join" | null;

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

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
      className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
      title="Copiar código"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [created, setCreated] = useState<{ name: string; inviteCode: string } | null>(null);

  const mutation = useMutation({
    mutationFn: groupsApi.createGroup,
    onSuccess: (group) => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      setCreated({ name: group.name, inviteCode: group.inviteCode });
    },
  });

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500";

  if (created) {
    return (
      <Modal title="¡Grupo creado!" onClose={onClose}>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Comparte este código para que otros miembros se unan a <strong>{created.name}</strong>.
        </p>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-xl px-4 py-3">
          <span className="flex-1 text-xl font-mono font-bold tracking-widest text-gray-900 dark:text-white">
            {created.inviteCode}
          </span>
          <CopyButton text={created.inviteCode} />
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          Listo
        </button>
      </Modal>
    );
  }

  return (
    <Modal title="Crear grupo" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Nombre del grupo *</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="Mi equipo"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
            placeholder="Opcional..."
          />
        </div>
        {mutation.isError && (
          <p className="text-xs text-red-500">Error al crear el grupo. Intenta de nuevo.</p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => mutation.mutate({ name: name.trim(), description: description.trim() || undefined })}
          disabled={!name.trim() || mutation.isPending}
          className="flex-1 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
        >
          {mutation.isPending ? "Creando..." : "Crear"}
        </button>
      </div>
    </Modal>
  );
}

function JoinGroupModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [joined, setJoined] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: groupsApi.joinGroup,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      setJoined(data.group.name);
    },
  });

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-center font-mono tracking-widest uppercase";

  if (joined) {
    return (
      <Modal title="¡Te uniste!" onClose={onClose}>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Ahora eres miembro de <strong>{joined}</strong>.
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          Listo
        </button>
      </Modal>
    );
  }

  const errorMsg = (mutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error;

  return (
    <Modal title="Unirse a un grupo" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Ingresa el código de invitación que te compartieron.
        </p>
        <input
          autoFocus
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 10))}
          className={inputCls}
          placeholder="XXXXXX"
          maxLength={10}
        />
        {mutation.isError && (
          <p className="text-xs text-red-500">
            {errorMsg === "Invalid invite code" ? "Código inválido." :
             errorMsg === "Already a member" ? "Ya eres miembro de este grupo." :
             "Error al unirse. Intenta de nuevo."}
          </p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => mutation.mutate(code.trim())}
          disabled={code.trim().length < 4 || mutation.isPending}
          className="flex-1 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
        >
          {mutation.isPending ? "Uniéndose..." : "Unirse"}
        </button>
      </div>
    </Modal>
  );
}

interface Props {
  sidebarOpen: boolean;
}

export default function GroupsSection({ sidebarOpen }: Props) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.listGroups,
  });

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  if (!sidebarOpen) {
    return (
      <div className="px-2 py-2 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setModal("create")}
          className="flex items-center justify-center w-full p-2.5 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Grupos"
        >
          <Users size={20} />
        </button>
        {modal === "create" && <CreateGroupModal onClose={() => setModal(null)} />}
        {modal === "join" && <JoinGroupModal onClose={() => setModal(null)} />}
      </div>
    );
  }

  return (
    <div className="px-2 py-2 border-t border-gray-200 dark:border-slate-700">
      {/* Header row */}
      <div className="flex items-center justify-between px-1 mb-1">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          Grupos
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-white transition-colors"
            title="Crear o unirse a un grupo"
          >
            <Plus size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-30 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 w-44">
              <button
                onClick={() => { setModal("create"); setMenuOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Plus size={14} className="text-primary-500" />
                Crear grupo
              </button>
              <button
                onClick={() => { setModal("join"); setMenuOpen(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Users size={14} className="text-primary-500" />
                Unirse por código
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Group list */}
      {expanded && (
        <div className="space-y-0.5">
          {groups.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-slate-600 px-3 py-2">
              Sin grupos aún
            </p>
          ) : (
            groups.map((g) => (
              <button
                key={g.id}
                onClick={() => navigate(`/groups/${g.id}`)}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left",
                  "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <div className="w-5 h-5 rounded bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
                  <Users size={11} className="text-primary-600 dark:text-primary-400" />
                </div>
                <span className="truncate text-xs font-medium">{g.name}</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-slate-600 shrink-0">
                  {g._count?.members ?? ""}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {modal === "create" && <CreateGroupModal onClose={() => setModal(null)} />}
      {modal === "join" && <JoinGroupModal onClose={() => setModal(null)} />}
    </div>
  );
}
