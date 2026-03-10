import { api } from "@/lib/api";
import type { Note, Reminder, ReminderStatus } from "@/types";

export const contextApi = {
  // Notes
  listNotes: (groupId?: string) =>
    api.get<Note[]>("/context/notes", { params: { groupId } }).then((r) => r.data),

  getNote: (id: string) => api.get<Note>(`/context/notes/${id}`).then((r) => r.data),

  createNote: (data: { title: string; content: string; isCollaborative?: boolean; groupId?: string }) =>
    api.post<Note>("/context/notes", data).then((r) => r.data),

  updateNote: (id: string, data: Partial<{ title: string; content: string }>) =>
    api.patch<Note>(`/context/notes/${id}`, data).then((r) => r.data),

  deleteNote: (id: string) => api.delete(`/context/notes/${id}`),

  // Reminders
  listReminders: () => api.get<Reminder[]>("/context/reminders").then((r) => r.data),

  createReminder: (data: { title: string; description?: string; dueAt: string }) =>
    api.post<Reminder>("/context/reminders", data).then((r) => r.data),

  updateReminder: (
    id: string,
    data: { title?: string; description?: string; dueAt?: string; status?: ReminderStatus }
  ) => api.patch<Reminder>(`/context/reminders/${id}`, data).then((r) => r.data),

  deleteReminder: (id: string) => api.delete(`/context/reminders/${id}`),
};
