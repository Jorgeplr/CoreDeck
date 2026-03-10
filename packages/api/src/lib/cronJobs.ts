import cron from "node-cron";
import { prisma } from "./prisma";
import { sendReminderEmail, sendTicketDueEmail } from "./emailService";

let initialized = false;

export function initCronJobs(): void {
  if (initialized) return;
  initialized = true;

  const schedule = process.env.REMINDER_CHECK_CRON ?? "*/15 * * * *";
  const hoursBeforeNotify = Number(process.env.REMINDER_NOTIFY_HOURS_BEFORE ?? 24);

  cron.schedule(schedule, async () => {
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
