import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { deriveMasterKey } from "@/lib/crypto";
import { useAuthStore } from "@/store/authStore";
import { useVaultStore } from "@/store/vaultStore";

export default function VaultUnlockPage() {
  const [masterPassword, setMasterPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const user = useAuthStore((s) => s.user);
  const unlock = useVaultStore((s) => s.unlock);
  const navigate = useNavigate();

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const key = await deriveMasterKey(masterPassword, user.id);
      unlock(key);
      navigate("/vault");
    } catch {
      setError("No se pudo derivar la clave maestra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 mb-4">
            <Lock size={28} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Desbloquear Vault</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Ingresa tu contraseña maestra para acceder a tus contraseñas cifradas.
            <br />
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Esta clave nunca sale de tu dispositivo.
            </span>
          </p>
        </div>

        <form
          onSubmit={handleUnlock}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 space-y-4"
        >
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Contraseña maestra
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                autoFocus
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? "Desbloqueando..." : "Desbloquear"}
          </button>
        </form>
      </div>
    </div>
  );
}
