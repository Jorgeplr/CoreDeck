import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  createGroupSchema,
  updateGroupSchema,
  joinGroupSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  createVaultEntrySchema,
  updateVaultEntrySchema,
  createTicketSchema,
  updateTicketSchema,
  createLabelSchema,
  createCommentSchema,
  createRecurringTicketSchema,
  createTemplateSchema,
  createNoteSchema,
  updateNoteSchema,
  createReminderSchema,
  updateReminderSchema,
} from "./validation";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// ─── Security ──────────────────────────────────────────────────────────────
const bearerAuth = registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT de acceso emitido por /api/auth/login o /api/auth/refresh",
});

// ─── Common response shapes ────────────────────────────────────────────────
const ErrorResponse = registry.register(
  "ErrorResponse",
  z.object({
    error: z.union([z.string(), z.record(z.unknown())]).openapi({
      description: "Mensaje de error o objeto Zod flatten()",
    }),
  })
);

const UserPublic = registry.register(
  "UserPublic",
  z.object({
    id: z.string(),
    email: z.string().email(),
    username: z.string(),
    displayName: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
    isActive: z.boolean(),
    createdAt: z.string().datetime().optional(),
  })
);

const AuthResponse = registry.register(
  "AuthResponse",
  z.object({
    accessToken: z.string(),
    user: UserPublic,
  })
);

const Group = registry.register(
  "Group",
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    slug: z.string(),
    inviteCode: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

const Label = registry.register(
  "Label",
  z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
  })
);

