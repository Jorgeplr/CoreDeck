import { useState, type FormEvent } from "react";
import { X, Wand2 } from "lucide-react";
import { encryptField } from "@/lib/crypto";
import { useVaultStore } from "@/store/vaultStore";
import { vaultApi } from "../api/vaultApi";
import PasswordGenerator from "./PasswordGenerator";

interface Props {
  onClose: () => void;
  onCreated: () => void;
  defaultScope?: "PERSONAL" | "GROUP";
  defaultGroupId?: string;
}

export default function PasswordForm({ onClose, onCreated, defaultScope = "PERSONAL", defaultGroupId }: Props) {
  const masterKey = useVaultStore((s) => s.masterKey);
  const [form, setForm] = useState({ title: "", url: "", username: "", password: "", notes: "" });
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!masterKey) return;
    setLoading(true);
    setError("");
    try {
      const { ciphertext: passwordEncrypted, iv } = await encryptField(form.password, masterKey);
      const usernameEncrypted = form.username
        ? (await encryptField(form.username, masterKey)).ciphertext
        : undefined;
      const notesEncrypted = form.notes
        ? (await encryptField(form.notes, masterKey)).ciphertext
        : undefined;

      await vaultApi.create({
        title: form.title,
        url: form.url || undefined,
        usernameEncrypted,
        passwordEncrypted,
        notesEncrypted,
        iv,
        scope: defaultScope,
        groupId: defaultScope === "GROUP" ? defaultGroupId : undefined,
      });
      onCreated();
    } catch {
      setError("Error al guardar la entrada");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nueva contraseña</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { k: "title" as const, label: "Nombre *", placeholder: "GitHub", type: "text" },
            { k: "url" as const, label: "URL", placeholder: "https://github.com", type: "url" },
            { k: "username" as const, label: "Usuario / Email", placeholder: "tu@email.com", type: "text" },
          ].map(({ k, label, placeholder, type }) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {label}
              </label>
              <input
                type={type}
                value={form[k]}
                onChange={update(k)}
                required={k === "title"}
                placeholder={placeholder}
                className={inputCls}
              />
            </div>
          ))}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Contraseña *</label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-xs text-amber-600 hover:underline flex items-center gap-1"
              >
                <Wand2 size={12} />
                Generar
              </button>
            </div>
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
              required
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {showGenerator && (
            <PasswordGenerator
              onSelect={(pw) => {
                setForm((p) => ({ ...p, password: pw }));
                setShowGenerator(false);
              }}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={update("notes")}
              rows={2}
              placeholder="Notas adicionales..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
