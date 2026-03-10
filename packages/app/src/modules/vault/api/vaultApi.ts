import { api } from "@/lib/api";
import type { VaultEntry } from "@/types";

export interface CreateVaultEntryPayload {
  title: string;
  url?: string;
  usernameEncrypted?: string;
  passwordEncrypted: string;
  notesEncrypted?: string;
  iv: string;
  scope: "PERSONAL" | "GROUP";
  groupId?: string;
}

export const vaultApi = {
  list: (scope?: "PERSONAL" | "GROUP", groupId?: string) =>
    api
      .get<VaultEntry[]>("/vault", { params: { scope, groupId } })
      .then((r) => r.data),

  get: (id: string) => api.get<VaultEntry>(`/vault/${id}`).then((r) => r.data),

  create: (data: CreateVaultEntryPayload) =>
    api.post<VaultEntry>("/vault", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateVaultEntryPayload>) =>
    api.patch<VaultEntry>(`/vault/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/vault/${id}`),
};
