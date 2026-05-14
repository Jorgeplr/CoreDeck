import { api } from "@/lib/api";
import type { TimeEntry } from "@/types";

export const timeApi = {
  list: (ticketId: string) =>
    api
      .get<{ items: TimeEntry[]; totalSec: number }>(`/flow/tickets/${ticketId}/time-entries`)
      .then((r) => r.data),

  start: (ticketId: string, note?: string) =>
    api
      .post<TimeEntry>(`/flow/tickets/${ticketId}/time-entries`, { note })
      .then((r) => r.data),

  stop: (entryId: string, note?: string) =>
    api
      .patch<TimeEntry>(`/flow/time-entries/${entryId}`, { note })
      .then((r) => r.data),

  remove: (entryId: string) => api.delete(`/flow/time-entries/${entryId}`),
};
