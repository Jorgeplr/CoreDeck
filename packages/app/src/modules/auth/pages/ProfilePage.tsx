import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { User, KeyRound, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useVaultStore } from "@/store/vaultStore";
import { api } from "@/lib/api";
import { deriveMasterKey, encryptField, decryptField } from "@/lib/crypto";
import { encryptPrivateKey } from "@/lib/sharedCrypto";
import { vaultApi } from "@/modules/vault/api/vaultApi";
import { vaultShareApi } from "@/modules/vault/api/vaultShareApi";
import WebhooksPanel from "@/modules/webhooks/components/WebhooksPanel";

interface UpdateProfilePayload {
  displayName?: string;
  avatarUrl?: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  reEncryptedEntries?: Array<{
    id: string;
    usernameEncrypted?: string;
    passwordEncrypted: string;
    notesEncrypted?: string;
    iv: string;
  }>;
}

function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
      type === "success"
        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
    }`}>
      {type === "success" ? <Check size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const masterKey = useVaultStore((s) => s.masterKey);
  const privateKey = useVaultStore((s) => s.privateKey);

  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName ?? "",
    avatarUrl: user?.avatarUrl ?? "",
  });
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const profileMutation = useMutation({
    mutationFn: (data: UpdateProfilePayload) =>
      api.patch<{ id: string; email: string; username: string; displayName: string | null; avatarUrl: string | null }>("/users/me", data).then((r) => r.data),
    onSuccess: (updated) => {
      if (accessToken) {
        setAuth(accessToken, { ...user!, ...updated });
      }
      setProfileMsg({ type: "success", msg: "Perfil actualizado correctamente." });
      setTimeout(() => setProfileMsg(null), 3000);
    },
    onError: () => setProfileMsg({ type: "error", msg: "Error al actualizar el perfil." }),
  });

  const pwMutation = useMutation({
    mutationFn: (data: ChangePasswordPayload) =>
      api.post("/users/me/password", data).then((r) => r.data),
    onSuccess: () => {
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwMsg({ type: "success", msg: "Contraseña cambiada correctamente." });
      setTimeout(() => setPwMsg(null), 3000);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setPwMsg({ type: "error", msg: msg ?? "Error al cambiar la contraseña." });
    },
  });

  const handleProfile = (e: FormEvent) => {
    e.preventDefault();
    const payload: UpdateProfilePayload = {};
    if (profileForm.displayName.trim()) payload.displayName = profileForm.displayName.trim();
    if (profileForm.avatarUrl.trim()) payload.avatarUrl = profileForm.avatarUrl.trim();
    profileMutation.mutate(payload);
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ type: "error", msg: "Las contraseñas nuevas no coinciden." });
      return;
    }

    const payload: ChangePasswordPayload = {
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    };

    // If the vault is unlocked, re-encrypt all personal entries with the new master key
    if (masterKey && user) {
      try {
        const entries = await vaultApi.list("PERSONAL");
        const oldKey = masterKey;
        const newKey = await deriveMasterKey(pwForm.newPassword, user.id);

        const reEncryptedEntries = await Promise.all(
          entries.map(async (entry) => {
            const [pw, uname, notes] = await Promise.all([
              decryptField(entry.passwordEncrypted, entry.iv, oldKey),
              entry.usernameEncrypted
                ? decryptField(entry.usernameEncrypted, entry.iv, oldKey)
                : Promise.resolve(""),
              entry.notesEncrypted
                ? decryptField(entry.notesEncrypted, entry.iv, oldKey)
                : Promise.resolve(""),
            ]);
            const { ciphertext: passwordEncrypted, iv } = await encryptField(pw, newKey);
            const { ciphertext: usernameEncrypted } = await encryptField(uname, newKey);
            const { ciphertext: notesEncrypted } = await encryptField(notes, newKey);
            return { id: entry.id, passwordEncrypted, usernameEncrypted, notesEncrypted, iv };
          })
        );
        payload.reEncryptedEntries = reEncryptedEntries;

        // Also re-encrypt the X25519 private key with the new master key so
        // vault sharing keeps working after the password change.
        if (privateKey) {
          const reEnc = await encryptPrivateKey(privateKey, newKey);
          await vaultShareApi.uploadKeypair({
            publicKey: reEnc.publicKeyB64,
            encryptedPrivateKey: reEnc.encryptedPrivateKey,
            privateKeyIv: reEnc.privateKeyIv,
          });
        }
      } catch {
        setPwMsg({ type: "error", msg: "Error al re-encriptar el vault. Asegúrate de que está desbloqueado." });
        return;
      }
    }

    pwMutation.mutate(payload);
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1";

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 flex items-center justify-center">
            <User size={22} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Avatar preview */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
          {profileForm.avatarUrl ? (
            <img src={profileForm.avatarUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {(user?.displayName ?? user?.username ?? "?")[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {user?.displayName ?? user?.username}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">@{user?.username}</p>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <User size={16} />
          Información personal
        </h2>

        {profileMsg && <Alert type={profileMsg.type} msg={profileMsg.msg} />}

        <form onSubmit={handleProfile} className="space-y-4">
          <div>
            <label className={labelCls}>Nombre para mostrar</label>
            <input
              type="text"
              value={profileForm.displayName}
              onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
              placeholder={user?.username}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>URL de avatar</label>
            <input
              type="url"
              value={profileForm.avatarUrl}
              onChange={(e) => setProfileForm((p) => ({ ...p, avatarUrl: e.target.value }))}
              placeholder="https://example.com/avatar.jpg"
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={profileMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {profileMutation.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <KeyRound size={16} />
          Cambiar contraseña
        </h2>

        {pwMsg && <Alert type={pwMsg.type} msg={pwMsg.msg} />}

        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className={labelCls}>Contraseña actual</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              required
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nueva contraseña</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Confirmar nueva contraseña</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              required
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
          <button
            type="submit"
            disabled={pwMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-slate-600 hover:bg-gray-700 dark:hover:bg-slate-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {pwMutation.isPending ? "Cambiando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>

      {/* Personal webhooks */}
      <WebhooksPanel canManage={true} />
    </div>
  );
}
