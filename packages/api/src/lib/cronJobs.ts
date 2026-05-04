import cron from "node-cron";
import { prisma } from "./prisma";
import { sendReminderEmail, sendTicketDueEmail } from "./emailService";

function matchesCron(cronExpr: string, now: Date): boolean {
  try {
    return cron.validate(cronExpr) && cron.getTasks !== undefined
      ? false // use node-cron's internal schedule check indirectly
      : false;
  } catch {
    return false;
  }
}

async function processRecurringTickets(now: Date): Promise<void> {
  const actives = await prisma.recurringTicket.findMany({
    where: { isActive: true },
  });

  for (const rt of actives) {
    try {
      // Simple hourly check: compare last run. A proper implementation would
      // use a cron expression parser library. Here we fire if lastRun is null
      // or more than 23h ago AND the cronExpr minute/hour matches now.
      const parts = rt.cronExpr.trim().split(/\s+/);
      if (parts.length !== 5) continue;
      const [minute, hour, , ,] = parts;

      const matchMinute = minute === "*" || Number(minute) === now.getMinutes();
      const matchHour = hour === "*" || Number(hour) === now.getHours();
      const notRunToday =
        !rt.lastRun ||
        now.getTime() - rt.lastRun.getTime() > 23 * 60 * 60 * 1000;

      if (matchMinute && matchHour && notRunToday) {
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
        await prisma.recurringTicket.update({
          where: { id: rt.id },
          data: { lastRun: now },
        });
      }
    } catch (err) {
      console.error(`[recurring] Failed to create ticket for ${rt.id}:`, err);
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
      }
    } catch (err) {
      console.error("Ticket due cron error:", err);
    }
  });

  console.log(`[CoreDesk] Cron jobs initialized (schedule: ${schedule})`);
}
