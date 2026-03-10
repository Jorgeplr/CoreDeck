import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validation";

type Params = { ticketId: string };

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { ticketId } = await params;

  // Verify user has access to this ticket
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      OR: [{ createdById: user.sub }, { assignedToId: user.sub }, { scope: "GROUP" }],
    },
  });
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

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
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

  return NextResponse.json(comment, { status: 201 });
});
