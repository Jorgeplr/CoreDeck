import cron from "node-cron";
import { parseExpression } from "cron-parser";
import type { TicketPriority } from "@prisma/client";
import { prisma } from "./prisma";
import { sendReminderEmail, sendTicketDueEmail } from "./emailService";
import { createNotification, createNotificationsForUsers } from "./notificationService";
import { fireAndForgetWebhook } from "./webhookDispatcher";

const INSTANCE_ID = process.env.INSTANCE_ID ?? process.env.HOSTNAME ?? "local";
const LOCK_TTL_MS_RAW = Number(process.env.CRON_LOCK_TTL_MS ?? "");
const LOCK_TTL_MS = Number.isFinite(LOCK_TTL_MS_RAW) && LOCK_TTL_MS_RAW > 0
  ? LOCK_TTL_MS_RAW
  : 5 * 60 * 1000;

async function tryAcquireCronLock(name: string, ttlMs: number): Promise<boolean> {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + ttlMs);

  try {
    const updated = await prisma.cronLock.updateMany({
      where: { name, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] },
      data: { lockedUntil, lockedBy: INSTANCE_ID },
    });

    if (updated.count > 0) return true;

    await prisma.cronLock.create({
      data: { name, lockedUntil, lockedBy: INSTANCE_ID },
    });

    return true;
  } catch {
    return false;
  }
}

function getNextRunAt(cronExpr: string, fromDate: Date): Date {
  const interval = parseExpression(cronExpr, { currentDate: fromDate });
  return interval.next().toDate();
}

async function processRecurringTickets(now: Date): Promise<void> {
  const actives = await prisma.recurringTicket.findMany({
    where: {
      isActive: true,
      OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
    },
  });

  for (const rt of actives) {
    try {
      if (!rt.nextRunAt) {
        const nextRunAt = getNextRunAt(rt.cronExpr, now);
        await prisma.recurringTicket.update({
          where: { id: rt.id },
          data: { nextRunAt },
        });
        continue;
      }

      if (rt.nextRunAt > now) continue;

      await prisma.ticket.create({
        data: {
          title: rt.title,
          description: rt.description ?? undefined,
          priority: rt.priority,
          scope: rt.scope,
          groupId: rt.groupId ?? undefined,
          assignedToId: rt.assignedToId ?? undefined,
          createdById: rt.createdById,
        },
      });

      const nextRunAt = getNextRunAt(rt.cronExpr, now);
      await prisma.recurringTicket.update({
        where: { id: rt.id },
        data: { lastRun: now, nextRunAt },
      });
    } catch (err) {
      console.error(`[recurring] Failed to process ${rt.id}:`, err);
    }
  }
}

async function resolveSlaPolicy(
  groupId: string | null,
  priority: TicketPriority
) {
  if (groupId) {
    const groupPolicy = await prisma.slaPolicy.findFirst({
      where: { groupId, priority },
    });
    if (groupPolicy) return groupPolicy;
  }
  return prisma.slaPolicy.findFirst({
    where: { groupId: null, priority },
  });
}

async function processSlaBreaches(now: Date): Promise<void> {
  // Pick open tickets we haven't already marked as breached on both sides
  const tickets = await prisma.ticket.findMany({
    where: {
      status: { not: "RESOLVED" },
      OR: [
        { slaFirstResponseBreachedAt: null, firstResponseAt: null },
        { slaResolutionBreachedAt: null },
      ],
    },
    select: {
      id: true,
      title: true,
      priority: true,
      groupId: true,
      createdAt: true,
      createdById: true,
      assignedToId: true,
      firstResponseAt: true,
      slaFirstResponseBreachedAt: true,
      slaResolutionBreachedAt: true,
    },
    take: 500,
  });

  for (const t of tickets) {
    try {
      const policy = await resolveSlaPolicy(t.groupId, t.priority);
      if (!policy) continue;

      const ageMs = now.getTime() - t.createdAt.getTime();
      const firstResponseBreached =
        !t.firstResponseAt &&
        !t.slaFirstResponseBreachedAt &&
        ageMs > policy.firstResponseMinutes * 60_000;
      const resolutionBreached =
        !t.slaResolutionBreachedAt && ageMs > policy.resolutionMinutes * 60_000;

      if (!firstResponseBreached && !resolutionBreached) continue;

      await prisma.ticket.update({
        where: { id: t.id },
        data: {
          slaFirstResponseBreachedAt: firstResponseBreached ? now : undefined,
          slaResolutionBreachedAt: resolutionBreached ? now : undefined,
        },
      });

      const recipients = new Set<string>();
      recipients.add(t.createdById);
      if (t.assignedToId) recipients.add(t.assignedToId);

      const kind = resolutionBreached ? "resolución" : "primera respuesta";
      createNotificationsForUsers([...recipients], {
        type: "SLA_BREACHED",
        title: `SLA incumplido (${kind})`,
        body: t.title,
        ticketId: t.id,
        link: `/flow/tickets/${t.id}`,
      });

      fireAndForgetWebhook({
        event: "ticket.sla_breached",
        groupId: t.groupId,
        payload: {
          ticketId: t.id,
          title: t.title,
          breach: resolutionBreached ? "resolution" : "first_response",
        },
      });
    } catch (err) {
      console.error(`[sla] failed for ticket ${t.id}:`, err);
    }
  }
}

