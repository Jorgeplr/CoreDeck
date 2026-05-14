import { useState } from "react";
import { Eye, EyeOff, Copy, Check, ExternalLink, Globe, Share2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sealedBoxDecrypt } from "@/lib/sharedCrypto";
import { useVaultStore } from "@/store/vaultStore";
import { vaultShareApi } from "../api/vaultShareApi";
import type { VaultShare } from "@/types";

interface Props {
  share: VaultShare;
}

export default function SharedWithMeCard({ share }: Props) {
  const privateKey = useVaultStore((s) => s.privateKey);
  const qc = useQueryClient();
  const [revealed, setRevealed] = useState(false);
  const [password, setPassword] = useState("••••••••");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revoke = useMutation({
    mutationFn: () => vaultShareApi.remove(share.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vault", "shared-with-me"] }),
  });

  const decrypt = async (): Promise<string | null> => {
    if (!privateKey) {
      setError("Tu vault no está desbloqueado.");
      return null;
    }
    try {
      return await sealedBoxDecrypt(share.passwordEncrypted, share.iv, privateKey);
    } catch (e) {
      setError("No se pudo descifrar este secreto compartido.");
      console.error(e);
      return null;
    }
  };

  const reveal = async () => {
    if (revealed) {
      setPassword("••••••••");
      setRevealed(false);
      return;
    }
    const plain = await decrypt();
    if (plain != null) {
      setPassword(plain);
      setRevealed(true);
    }
  };

  const copy = async () => {
    const plain = revealed ? password : await decrypt();
    if (plain != null) {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const entry = share.entry;
  const title = entry?.title ?? "—";
  const url = entry?.url ?? null;
  const iconBtn = "p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl shrink-0 bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300 flex items-center justify-center font-bold">
          {title.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{title}</h3>
            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 flex items-center gap-1">
              <Share2 size={10} />
              Compartido
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            de <span className="font-medium">@{share.sharedByUser?.username ?? "—"}</span>
          </p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1 mt-0.5 truncate w-fit"
            >
              <Globe size={10} />
              {url.replace(/^https?:\/\//, "")}
              <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl px-3 py-2 border border-gray-100 dark:border-slate-700">
        <code className="flex-1 text-sm font-mono text-gray-700 dark:text-slate-300 truncate tracking-wider">
          {password}
        </code>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={reveal} className={iconBtn} title={revealed ? "Ocultar" : "Revelar"}>
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={copy} className={iconBtn} title="Copiar">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => revoke.mutate()}
            className={`${iconBtn} hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500`}
            title="Quitar de mi vault"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
