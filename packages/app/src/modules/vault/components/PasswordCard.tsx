import { useState } from "react";
import { Eye, EyeOff, Copy, Check, Trash2, ExternalLink, Globe, Share2 } from "lucide-react";
import { decryptField } from "@/lib/crypto";
import { useVaultStore } from "@/store/vaultStore";
import type { VaultEntry } from "@/types";
import VaultShareModal from "./VaultShareModal";

interface Props {
  entry: VaultEntry;
  onDelete: (id: string) => void;
}

function SiteAvatar({ title, url }: { title: string; url: string | null }) {
  const letter = title.charAt(0).toUpperCase();
  const colors = [
    "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
    "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300",
    "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300",
    "bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300",
    "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300",
    "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300",
  ];
  const colorIdx = title.charCodeAt(0) % colors.length;
  if (url) {
    try {
      const domain = new URL(url).hostname;
      void domain;
      return (
        <div className={`w-10 h-10 rounded-xl shrink-0 ${colors[colorIdx]} flex items-center justify-center font-bold text-base`}>
          {letter}
        </div>
      );
    } catch { /* invalid url */ }
  }
  return (
    <div className={`w-10 h-10 rounded-xl shrink-0 ${colors[colorIdx]} flex items-center justify-center font-bold text-base`}>
      {letter}
    </div>
  );
}

export default function PasswordCard({ entry, onDelete }: Props) {
  const masterKey = useVaultStore((s) => s.masterKey);
  const [revealed, setRevealed] = useState(false);
  const [password, setPassword] = useState("••••••••");
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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

  const iconBtn = "p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-slate-600 transition-all group">
      <div className="flex items-start gap-3 mb-3">
        <SiteAvatar title={entry.title} url={entry.url} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{entry.title}</h3>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
              entry.scope === "GROUP"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            }`}>
              {entry.scope === "GROUP" ? "Grupo" : "Personal"}
            </span>
          </div>
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 dark:text-slate-500 hover:text-primary-500 flex items-center gap-1 mt-0.5 truncate w-fit"
              onClick={(e) => e.stopPropagation()}
            >
              <Globe size={10} />
              {entry.url.replace(/^https?:\/\//, "")}
              <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>

      {/* Password row */}
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl px-3 py-2 border border-gray-100 dark:border-slate-700">
        <code className="flex-1 text-sm font-mono text-gray-700 dark:text-slate-300 truncate tracking-wider">
          {password}
        </code>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={reveal} className={iconBtn} title={revealed ? "Ocultar" : "Revelar"}>
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={copy} className={iconBtn} title="Copiar contraseña">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
          {entry.scope === "PERSONAL" && (
            <button
              onClick={() => setShareOpen(true)}
              className={iconBtn}
              title="Compartir con otro usuario"
            >
              <Share2 size={14} />
            </button>
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => onDelete(entry.id)}
                className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className={`${iconBtn} hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400`}
              title="Eliminar"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {shareOpen && <VaultShareModal entry={entry} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
