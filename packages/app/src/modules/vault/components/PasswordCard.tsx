import { useState } from "react";
import { Eye, EyeOff, Copy, Check, Trash2, ExternalLink } from "lucide-react";
import { decryptField } from "@/lib/crypto";
import { useVaultStore } from "@/store/vaultStore";
import type { VaultEntry } from "@/types";

interface Props {
  entry: VaultEntry;
  onDelete: (id: string) => void;
}

export default function PasswordCard({ entry, onDelete }: Props) {
  const masterKey = useVaultStore((s) => s.masterKey);
  const [revealed, setRevealed] = useState(false);
  const [password, setPassword] = useState("••••••••");
  const [copied, setCopied] = useState(false);

  const reveal = async () => {
    if (!masterKey) return;
    if (!revealed) {
      const plain = await decryptField(entry.passwordEncrypted, entry.iv, masterKey);
      setPassword(plain);
    } else {
      setPassword("••••••••");
    }
    setRevealed(!revealed);
  };

  const copy = async () => {
    if (!masterKey) return;
    const plain = revealed ? password : await decryptField(entry.passwordEncrypted, entry.iv, masterKey);
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{entry.title}</h3>
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-primary-500 flex items-center gap-1 mt-0.5 truncate"
            >
              <ExternalLink size={10} />
              {entry.url}
            </a>
          )}
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 flex-shrink-0 ${
            entry.scope === "GROUP"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          }`}
        >
          {entry.scope === "GROUP" ? "Grupo" : "Personal"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm bg-gray-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg font-mono text-gray-700 dark:text-slate-300 truncate">
          {password}
        </code>
        <button
          onClick={reveal}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title={revealed ? "Ocultar" : "Revelar"}
        >
          {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button
          onClick={copy}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title="Copiar"
        >
          {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
