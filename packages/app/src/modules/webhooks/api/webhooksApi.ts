import { api } from "@/lib/api";
import type { Webhook, WebhookEvent } from "@/types";

export interface CreateWebhookPayload {
  name: string;
  url: string;
  events: WebhookEvent[];
  groupId?: string;
  isActive?: boolean;
}

export const webhooksApi = {
  list: (groupId?: string) =>
    api.get<Webhook[]>("/webhooks", { params: { groupId } }).then((r) => r.data),

  create: (data: CreateWebhookPayload) =>
    api.post<Webhook>("/webhooks", data).then((r) => r.data),

  update: (id: string, data: Partial<CreateWebhookPayload>) =>
    api.patch<Webhook>(`/webhooks/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/webhooks/${id}`),

  test: (id: string) =>
    api
      .post<{ status: number; error: string | null }>(`/webhooks/${id}/test`)
      .then((r) => r.data),
};
