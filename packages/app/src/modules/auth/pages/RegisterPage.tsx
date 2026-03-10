import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "../api/authApi";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { accessToken, user } = await authApi.register(form);
      setAuth(accessToken, user);
      navigate("/vault");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error al registrarse";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fields: { key: keyof typeof form; label: string; type: string; placeholder: string }[] = [
    { key: "displayName", label: "Nombre completo", type: "text", placeholder: "Juan García" },
    { key: "username", label: "Usuario", type: "text", placeholder: "juangarcia" },
    { key: "email", label: "Email", type: "email", placeholder: "tu@email.com" },
    { key: "password", label: "Contraseña (mín. 8 caracteres)", type: "password", placeholder: "••••••••" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white font-bold text-xl mb-4">
            CD
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Crea tu cuenta</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Empieza a usar CoreDesk gratis</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-4"
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                {label}
              </label>
              <input
                type={type}
                required={key !== "displayName"}
                value={form[key]}
                onChange={update(key)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                placeholder={placeholder}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm mt-2"
          >
            <UserPlus size={16} />
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
