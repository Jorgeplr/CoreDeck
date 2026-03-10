import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendReminderEmail(
  to: string,
  reminderTitle: string,
  dueAt: Date
): Promise<void> {
  const formattedDate = dueAt.toLocaleString("es-ES", {
    dateStyle: "full",
    timeStyle: "short",
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "CoreDesk <noreply@coredesk.app>",
    to,
    subject: `[CoreDesk] Recordatorio: ${reminderTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#111827;margin-bottom:8px;">⏰ Recordatorio próximo</h2>
        <p style="color:#374151;font-size:16px;"><strong>${reminderTitle}</strong></p>
        <p style="color:#6b7280;">Vence el: <strong>${formattedDate}</strong></p>
        <a href="${process.env.CORS_ORIGIN}/context/reminders" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;">Ver recordatorio</a>
      </div>
    `,
  });
}

export async function sendTicketDueEmail(
  to: string,
  ticketTitle: string,
  dueDate: Date,
  ticketId: string
): Promise<void> {
  const formattedDate = dueDate.toLocaleString("es-ES", {
    dateStyle: "full",
    timeStyle: "short",
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "CoreDesk <noreply@coredesk.app>",
    to,
    subject: `[CoreDesk] Ticket próximo a vencer: ${ticketTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#111827;margin-bottom:8px;">🎫 Ticket por vencer</h2>
        <p style="color:#374151;font-size:16px;"><strong>${ticketTitle}</strong></p>
        <p style="color:#6b7280;">Vence el: <strong>${formattedDate}</strong></p>
        <a href="${process.env.CORS_ORIGIN}/flow/tickets/${ticketId}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#8b5cf6;color:#fff;border-radius:8px;text-decoration:none;">Ver ticket</a>
      </div>
    `,
  });
}
