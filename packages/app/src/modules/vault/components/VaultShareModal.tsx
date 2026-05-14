import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Share2, X, Trash2, UserPlus, AlertCircle, Check } from "lucide-react";
import { decryptField } from "@/lib/crypto";
import { sealedBoxEncrypt } from "@/lib/sharedCrypto";
import { useVaultStore } from "@/store/vaultStore";
import { vaultShareApi } from "../api/vaultShareApi";
import type { VaultEntry } from "@/types";

interface Props {
  entry: VaultEntry;
  onClose: () => void;
}

export default function VaultShareModal({ entry, onClose }: Props) {
  const qc = useQueryClient();
  const masterKey = useVaultStore((s) => s.masterKey);
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<{ type: "ok" | "error"; msg: string } | null>(null);

  const { data: shares = [], isLoading } = useQuery({
    queryKey: ["vault", entry.id, "shares"],
    queryFn: () => vaultShareApi.listForEntry(entry.id),
  });

  const remove = useMutation({
    mutationFn: (shareId: string) => vaultShareApi.remove(shareId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vault", entry.id, "shares"] }),
  });

  const share = useMutation({
    mutationFn: async (recipientUsername: string) => {
      if (!masterKey) throw new Error("Vault bloqueado");
      // Look up recipient's public key first — fails fast if no keypair yet.
      const recipient = await vaultShareApi.getPublicKey(recipientUsername);
      // Decrypt the password locally with our master key.
      const plaintext = await decryptField(
        entry.passwordEncrypted,
        entry.iv,
        masterKey
      );
      const { passwordEncrypted, iv } = await sealedBoxEncrypt(
        plaintext,
        recipient.publicKey
      );
      return vaultShareApi.create(entry.id, {
        sharedWithUserId: recipient.userId,
        passwordEncrypted,
        iv,
      });
    },
    onSuccess: () => {
      setUsername("");
      setStatus({ type: "ok", msg: "Compartido correctamente" });
      qc.invalidateQueries({ queryKey: ["vault", entry.id, "shares"] });
      qc.invalidateQueries({ queryKey: ["vault", "shared-with-me"] });
      setTimeout(() => setStatus(null), 2500);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (err instanceof Error ? err.message : "Error al compartir");
      setStatus({ type: "error", msg });
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-primary-600 dark:text-primary-400" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Compartir entrada</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{entry.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Form */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400">
              Usuario destinatario
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && username) share.mutate(username);
                }}
                placeholder="@usuario"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={() => share.mutate(username)}
                disabled={!username || share.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium"
              >
                <UserPlus size={14} />
                {share.isPending ? "..." : "Compartir"}
              </button>
            </div>
            {status && (
              <div
                className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                  status.type === "ok"
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                }`}
              >
                {status.type === "ok" ? <Check size={13} /> : <AlertCircle size={13} />}
                {status.msg}
              </div>
            )}
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              El secreto se cifra en tu dispositivo con la clave pública del destinatario antes de subirse. Tu contraseña maestra nunca sale de aquí.
            </p>
          </div>

          {/* Current shares */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              Compartido con ({shares.length})
            </p>
            {isLoading ? (
              <p className="text-sm text-gray-400">Cargando…</p>
            ) : shares.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-500 italic">
                Aún no se ha compartido con nadie.
              </p>
            ) : (
              shares.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-xs font-semibold text-primary-600 dark:text-primary-400">
                    {(s.sharedWithUser?.displayName ?? s.sharedWithUser?.username ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                      {s.sharedWithUser?.displayName ?? s.sharedWithUser?.username ?? s.sharedWithUserId}
                    </p>
                    {s.sharedWithUser?.username && s.sharedWithUser.displayName && (
                      <p className="text-xs text-gray-400 truncate">@{s.sharedWithUser.username}</p>
                    )}
                  </div>
                  <button
                    onClick={() => remove.mutate(s.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                    title="Revocar acceso"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
