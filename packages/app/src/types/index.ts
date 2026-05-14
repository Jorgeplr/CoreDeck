// Auth
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt?: string;
}

// Groups
export type GroupRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  inviteCode: string;
  createdAt: string;
  _count?: { members: number; tickets?: number; notes?: number };
  members?: Array<{ role: GroupRole }>;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: GroupRole;
  joinedAt: string;
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl" | "email">;
}

// Vault
export type VaultScope = "PERSONAL" | "GROUP";

export interface VaultEntry {
  id: string;
  title: string;
  url: string | null;
  usernameEncrypted: string | null;
  passwordEncrypted: string;
  notesEncrypted: string | null;
  iv: string;
  scope: VaultScope;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VaultEntryDecrypted {
  id: string;
  title: string;
  url: string | null;
  username: string;
  password: string;
  notes: string;
  scope: VaultScope;
}

// Flow
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "IN_REVIEW" | "RESOLVED";
export type TicketPriority = "CRITICAL" | "URGENT" | "NORMAL" | "LOW";
export type TicketScope = "INDIVIDUAL" | "GROUP";

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  scope: TicketScope;
  dueDate: string | null;
  createdById: string;
  assignedToId: string | null;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  assignedTo: Pick<User, "id" | "username" | "displayName" | "avatarUrl"> | null;
  labels: Array<{ label: Label }>;
  _count?: { history: number };
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
}

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  userId: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
}

// Context
export interface Note {
  id: string;
  title: string;
  content?: string;
  isCollaborative: boolean;
  userId: string | null;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReminderStatus = "PENDING" | "NOTIFIED" | "DISMISSED" | "DONE";

export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  dueAt: string;
  status: ReminderStatus;
  notifiedAt: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Notifications
export type NotificationType =
  | "TICKET_ASSIGNED"
  | "TICKET_MENTIONED"
  | "TICKET_COMMENTED"
  | "TICKET_DUE_SOON"
  | "REMINDER_DUE"
  | "SLA_BREACHED"
  | "VAULT_SHARED";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  ticketId: string | null;
  readAt: string | null;
  createdAt: string;
}

// Time tracking
export interface TimeEntry {
  id: string;
  ticketId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  note: string | null;
  createdAt: string;
  user?: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
}

// SLA
export interface SlaPolicy {
  id: string;
  groupId: string | null;
  priority: TicketPriority;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// Webhooks
export type WebhookEvent =
  | "ticket.created"
  | "ticket.updated"
  | "ticket.status_changed"
  | "ticket.assigned"
  | "ticket.deleted"
  | "ticket.commented"
  | "ticket.sla_breached";

export interface Webhook {
  id: string;
  userId: string;
  groupId: string | null;
  name: string;
  url: string;
  secret: string;
  events: string; // comma-separated WebhookEvent
  isActive: boolean;
  lastFiredAt: string | null;
  lastStatus: number | null;
  failureCount: number;
  createdAt: string;
}

// Vault sharing
export interface VaultShare {
  id: string;
  entryId: string;
  sharedWithUserId: string;
  sharedByUserId: string;
  passwordEncrypted: string;
  iv: string;
  createdAt: string;
  sharedWithUser?: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  sharedByUser?: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  entry?: Pick<VaultEntry, "id" | "title" | "url" | "scope">;
}
