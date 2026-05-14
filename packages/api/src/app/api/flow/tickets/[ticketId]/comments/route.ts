import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validation";
import { sendMentionEmail } from "@/lib/emailService";
import { createNotification, createNotificationsForUsers } from "@/lib/notificationService";
import { fireAndForgetWebhook } from "@/lib/webhookDispatcher";

type Params = { ticketId: string };

const canAccessTicket = (userId: string, ticketId: string) =>
  prisma.ticket.findFirst({
    where: {
      id: ticketId,
      OR: [
        { createdById: userId },
        { assignedToId: userId },
        { scope: "GROUP", group: { members: { some: { userId } } } },
      ],
    },
  });

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { ticketId } = await params;

  const ticket = await canAccessTicket(user.sub, ticketId);
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comments = await prisma.ticketComment.findMany({
    where: { ticketId },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
});

export const POST = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { ticketId } = await params;

  const ticket = await canAccessTicket(user.sub, ticketId);
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId,
      userId: user.sub,
      content: parsed.data.content,
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  // Mark first response for SLA tracking — only if commenter is not the creator
  if (!ticket.firstResponseAt && ticket.createdById !== user.sub) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { firstResponseAt: new Date() },
    });
  }

  // Notify the creator (and assignee if different) when someone else comments
  const recipients = new Set<string>();
  if (ticket.createdById !== user.sub) recipients.add(ticket.createdById);
  if (ticket.assignedToId && ticket.assignedToId !== user.sub) recipients.add(ticket.assignedToId);
  if (recipients.size > 0) {
    createNotificationsForUsers([...recipients], {
      type: "TICKET_COMMENTED",
      title: `Nuevo comentario en "${ticket.title}"`,
      body: parsed.data.content.slice(0, 200),
      ticketId,
      link: `/flow/tickets/${ticketId}`,
    });
  }

  fireAndForgetWebhook({
    event: "ticket.commented",
    groupId: ticket.groupId,
    userId: user.sub,
    payload: { ticketId, comment: { id: comment.id, content: comment.content, createdAt: comment.createdAt } },
  });

  // Process @mentions — fire-and-forget
  const mentionedUsernames = [...parsed.data.content.matchAll(/@([\w-]+)/g)].map((m) => m[1]);
  if (mentionedUsernames.length > 0) {
    const authorName = comment.user.displayName ?? comment.user.username;
    const preview = parsed.data.content.slice(0, 200);

    prisma.user
      .findMany({
        where: {
          username: { in: mentionedUsernames },
          id: { not: user.sub },
        },
        select: { id: true, email: true },
      })
      .then((mentioned) => {
        for (const { id, email } of mentioned) {
          createNotification({
            userId: id,
            type: "TICKET_MENTIONED",
            title: `${authorName} te mencionó`,
            body: preview,
            ticketId,
            link: `/flow/tickets/${ticketId}`,
          });
          sendMentionEmail(email, authorName, ticket.title, ticketId, preview).catch((err) =>
            console.error("[mentions] email failed:", err)
          );
        }
      })
      .catch((err) => console.error("[mentions] lookup failed:", err));
  }

  return NextResponse.json(comment, { status: 201 });
});
