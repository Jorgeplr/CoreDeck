import cron from "node-cron";
import { parseExpression } from "cron-parser";
import { prisma } from "./prisma";
import { sendReminderEmail, sendTicketDueEmail } from "./emailService";

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
        include: { user: { select: { email: true } } },
      });

      for (const reminder of reminders) {
        try {
          await sendReminderEmail(reminder.user.email, reminder.title, reminder.dueAt);
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
          createdBy: { select: { email: true } },
          assignedTo: { select: { email: true } },
        },
      });

      for (const ticket of tickets) {
        if (!ticket.dueDate) continue;
        const recipients = new Set<string>();
        recipients.add(ticket.createdBy.email);
        if (ticket.assignedTo) recipients.add(ticket.assignedTo.email);

        for (const email of recipients) {
          try {
            await sendTicketDueEmail(email, ticket.title, ticket.dueDate, ticket.id);
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
