import { api } from "@/lib/api";
import type { VaultShare } from "@/types";

export interface CreateVaultSharePayload {
  sharedWithUserId: string;
  passwordEncrypted: string;
  iv: string;
}

export const vaultShareApi = {
  listForEntry: (entryId: string) =>
    api.get<VaultShare[]>(`/vault/${entryId}/shares`).then((r) => r.data),

  create: (entryId: string, data: CreateVaultSharePayload) =>
    api.post<VaultShare>(`/vault/${entryId}/shares`, data).then((r) => r.data),

  remove: (shareId: string) => api.delete(`/vault/shares/${shareId}`),

  sharedWithMe: () => api.get<VaultShare[]>("/vault/shared-with-me").then((r) => r.data),

  getPublicKey: (username: string) =>
    api.get<{ userId: string; publicKey: string }>(`/users/by-username/${username}/public-key`).then((r) => r.data),

  uploadKeypair: (data: { publicKey: string; encryptedPrivateKey: string; privateKeyIv: string }) =>
    api.put("/users/me/keypair", data),

  getMyKeypair: () =>
    api
      .get<{ publicKey: string | null; encryptedPrivateKey: string | null; privateKeyIv: string | null }>(
        "/users/me/keypair"
      )
      .then((r) => r.data),
};
