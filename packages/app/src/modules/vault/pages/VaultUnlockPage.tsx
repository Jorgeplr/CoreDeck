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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--app-panel-2)] ring-1 ring-[var(--app-border)] mb-5">
            <KeyRound size={30} className="text-[var(--app-accent-2)]" />
          </div>
          <h2 className="text-2xl font-display text-[var(--app-text)] mb-2">Desbloquear Vault</h2>
          <p className="text-sm text-[var(--app-muted)] leading-relaxed">
            Tu contraseña maestra cifra todos tus datos.<br />
            <span className="text-[var(--app-accent)] font-medium">Nunca sale de este dispositivo.</span>
          </p>
        </div>

        <div className="bg-[var(--app-panel)] rounded-3xl shadow-[var(--app-shadow)] ring-1 ring-[var(--app-border)] p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--app-text)] mb-1.5">
                Contraseña maestra
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  autoFocus
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel-2)] text-[var(--app-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-ring)] focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--app-muted)] hover:text-[var(--app-text)] transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--app-accent)] to-[var(--app-accent-2)] disabled:opacity-60 text-white font-semibold py-2.5 rounded-2xl transition-transform hover:scale-[1.01] text-sm"
            >
              <ShieldCheck size={16} />
              {loading ? "Derivando clave..." : "Desbloquear"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--app-muted)] mt-4">
          Cifrado E2EE con AES-256-GCM • PBKDF2 310,000 iteraciones
        </p>
      </div>
    </div>
  );
}
