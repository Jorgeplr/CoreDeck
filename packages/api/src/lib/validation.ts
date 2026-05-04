import { z } from "zod";

// Auth
export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(60).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Groups
export const createGroupSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(4).max(10),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

// Vault
export const createVaultEntrySchema = z.object({
  title: z.string().min(1).max(100),
  url: z.string().url().optional().or(z.literal("")),
  usernameEncrypted: z.string().optional(),
  passwordEncrypted: z.string().min(1),
  notesEncrypted: z.string().optional(),
  iv: z.string().min(1),
  scope: z.enum(["PERSONAL", "GROUP"]).default("PERSONAL"),
  groupId: z.string().optional(),
});

export const updateVaultEntrySchema = createVaultEntrySchema.partial();

// Flow
export const createTicketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "IN_REVIEW", "RESOLVED"]).default("OPEN"),
  priority: z.enum(["CRITICAL", "URGENT", "NORMAL", "LOW"]).default("NORMAL"),
  scope: z.enum(["INDIVIDUAL", "GROUP"]).default("INDIVIDUAL"),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.string().optional(),
  groupId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
});

export const updateTicketSchema = createTicketSchema.partial();

export const createLabelSchema = z.object({
  name: z.string().min(1).max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#6b7280"),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const createRecurringTicketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["CRITICAL", "URGENT", "NORMAL", "LOW"]).default("NORMAL"),
  scope: z.enum(["INDIVIDUAL", "GROUP"]).default("INDIVIDUAL"),
  groupId: z.string().optional(),
  assignedToId: z.string().optional(),
  cronExpr: z.string().min(1), // e.g. "0 9 * * 1"
  isActive: z.boolean().default(true),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
  title: z.string().min(1).max(200),
  body: z.string().optional(),
  priority: z.enum(["CRITICAL", "URGENT", "NORMAL", "LOW"]).default("NORMAL"),
  scope: z.enum(["INDIVIDUAL", "GROUP"]).default("INDIVIDUAL"),
  groupId: z.string().optional(),
});

// Context
export const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  isCollaborative: z.boolean().default(false),
  groupId: z.string().optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export const createReminderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  dueAt: z.string().datetime(),
});

export const updateReminderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  dueAt: z.string().datetime().optional(),
  status: z.enum(["PENDING", "NOTIFIED", "DISMISSED", "DONE"]).optional(),
});
