import { api } from "@/lib/api";
import type { Ticket, TicketHistoryEntry, TicketComment, Label, TicketStatus, TicketPriority } from "@/types";

export interface CreateTicketPayload {
  title: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  scope?: "INDIVIDUAL" | "GROUP";
  dueDate?: string;
  assignedToId?: string;
  groupId?: string;
  labelIds?: string[];
}

export const flowApi = {
  listTickets: (params?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    groupId?: string;
    scope?: string;
    assignedToId?: string;
  }) => api.get<Ticket[]>("/flow/tickets", { params }).then((r) => r.data),

  getTicket: (id: string) => api.get<Ticket>(`/flow/tickets/${id}`).then((r) => r.data),

  createTicket: (data: CreateTicketPayload) =>
    api.post<Ticket>("/flow/tickets", data).then((r) => r.data),

  updateTicket: (id: string, data: Partial<CreateTicketPayload>) =>
    api.patch<Ticket>(`/flow/tickets/${id}`, data).then((r) => r.data),

  deleteTicket: (id: string) => api.delete(`/flow/tickets/${id}`),

  getTicketHistory: (id: string) =>
    api.get<TicketHistoryEntry[]>(`/flow/tickets/${id}/history`).then((r) => r.data),

  listLabels: () => api.get<Label[]>("/flow/labels").then((r) => r.data),

  getComments: (ticketId: string) =>
    api.get<TicketComment[]>(`/flow/tickets/${ticketId}/comments`).then((r) => r.data),

  addComment: (ticketId: string, content: string) =>
    api.post<TicketComment>(`/flow/tickets/${ticketId}/comments`, { content }).then((r) => r.data),
};