let initialized = false;

export function initCronJobs(): void {
  if (initialized) return;
  initialized = true;

  const schedule = process.env.REMINDER_CHECK_CRON ?? "*/15 * * * *";
  const hoursBeforeNotify = Number(process.env.REMINDER_NOTIFY_HOURS_BEFORE ?? 24);

  cron.schedule(schedule, async () => {
    const now = new Date();

    const lockAcquired = await tryAcquireCronLock("coredesk-cron", LOCK_TTL_MS);
    if (!lockAcquired) return;

    await processRecurringTickets(now).catch((err) =>
      console.error("[recurring cron] error:", err)
    );

    await processSlaBreaches(now).catch((err) =>
      console.error("[sla cron] error:", err)
    );

    const notifyBefore = new Date();
    notifyBefore.setHours(notifyBefore.getHours() + hoursBeforeNotify);

    // Process reminders
    try {
      const reminders = await prisma.reminder.findMany({
        where: {
          dueAt: { lte: notifyBefore },
          status: "PENDING",
          notifiedAt: null,
        },
        include: { user: { select: { id: true, email: true } } },
      });

      for (const reminder of reminders) {
        try {
          await sendReminderEmail(reminder.user.email, reminder.title, reminder.dueAt);
          createNotification({
            userId: reminder.user.id,
            type: "REMINDER_DUE",
            title: `Recordatorio: ${reminder.title}`,
            body: reminder.description ?? undefined,
            link: `/context/reminders`,
          });
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { notifiedAt: new Date(), status: "NOTIFIED" },
          });
        } catch (err) {
          console.error(`Failed to notify reminder ${reminder.id}:`, err);
        }
      }
    } catch (err) {
      console.error("Reminder cron error:", err);
    }

    // Process tickets with due dates
    try {
      const tickets = await prisma.ticket.findMany({
        where: {
          dueDate: { lte: notifyBefore, not: null },
          status: { not: "RESOLVED" },
          dueNotifiedAt: null,
        },
        include: {
          createdBy: { select: { id: true, email: true } },
          assignedTo: { select: { id: true, email: true } },
        },
      });

      for (const ticket of tickets) {
        if (!ticket.dueDate) continue;
        const recipients = new Map<string, string>();
        recipients.set(ticket.createdBy.id, ticket.createdBy.email);
        if (ticket.assignedTo) recipients.set(ticket.assignedTo.id, ticket.assignedTo.email);

        for (const [userId, email] of recipients) {
          try {
            await sendTicketDueEmail(email, ticket.title, ticket.dueDate, ticket.id);
            createNotification({
              userId,
              type: "TICKET_DUE_SOON",
              title: `Ticket por vencer: ${ticket.title}`,
              body: `Vence ${ticket.dueDate.toISOString()}`,
              ticketId: ticket.id,
              link: `/flow/tickets/${ticket.id}`,
            });
          } catch (err) {
            console.error(`Failed to notify ticket ${ticket.id} to ${email}:`, err);
          }
        }

        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { dueNotifiedAt: new Date() },
        });
      }
    } catch (err) {
      console.error("Ticket due cron error:", err);
    }
  });

  console.log(`[CoreDesk] Cron jobs initialized (schedule: ${schedule})`);
}
