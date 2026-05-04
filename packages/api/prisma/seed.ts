import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CoreDesk...\n");

  // ─── Labels ────────────────────────────────────────────────────────────────
  const labelDefs = [
    { name: "Bug",           color: "#ef4444" },
    { name: "Feature",       color: "#3b82f6" },
    { name: "Improvement",   color: "#8b5cf6" },
    { name: "Documentation", color: "#6b7280" },
    { name: "Critical",      color: "#dc2626" },
    { name: "Design",        color: "#ec4899" },
    { name: "Backend",       color: "#f59e0b" },
    { name: "Frontend",      color: "#06b6d4" },
  ];

  const labels: Record<string, { id: string }> = {};
  for (const l of labelDefs) {
    const label = await prisma.label.upsert({
      where: { name: l.name },
      update: {},
      create: l,
    });
    labels[l.name] = label;
  }
  console.log(`  ✓ ${labelDefs.length} etiquetas`);

  // ─── Users ─────────────────────────────────────────────────────────────────
  const userDefs = [
    {
      email: "admin@coredesk.app",
      username: "admin",
      password: "CoreDesk@2024!",
      displayName: "Admin",
    },
    {
      email: "jorge@coredesk.app",
      username: "jorge",
      password: "Test@1234!",
      displayName: "Jorge",
    },
    {
      email: "ana@coredesk.app",
      username: "ana",
      password: "Test@1234!",
      displayName: "Ana García",
    },
    {
      email: "dev@coredesk.app",
      username: "devuser",
      password: "Test@1234!",
      displayName: "Dev User",
    },
  ];

  const users: Record<string, { id: string; email: string; username: string }> = {};
  for (const u of userDefs) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
      create: {
        email: u.email,
        username: u.username,
        passwordHash,
        displayName: u.displayName,
        emailVerified: true,
      },
    });
    users[u.username] = user;
  }
  console.log(`  ✓ ${userDefs.length} usuarios (todos verificados)`);
  console.log(`      admin@coredesk.app  / CoreDesk@2024!`);
  console.log(`      jorge@coredesk.app  / Test@1234!`);
  console.log(`      ana@coredesk.app    / Test@1234!`);
  console.log(`      dev@coredesk.app    / Test@1234!\n`);

  // ─── Group ─────────────────────────────────────────────────────────────────
  const group = await prisma.group.upsert({
    where: { slug: "coredesk-dev" },
    update: {},
    create: {
      name: "CoreDesk Dev",
      description: "Equipo de desarrollo del proyecto CoreDesk",
      slug: "coredesk-dev",
      inviteCode: "DEVTEAM",
      members: {
        create: [
          { userId: users.admin.id,   role: "OWNER"  },
          { userId: users.jorge.id,   role: "ADMIN"  },
          { userId: users.ana.id,     role: "MEMBER" },
          { userId: users.devuser.id, role: "VIEWER" },
        ],
      },
    },
  });
  console.log(`  ✓ Grupo "CoreDesk Dev" (invite: DEVTEAM)`);

  // ─── Ticket templates ──────────────────────────────────────────────────────
  const templateDefs = [
    {
      name: "Bug Report",
      description: "Reporte estándar de bug",
      title: "[BUG] ",
      body: "## Descripción\n\n## Pasos para reproducir\n1. \n2. \n\n## Comportamiento esperado\n\n## Comportamiento actual\n\n## Entorno\n- OS:\n- Navegador:",
      priority: "URGENT" as const,
      scope: "INDIVIDUAL" as const,
    },
    {
      name: "Feature Request",
      description: "Solicitud de nueva funcionalidad",
      title: "[FEATURE] ",
      body: "## Descripción de la funcionalidad\n\n## Motivación\n¿Por qué es útil?\n\n## Propuesta de implementación\n\n## Criterios de aceptación\n- [ ] \n- [ ]",
      priority: "NORMAL" as const,
      scope: "INDIVIDUAL" as const,
    },
    {
      name: "Tarea de grupo",
      description: "Tarea asignable a miembro del equipo",
      title: "[TASK] ",
      body: "## Objetivo\n\n## Entregable esperado\n\n## Notas adicionales",
      priority: "NORMAL" as const,
      scope: "GROUP" as const,
    },
  ];

  for (const tpl of templateDefs) {
    const existing = await prisma.ticketTemplate.findFirst({
      where: { name: tpl.name, createdById: users.admin.id },
    });
    if (!existing) {
      await prisma.ticketTemplate.create({
        data: {
          ...tpl,
          groupId: tpl.scope === "GROUP" ? group.id : undefined,
          createdById: users.admin.id,
        },
      });
    }
  }
  console.log(`  ✓ ${templateDefs.length} plantillas de tickets`);

  // ─── Personal tickets (admin) ──────────────────────────────────────────────
  const personalTickets = [
    {
      title: "Configurar variables de entorno en producción",
      description: "Revisar y actualizar todas las variables de entorno para el despliegue en producción.",
      status: "OPEN" as const,
      priority: "CRITICAL" as const,
      scope: "INDIVIDUAL" as const,
      labelNames: ["Backend"],
    },
    {
      title: "Añadir tests unitarios al módulo de auth",
      description: "Escribir tests con Vitest para los endpoints de login, register y refresh token.",
      status: "IN_PROGRESS" as const,
      priority: "URGENT" as const,
      scope: "INDIVIDUAL" as const,
      labelNames: ["Backend", "Documentation"],
    },
    {
      title: "Revisar documentación de la API",
      description: "Actualizar el README con los nuevos endpoints añadidos.",
      status: "RESOLVED" as const,
      priority: "LOW" as const,
      scope: "INDIVIDUAL" as const,
      labelNames: ["Documentation"],
    },
  ];

  for (const t of personalTickets) {
    const { labelNames, ...ticketData } = t;
    const existing = await prisma.ticket.findFirst({
      where: { title: t.title, createdById: users.admin.id },
    });
    if (!existing) {
      await prisma.ticket.create({
        data: {
          ...ticketData,
          createdById: users.admin.id,
          labels: {
            create: labelNames.map((name) => ({ labelId: labels[name].id })),
          },
        },
      });
    }
  }

  // ─── Group tickets ─────────────────────────────────────────────────────────
  const groupTickets = [
    {
      title: "[BUG] El Kanban no actualiza al arrastrar en móvil",
      description: "En dispositivos táctiles el drag & drop del Kanban no funciona correctamente.",
      status: "OPEN" as const,
      priority: "URGENT" as const,
      assignedToId: users.jorge.id,
      labelNames: ["Bug", "Frontend"],
    },
    {
      title: "[FEATURE] Añadir modo oscuro al onboarding",
      description: "Las páginas de login y registro no respetan el tema del sistema operativo.",
      status: "IN_PROGRESS" as const,
      priority: "NORMAL" as const,
      assignedToId: users.ana.id,
      labelNames: ["Feature", "Frontend", "Design"],
    },
    {
      title: "[TASK] Migrar base de datos a producción",
      description: "Ejecutar `prisma migrate deploy` en el servidor de producción y verificar integridad.",
      status: "OPEN" as const,
      priority: "CRITICAL" as const,
      assignedToId: users.admin.id,
      labelNames: ["Backend", "Critical"],
    },
    {
      title: "[IMPROVEMENT] Paginación en endpoints GET",
      description: "Implementar cursor-based pagination en /api/flow/tickets, /api/context/notes y /api/vault.",
      status: "IN_REVIEW" as const,
      priority: "NORMAL" as const,
      assignedToId: users.devuser.id,
      labelNames: ["Improvement", "Backend"],
    },
    {
      title: "[BUG] El vault no re-encripta al cambiar contraseña si hay entradas de grupo",
      description: "Las entradas GROUP del vault quedan con la clave antigua tras un cambio de contraseña.",
      status: "OPEN" as const,
      priority: "URGENT" as const,
      assignedToId: users.jorge.id,
      labelNames: ["Bug", "Critical"],
    },
  ];

  for (const t of groupTickets) {
    const { labelNames, assignedToId, ...ticketData } = t;
    const existing = await prisma.ticket.findFirst({
      where: { title: t.title, groupId: group.id },
    });
    if (!existing) {
      const ticket = await prisma.ticket.create({
        data: {
          ...ticketData,
          scope: "GROUP",
          groupId: group.id,
          createdById: users.admin.id,
          assignedToId,
          labels: {
            create: labelNames.map((name) => ({ labelId: labels[name].id })),
          },
        },
      });

      // Add a comment to the first group ticket
      if (t.title.includes("Kanban")) {
        await prisma.ticketComment.create({
          data: {
            ticketId: ticket.id,
            userId: users.jorge.id,
            content: "Reproduzco el bug en Chrome Android 120. Parece que el evento touchend no se dispara correctamente. @ana ¿puedes revisar el componente KanbanBoard?",
          },
        });
        await prisma.ticketComment.create({
          data: {
            ticketId: ticket.id,
            userId: users.ana.id,
            content: "Revisando ahora. Puede ser un problema con @dnd-kit en modo táctil. Probaré añadiendo el sensor de puntero.",
          },
        });
      }
    }
  }
  console.log(`  ✓ ${personalTickets.length} tickets personales + ${groupTickets.length} tickets de grupo`);

  // ─── Notes ─────────────────────────────────────────────────────────────────
  const noteAdminExists = await prisma.note.findFirst({
    where: { title: "Guía de inicio rápido", userId: users.admin.id },
  });
  if (!noteAdminExists) {
    await prisma.note.create({
      data: {
        title: "Guía de inicio rápido",
        content: `# CoreDesk — Inicio rápido\n\n## Módulos\n\n- **Vault** — Contraseñas cifradas E2EE con AES-256-GCM\n- **Flow** — Gestión de tickets estilo Kanban\n- **Context** — Notas Markdown y recordatorios\n\n## Cuentas de prueba\n\n| Email | Contraseña | Rol |\n|-------|-----------|-----|\n| admin@coredesk.app | CoreDesk@2024! | Owner |\n| jorge@coredesk.app | Test@1234! | Admin |\n| ana@coredesk.app | Test@1234! | Member |\n| dev@coredesk.app | Test@1234! | Viewer |\n\n## Grupo de prueba\n\nNombre: **CoreDesk Dev** — Código de invitación: \`DEVTEAM\`\n\n> Esta nota es solo de lectura para nuevos desarrolladores.`,
        userId: users.admin.id,
        isCollaborative: false,
      },
    });
  }

  const noteGroupExists = await prisma.note.findFirst({
    where: { title: "Arquitectura del proyecto", groupId: group.id },
  });
  if (!noteGroupExists) {
    await prisma.note.create({
      data: {
        title: "Arquitectura del proyecto",
        content: `# Arquitectura CoreDesk\n\n## Stack\n\n- **Frontend**: React 19 + Vite + TanStack Query + Zustand\n- **Backend**: Next.js 15 (API routes) + Prisma 6 + MySQL 8\n- **Auth**: JWT (memoria) + Refresh Token (httpOnly cookie)\n- **Crypto**: AES-256-GCM + PBKDF2 (310k iter)\n\n## Estructura de carpetas\n\n\`\`\`\npackages/\n  api/     → Next.js API + Prisma\n  app/     → React frontend\n\`\`\`\n\n## Decisiones de diseño\n\n1. El vault es **E2EE real**: el servidor nunca ve las contraseñas en texto plano\n2. El access token vive solo en **memoria** (no localStorage) para prevenir XSS\n3. El refresh token es **httpOnly + SameSite=Strict** para prevenir CSRF`,
        groupId: group.id,
        isCollaborative: true,
      },
    });
  }
  console.log(`  ✓ 2 notas (1 personal, 1 colaborativa de grupo)`);

  // ─── Reminders ─────────────────────────────────────────────────────────────
  const reminderExists = await prisma.reminder.findFirst({
    where: { userId: users.admin.id, title: "Revisar métricas del dashboard" },
  });
  if (!reminderExists) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    await prisma.reminder.create({
      data: {
        title: "Revisar métricas del dashboard",
        description: "Comprobar el estado de tickets abiertos y asignaciones pendientes.",
        dueAt: tomorrow,
        userId: users.admin.id,
      },
    });
  }
  console.log(`  ✓ 1 recordatorio de ejemplo\n`);

  console.log("✅ Seed completado.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
