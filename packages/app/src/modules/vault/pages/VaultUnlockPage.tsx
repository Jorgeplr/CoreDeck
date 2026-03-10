import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-5">
            <KeyRound size={30} className="text-amber-500 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Desbloquear Vault</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
            Tu contraseña maestra cifra todos tus datos.<br />
            <span className="text-amber-600 dark:text-amber-400 font-medium">Nunca sale de este dispositivo.</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-4 py-3 rounded-xl border border-red-100 dark:border-red-900">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
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
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-sm"
            >
              <ShieldCheck size={16} />
              {loading ? "Derivando clave..." : "Desbloquear"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-4">
          Cifrado E2EE con AES-256-GCM • PBKDF2 310,000 iteraciones
        </p>
      </div>
    </div>
  );
}
