import { api } from "@/lib/api";
import type { Group, GroupMember } from "@/types";

export const groupsApi = {
  listGroups: () => api.get<Group[]>("/groups").then((r) => r.data),

  getGroup: (groupId: string) =>
    api.get<Group>(`/groups/${groupId}`).then((r) => r.data),

  createGroup: (data: { name: string; description?: string }) =>
    api.post<Group>("/groups", data).then((r) => r.data),

  deleteGroup: (groupId: string) => api.delete(`/groups/${groupId}`),

  joinGroup: (inviteCode: string) =>
    api.post<{ group: Group }>("/groups/join", { inviteCode }).then((r) => r.data),

  getMembers: (groupId: string) =>
    api.get<GroupMember[]>(`/groups/${groupId}/members`).then((r) => r.data),

  removeMember: (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members`, { data: { userId } }),
};
