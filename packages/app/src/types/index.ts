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
export type GroupRole = "OWNER" | "ADMIN" | "MEMBER";

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
