import { api } from "@/lib/api";
import type { Notification } from "@/types";

export const notificationsApi = {
  list: (unreadOnly = false, limit = 50) =>
    api
      .get<{ items: Notification[]; unreadCount: number }>("/notifications", {
        params: { unreadOnly: unreadOnly ? "true" : undefined, limit },
      })
      .then((r) => r.data),

  markRead: (id: string) => api.patch(`/notifications/${id}`).then((r) => r.data),

  markAllRead: () => api.post(`/notifications/read-all`).then((r) => r.data),

  remove: (id: string) => api.delete(`/notifications/${id}`),

  purgeOld: () => api.delete(`/notifications`),
};
