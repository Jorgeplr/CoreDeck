import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, MailWarning, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "../api/authApi";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResendStatus("idle");
    setLoading(true);
    try {
      const { accessToken, user } = await authApi.login(email, password);
      setAuth(accessToken, user);
      navigate("/vault");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error al iniciar sesión";

      if (status === 403) {
        setNeedsVerification(true);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus("sending");
    try {
      await api.post("/auth/resend-verification", { email });
      setResendStatus("sent");
    } catch {
      setResendStatus("idle");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white font-bold text-xl mb-4">
            CD
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenido a CoreDesk</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Inicia sesión en tu cuenta</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-5"
        >
          {error && (
            <div className={`text-sm px-4 py-3 rounded-lg space-y-2 ${
              needsVerification
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}>
              <div className="flex items-start gap-2">
                {needsVerification && <MailWarning size={16} className="shrink-0 mt-0.5" />}
                <p>{error}</p>
              </div>

              {needsVerification && (
                resendStatus === "sent" ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    ✓ Email reenviado — revisa tu bandeja de entrada
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendStatus === "sending"}
                    className="flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 hover:no-underline disabled:opacity-60"
                  >
                    <RefreshCw size={12} className={resendStatus === "sending" ? "animate-spin" : ""} />
                    {resendStatus === "sending" ? "Enviando..." : "Reenviar email de verificación"}
                  </button>
                )
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            <LogIn size={16} />
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-primary-600 hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
