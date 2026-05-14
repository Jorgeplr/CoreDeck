import { api } from "@/lib/api";
import type { SlaPolicy, TicketPriority } from "@/types";

export interface SlaPolicyPayload {
  groupId?: string;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
}

export const slaApi = {
  list: (groupId?: string) =>
    api.get<SlaPolicy[]>("/sla/policies", { params: { groupId } }).then((r) => r.data),

  upsert: (data: SlaPolicyPayload) =>
    api.post<SlaPolicy>("/sla/policies", data).then((r) => r.data),

  update: (
    id: string,
    data: Partial<Omit<SlaPolicyPayload, "groupId">>
  ) => api.patch<SlaPolicy>(`/sla/policies/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/sla/policies/${id}`),
};