const Ticket = registry.register(
  "Ticket",
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    status: z.enum(["OPEN", "IN_PROGRESS", "IN_REVIEW", "RESOLVED"]),
    priority: z.enum(["CRITICAL", "URGENT", "NORMAL", "LOW"]),
    scope: z.enum(["INDIVIDUAL", "GROUP"]),
    dueDate: z.string().datetime().nullable().optional(),
    createdById: z.string(),
    assignedToId: z.string().nullable().optional(),
    groupId: z.string().nullable().optional(),
    templateId: z.string().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

const TicketComment = registry.register(
  "TicketComment",
  z.object({
    id: z.string(),
    ticketId: z.string(),
    userId: z.string(),
    content: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

const VaultEntry = registry.register(
  "VaultEntry",
  z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().nullable().optional(),
    usernameEncrypted: z.string().nullable().optional(),
    passwordEncrypted: z.string(),
    notesEncrypted: z.string().nullable().optional(),
    iv: z.string(),
    scope: z.enum(["PERSONAL", "GROUP"]),
    userId: z.string().nullable().optional(),
    groupId: z.string().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

const Note = registry.register(
  "Note",
  z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    isCollaborative: z.boolean(),
    userId: z.string().nullable().optional(),
    groupId: z.string().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

const Reminder = registry.register(
  "Reminder",
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    dueAt: z.string().datetime(),
    status: z.enum(["PENDING", "NOTIFIED", "DISMISSED", "DONE"]),
    userId: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
);

const Attachment = registry.register(
  "Attachment",
  z.object({
    id: z.string(),
    filename: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number().int(),
    ticketId: z.string().nullable().optional(),
    noteId: z.string().nullable().optional(),
    uploadedById: z.string(),
    createdAt: z.string().datetime(),
  })
);

const RecurringTicket = registry.register(
  "RecurringTicket",
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    priority: z.enum(["CRITICAL", "URGENT", "NORMAL", "LOW"]),
    scope: z.enum(["INDIVIDUAL", "GROUP"]),
    cronExpr: z.string(),
    isActive: z.boolean(),
    lastRun: z.string().datetime().nullable().optional(),
    nextRunAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime(),
  })
);

const TicketTemplate = registry.register(
  "TicketTemplate",
  z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    title: z.string(),
    body: z.string().nullable().optional(),
    priority: z.enum(["CRITICAL", "URGENT", "NORMAL", "LOW"]),
    scope: z.enum(["INDIVIDUAL", "GROUP"]),
    createdAt: z.string().datetime(),
  })
);

// Register request schemas so they appear under components.schemas
registry.register("RegisterRequest", registerSchema);
registry.register("LoginRequest", loginSchema);
registry.register("CreateGroupRequest", createGroupSchema);
registry.register("UpdateGroupRequest", updateGroupSchema);
registry.register("JoinGroupRequest", joinGroupSchema);
registry.register("InviteMemberRequest", inviteMemberSchema);
registry.register("UpdateMemberRoleRequest", updateMemberRoleSchema);
registry.register("CreateVaultEntryRequest", createVaultEntrySchema);
registry.register("UpdateVaultEntryRequest", updateVaultEntrySchema);
registry.register("CreateTicketRequest", createTicketSchema);
registry.register("UpdateTicketRequest", updateTicketSchema);
registry.register("CreateLabelRequest", createLabelSchema);
registry.register("CreateCommentRequest", createCommentSchema);
registry.register("CreateRecurringTicketRequest", createRecurringTicketSchema);
registry.register("CreateTemplateRequest", createTemplateSchema);
registry.register("CreateNoteRequest", createNoteSchema);
registry.register("UpdateNoteRequest", updateNoteSchema);
registry.register("CreateReminderRequest", createReminderSchema);
registry.register("UpdateReminderRequest", updateReminderSchema);

// ─── Helpers ───────────────────────────────────────────────────────────────
const jsonBody = <T extends z.ZodTypeAny>(schema: T) => ({
  content: { "application/json": { schema } },
});

const errorResponses = {
  400: { description: "Datos inválidos", ...jsonBody(ErrorResponse) },
  401: { description: "No autenticado", ...jsonBody(ErrorResponse) },
  403: { description: "Prohibido", ...jsonBody(ErrorResponse) },
  404: { description: "No encontrado", ...jsonBody(ErrorResponse) },
  429: { description: "Demasiadas solicitudes", ...jsonBody(ErrorResponse) },
  500: { description: "Error interno", ...jsonBody(ErrorResponse) },
};

const secured = [{ [bearerAuth.name]: [] as string[] }];

// ─── Paths: Auth ───────────────────────────────────────────────────────────
registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  tags: ["Auth"],
  summary: "Registrar nuevo usuario",
  description: "Crea una cuenta y envía email de verificación. Rate-limit: 5/min por IP.",
  request: { body: jsonBody(registerSchema) },
  responses: {
    201: { description: "Usuario creado", ...jsonBody(z.object({ user: UserPublic })) },
    400: errorResponses[400],
    409: { description: "Email o username ya existen", ...jsonBody(ErrorResponse) },
    429: errorResponses[429],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  tags: ["Auth"],
  summary: "Iniciar sesión",
  description: "Devuelve accessToken (JWT) + cookie HttpOnly con refreshToken. Rate-limit: 10/min por IP.",
  request: { body: jsonBody(loginSchema) },
  responses: {
    200: { description: "Login correcto", ...jsonBody(AuthResponse) },
    400: errorResponses[400],
    401: errorResponses[401],
    403: { description: "Email no verificado", ...jsonBody(ErrorResponse) },
    429: errorResponses[429],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  tags: ["Auth"],
  summary: "Cerrar sesión",
  description: "Revoca el refresh token y borra la cookie.",
  responses: {
    200: { description: "Sesión cerrada", ...jsonBody(z.object({ ok: z.boolean() })) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/refresh",
  tags: ["Auth"],
  summary: "Refrescar access token",
  description: "Usa la cookie HttpOnly refreshToken para emitir un nuevo access token.",
  responses: {
    200: { description: "Nuevo accessToken", ...jsonBody(z.object({ accessToken: z.string() })) },
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/auth/verify-email",
  tags: ["Auth"],
  summary: "Verificar email",
  request: { query: z.object({ token: z.string() }) },
  responses: {
    200: { description: "Email verificado", ...jsonBody(z.object({ ok: z.boolean() })) },
    400: errorResponses[400],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/auth/resend-verification",
  tags: ["Auth"],
  summary: "Reenviar email de verificación",
  request: { body: jsonBody(z.object({ email: z.string().email() })) },
  responses: {
    200: { description: "Email reenviado si la cuenta existe" },
    429: errorResponses[429],
  },
});

// ─── Paths: Users ──────────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/users/me",
  tags: ["Users"],
  summary: "Obtener perfil propio",
  security: secured,
  responses: {
    200: { description: "Perfil del usuario autenticado", ...jsonBody(UserPublic) },
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/users/me",
  tags: ["Users"],
  summary: "Actualizar perfil",
  security: secured,
  request: {
    body: jsonBody(
      z.object({
        displayName: z.string().min(1).max(60).optional(),
        avatarUrl: z.string().url().optional(),
      })
    ),
  },
  responses: {
    200: { description: "Perfil actualizado", ...jsonBody(UserPublic) },
    400: errorResponses[400],
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/users/me/password",
  tags: ["Users"],
  summary: "Cambiar contraseña",
  description:
    "Recibe contraseña actual, nueva contraseña, y opcionalmente reEncryptedEntries[] " +
    "para re-cifrar entradas del vault personal con la nueva clave derivada.",
  security: secured,
  request: {
    body: jsonBody(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
        reEncryptedEntries: z
          .array(
            z.object({
              id: z.string(),
              usernameEncrypted: z.string().optional(),
              passwordEncrypted: z.string(),
              notesEncrypted: z.string().optional(),
              iv: z.string(),
            })
          )
          .optional(),
      })
    ),
  },
  responses: {
    200: { description: "Contraseña cambiada", ...jsonBody(z.object({ ok: z.boolean() })) },
    400: errorResponses[400],
    401: errorResponses[401],
  },
});

// ─── Paths: Groups ─────────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/groups",
  tags: ["Groups"],
  summary: "Listar grupos del usuario",
  security: secured,
  responses: {
    200: { description: "Lista de grupos", ...jsonBody(z.array(Group)) },
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/groups",
  tags: ["Groups"],
  summary: "Crear grupo",
  security: secured,
  request: { body: jsonBody(createGroupSchema) },
  responses: {
    201: { description: "Grupo creado (el creador queda como OWNER)", ...jsonBody(Group) },
    400: errorResponses[400],
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/groups/{groupId}",
  tags: ["Groups"],
  summary: "Detalle del grupo",
  security: secured,
  request: { params: z.object({ groupId: z.string() }) },
  responses: {
    200: { description: "Grupo con miembros", ...jsonBody(Group) },
    401: errorResponses[401],
    403: errorResponses[403],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/groups/{groupId}",
  tags: ["Groups"],
  summary: "Actualizar grupo (OWNER/ADMIN)",
  security: secured,
  request: { params: z.object({ groupId: z.string() }), body: jsonBody(updateGroupSchema) },
  responses: {
    200: { description: "Grupo actualizado", ...jsonBody(Group) },
    400: errorResponses[400],
    403: errorResponses[403],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/groups/{groupId}",
  tags: ["Groups"],
  summary: "Eliminar grupo (OWNER)",
  security: secured,
  request: { params: z.object({ groupId: z.string() }) },
  responses: {
    200: { description: "Grupo eliminado" },
    403: errorResponses[403],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/groups/join",
  tags: ["Groups"],
  summary: "Unirse a grupo con código de invitación",
  security: secured,
  request: { body: jsonBody(joinGroupSchema) },
  responses: {
    200: { description: "Unido al grupo", ...jsonBody(Group) },
    400: errorResponses[400],
    404: errorResponses[404],
    409: { description: "Ya eres miembro", ...jsonBody(ErrorResponse) },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/groups/{groupId}/members",
  tags: ["Groups"],
  summary: "Listar miembros del grupo",
  security: secured,
  request: { params: z.object({ groupId: z.string() }) },
  responses: {
    200: {
      description: "Miembros",
      ...jsonBody(
        z.array(
          z.object({
            id: z.string(),
            role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
            joinedAt: z.string().datetime(),
            user: UserPublic,
          })
        )
      ),
    },
    403: errorResponses[403],
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/groups/{groupId}/members",
  tags: ["Groups"],
  summary: "Cambiar rol de un miembro (OWNER/ADMIN)",
  security: secured,
  request: {
    params: z.object({ groupId: z.string() }),
    body: jsonBody(
      updateMemberRoleSchema.extend({ userId: z.string() })
    ),
  },
  responses: {
    200: { description: "Rol actualizado" },
    400: errorResponses[400],
    403: errorResponses[403],
  },
});

// ─── Paths: Vault ──────────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/vault",
  tags: ["Vault"],
  summary: "Listar entradas del vault",
  description: "Filtra por scope (PERSONAL|GROUP) y opcionalmente groupId.",
  security: secured,
  request: {
    query: z.object({
      scope: z.enum(["PERSONAL", "GROUP"]).optional(),
      groupId: z.string().optional(),
    }),
  },
  responses: {
    200: { description: "Entradas cifradas", ...jsonBody(z.array(VaultEntry)) },
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/vault",
  tags: ["Vault"],
  summary: "Crear entrada en el vault",
  description: "Recibe valores ya cifrados en cliente (AES-GCM con clave derivada de la contraseña).",
  security: secured,
  request: { body: jsonBody(createVaultEntrySchema) },
  responses: {
    201: { description: "Entrada creada", ...jsonBody(VaultEntry) },
    400: errorResponses[400],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/vault/{entryId}",
  tags: ["Vault"],
  summary: "Obtener entrada del vault",
  security: secured,
  request: { params: z.object({ entryId: z.string() }) },
  responses: {
    200: { description: "Entrada", ...jsonBody(VaultEntry) },
    403: errorResponses[403],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/vault/{entryId}",
  tags: ["Vault"],
  summary: "Actualizar entrada del vault",
  security: secured,
  request: {
    params: z.object({ entryId: z.string() }),
    body: jsonBody(updateVaultEntrySchema),
  },
  responses: {
    200: { description: "Entrada actualizada", ...jsonBody(VaultEntry) },
    400: errorResponses[400],
    403: errorResponses[403],
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/vault/{entryId}",
  tags: ["Vault"],
  summary: "Eliminar entrada del vault",
  security: secured,
  request: { params: z.object({ entryId: z.string() }) },
  responses: {
    200: { description: "Entrada eliminada" },
    403: errorResponses[403],
    404: errorResponses[404],
  },
});

// ─── Paths: Flow (tickets) ─────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/flow/tickets",
  tags: ["Flow"],
  summary: "Listar tickets",
  description: "Por defecto devuelve tickets creados/asignados al usuario. Con scope=GROUP+groupId trae los del grupo.",
  security: secured,
  request: {
    query: z.object({
      status: z.enum(["OPEN", "IN_PROGRESS", "IN_REVIEW", "RESOLVED"]).optional(),
      priority: z.enum(["CRITICAL", "URGENT", "NORMAL", "LOW"]).optional(),
      scope: z.enum(["INDIVIDUAL", "GROUP"]).optional(),
      groupId: z.string().optional(),
      assignedToId: z.string().optional(),
      limit: z.string().optional(),
      offset: z.string().optional(),
    }),
  },
  responses: {
    200: { description: "Tickets", ...jsonBody(z.array(Ticket)) },
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/flow/tickets",
  tags: ["Flow"],
  summary: "Crear ticket",
  security: secured,
  request: { body: jsonBody(createTicketSchema) },
  responses: {
    201: { description: "Ticket creado", ...jsonBody(Ticket) },
    400: errorResponses[400],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/flow/tickets/{ticketId}",
  tags: ["Flow"],
  summary: "Obtener ticket",
  security: secured,
  request: { params: z.object({ ticketId: z.string() }) },
  responses: {
    200: { description: "Ticket", ...jsonBody(Ticket) },
    403: errorResponses[403],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/flow/tickets/{ticketId}",
  tags: ["Flow"],
  summary: "Actualizar ticket",
  security: secured,
  request: {
    params: z.object({ ticketId: z.string() }),
    body: jsonBody(updateTicketSchema),
  },
  responses: {
    200: { description: "Ticket actualizado", ...jsonBody(Ticket) },
    400: errorResponses[400],
    403: errorResponses[403],
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/flow/tickets/{ticketId}",
  tags: ["Flow"],
  summary: "Eliminar ticket",
  security: secured,
  request: { params: z.object({ ticketId: z.string() }) },
  responses: {
    200: { description: "Eliminado" },
    403: errorResponses[403],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/flow/tickets/{ticketId}/history",
  tags: ["Flow"],
  summary: "Historial de cambios del ticket",
  security: secured,
  request: { params: z.object({ ticketId: z.string() }) },
  responses: {
    200: {
      description: "Entradas de historial",
      ...jsonBody(
        z.array(
          z.object({
            id: z.string(),
            action: z.string(),
            oldValue: z.string().nullable().optional(),
            newValue: z.string().nullable().optional(),
            createdAt: z.string().datetime(),
            user: UserPublic.partial(),
          })
        )
      ),
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/flow/tickets/{ticketId}/comments",
  tags: ["Flow"],
  summary: "Listar comentarios del ticket",
  security: secured,
  request: { params: z.object({ ticketId: z.string() }) },
  responses: {
    200: { description: "Comentarios", ...jsonBody(z.array(TicketComment)) },
    403: errorResponses[403],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/flow/tickets/{ticketId}/comments",
  tags: ["Flow"],
  summary: "Comentar ticket (soporta @menciones)",
  description: "Parsea @username y envía notificación por email a los mencionados.",
  security: secured,
  request: {
    params: z.object({ ticketId: z.string() }),
    body: jsonBody(createCommentSchema),
  },
  responses: {
    201: { description: "Comentario creado", ...jsonBody(TicketComment) },
    400: errorResponses[400],
    403: errorResponses[403],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/flow/labels",
  tags: ["Flow"],
  summary: "Listar labels",
  security: secured,
  responses: {
    200: { description: "Labels", ...jsonBody(z.array(Label)) },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/flow/labels",
  tags: ["Flow"],
  summary: "Crear label",
  security: secured,
  request: { body: jsonBody(createLabelSchema) },
  responses: {
    201: { description: "Label creada", ...jsonBody(Label) },
    400: errorResponses[400],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/flow/stats",
  tags: ["Flow"],
  summary: "Estadísticas para dashboard",
  security: secured,
  responses: {
    200: {
      description: "Conteos agregados",
      ...jsonBody(
        z.object({
          total: z.number().int(),
          byStatus: z.record(z.number()),
          byPriority: z.record(z.number()),
          overdue: z.number().int(),
          assignedToMe: z.number().int(),
          createdByMe: z.number().int(),
        })
      ),
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/flow/templates",
  tags: ["Flow"],
  summary: "Listar plantillas de ticket",
  security: secured,
  responses: { 200: { description: "Plantillas", ...jsonBody(z.array(TicketTemplate)) } },
});

registry.registerPath({
  method: "post",
  path: "/api/flow/templates",
  tags: ["Flow"],
  summary: "Crear plantilla de ticket",
  security: secured,
  request: { body: jsonBody(createTemplateSchema) },
  responses: { 201: { description: "Plantilla creada", ...jsonBody(TicketTemplate) } },
});

registry.registerPath({
  method: "delete",
  path: "/api/flow/templates/{id}",
  tags: ["Flow"],
  summary: "Eliminar plantilla",
  security: secured,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Eliminada" } },
});

registry.registerPath({
  method: "get",
  path: "/api/flow/recurring",
  tags: ["Flow"],
  summary: "Listar tickets recurrentes",
  security: secured,
  responses: { 200: { description: "Reglas recurrentes", ...jsonBody(z.array(RecurringTicket)) } },
});

registry.registerPath({
  method: "post",
  path: "/api/flow/recurring",
  tags: ["Flow"],
  summary: "Crear regla recurrente (cron)",
  security: secured,
  request: { body: jsonBody(createRecurringTicketSchema) },
  responses: { 201: { description: "Regla creada", ...jsonBody(RecurringTicket) } },
});

registry.registerPath({
  method: "patch",
  path: "/api/flow/recurring/{id}",
  tags: ["Flow"],
  summary: "Actualizar regla recurrente",
  security: secured,
  request: {
    params: z.object({ id: z.string() }),
    body: jsonBody(createRecurringTicketSchema.partial()),
  },
  responses: { 200: { description: "Actualizada", ...jsonBody(RecurringTicket) } },
});

registry.registerPath({
  method: "delete",
  path: "/api/flow/recurring/{id}",
  tags: ["Flow"],
  summary: "Eliminar regla recurrente",
  security: secured,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Eliminada" } },
});

// ─── Paths: Context ────────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/context/notes",
  tags: ["Context"],
  summary: "Listar notas",
  security: secured,
  request: { query: z.object({ groupId: z.string().optional() }) },
  responses: { 200: { description: "Notas", ...jsonBody(z.array(Note)) } },
});

registry.registerPath({
  method: "post",
  path: "/api/context/notes",
  tags: ["Context"],
  summary: "Crear nota",
  security: secured,
  request: { body: jsonBody(createNoteSchema) },
  responses: { 201: { description: "Nota creada", ...jsonBody(Note) } },
});

registry.registerPath({
  method: "get",
  path: "/api/context/notes/{noteId}",
  tags: ["Context"],
  summary: "Obtener nota",
  security: secured,
  request: { params: z.object({ noteId: z.string() }) },
  responses: { 200: { description: "Nota", ...jsonBody(Note) }, 404: errorResponses[404] },
});

registry.registerPath({
  method: "patch",
  path: "/api/context/notes/{noteId}",
  tags: ["Context"],
  summary: "Actualizar nota",
  security: secured,
  request: {
    params: z.object({ noteId: z.string() }),
    body: jsonBody(updateNoteSchema),
  },
  responses: { 200: { description: "Nota actualizada", ...jsonBody(Note) } },
});

registry.registerPath({
  method: "delete",
  path: "/api/context/notes/{noteId}",
  tags: ["Context"],
  summary: "Eliminar nota",
  security: secured,
  request: { params: z.object({ noteId: z.string() }) },
  responses: { 200: { description: "Eliminada" } },
});

registry.registerPath({
  method: "get",
  path: "/api/context/reminders",
  tags: ["Context"],
  summary: "Listar recordatorios",
  security: secured,
  responses: { 200: { description: "Recordatorios", ...jsonBody(z.array(Reminder)) } },
});

registry.registerPath({
  method: "post",
  path: "/api/context/reminders",
  tags: ["Context"],
  summary: "Crear recordatorio",
  security: secured,
  request: { body: jsonBody(createReminderSchema) },
  responses: { 201: { description: "Creado", ...jsonBody(Reminder) } },
});

registry.registerPath({
  method: "patch",
  path: "/api/context/reminders/{reminderId}",
  tags: ["Context"],
  summary: "Actualizar recordatorio",
  security: secured,
  request: {
    params: z.object({ reminderId: z.string() }),
    body: jsonBody(updateReminderSchema),
  },
  responses: { 200: { description: "Actualizado", ...jsonBody(Reminder) } },
});

registry.registerPath({
  method: "delete",
  path: "/api/context/reminders/{reminderId}",
  tags: ["Context"],
  summary: "Eliminar recordatorio",
  security: secured,
  request: { params: z.object({ reminderId: z.string() }) },
  responses: { 200: { description: "Eliminado" } },
});

// ─── Paths: Attachments ────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/attachments",
  tags: ["Attachments"],
  summary: "Listar adjuntos de un ticket o nota",
  security: secured,
  request: {
    query: z.object({
      ticketId: z.string().optional(),
      noteId: z.string().optional(),
    }),
  },
  responses: { 200: { description: "Adjuntos", ...jsonBody(z.array(Attachment)) } },
});

registry.registerPath({
  method: "post",
  path: "/api/attachments",
  tags: ["Attachments"],
  summary: "Subir adjunto (multipart/form-data)",
  description: "Campo `file` requerido, más `ticketId` o `noteId`. Guarda en UPLOAD_DIR.",
  security: secured,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.string().openapi({ type: "string", format: "binary" }),
            ticketId: z.string().optional(),
            noteId: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: "Adjunto creado", ...jsonBody(Attachment) },
    400: errorResponses[400],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/attachments/{id}",
  tags: ["Attachments"],
  summary: "Descargar adjunto",
  security: secured,
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: {
      description: "Contenido binario",
      content: { "application/octet-stream": { schema: z.string().openapi({ format: "binary" }) } },
    },
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/attachments/{id}",
  tags: ["Attachments"],
  summary: "Eliminar adjunto",
  security: secured,
  request: { params: z.object({ id: z.string() }) },
  responses: { 200: { description: "Eliminado" }, 403: errorResponses[403] },
});

// ─── Paths: Search ─────────────────────────────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/api/search",
  tags: ["Search"],
  summary: "Búsqueda global (tickets, notas, vault)",
  security: secured,
  request: { query: z.object({ q: z.string().min(1) }) },
  responses: {
    200: {
      description: "Resultados agrupados",
      ...jsonBody(
        z.object({
          tickets: z.array(Ticket),
          notes: z.array(Note),
          vaultEntries: z.array(VaultEntry),
        })
      ),
    },
    400: errorResponses[400],
  },
});

// ─── Generator ─────────────────────────────────────────────────────────────
export function getOpenApiSpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "CoreDesk API",
      version: "1.0.0",
      description:
        "API de CoreDesk: autenticación, grupos, vault cifrado, flow (tickets), context (notas/recordatorios), adjuntos y búsqueda global.",
      contact: { name: "CoreDesk" },
    },
    servers: [
      { url: "http://localhost:3001", description: "Local" },
      { url: "/", description: "Mismo host" },
    ],
    tags: [
      { name: "Auth", description: "Registro, login, refresh, verificación de email" },
      { name: "Users", description: "Perfil y contraseña" },
      { name: "Groups", description: "Grupos, miembros e invitaciones" },
      { name: "Vault", description: "Vault de contraseñas cifrado E2E" },
      { name: "Flow", description: "Tickets, comentarios, labels, plantillas, recurrentes" },
      { name: "Context", description: "Notas y recordatorios" },
      { name: "Attachments", description: "Subida y descarga de archivos" },
      { name: "Search", description: "Búsqueda global" },
    ],
  });
}
