import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validation";
import { sendMentionEmail } from "@/lib/emailService";

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

  // Process @mentions — fire-and-forget
  const mentionedUsernames = [...parsed.data.content.matchAll(/@([\w-]+)/g)].map((m) => m[1]);
  if (mentionedUsernames.length > 0) {
    const authorName = comment.user.displayName ?? comment.user.username;
    const preview = parsed.data.content.slice(0, 200);

    prisma.user
      .findMany({
        where: {
          username: { in: mentionedUsernames },
          id: { not: user.sub }, // Don't notify self
        },
        select: { email: true },
      })
      .then((mentioned) => {
        for (const { email } of mentioned) {
          sendMentionEmail(email, authorName, ticket.title, ticketId, preview).catch((err) =>
            console.error("[mentions] email failed:", err)
          );
        }
      })
      .catch((err) => console.error("[mentions] lookup failed:", err));
  }

  return NextResponse.json(comment, { status: 201 });
});
