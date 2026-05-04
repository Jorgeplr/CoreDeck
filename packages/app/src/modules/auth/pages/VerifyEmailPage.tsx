import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto animate-spin text-primary-600" size={40} />
            <p className="text-gray-600 dark:text-slate-300">Verificando tu correo...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="mx-auto text-green-500" size={40} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">¡Correo verificado!</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Tu cuenta ha sido confirmada correctamente.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full mt-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              Iniciar sesión
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="mx-auto text-red-500" size={40} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enlace inválido</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              El enlace expiró o ya fue usado. Intenta registrarte de nuevo.
            </p>
            <button
              onClick={() => navigate("/register")}
              className="w-full mt-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              Volver al registro
            </button>
          </>
        )}
      </div>
    </div>
  );
}
