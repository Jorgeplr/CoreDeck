import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

type Params = { ticketId: string };

export const GET = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { ticketId } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check access
  const hasAccess =
    ticket.createdById === user.sub ||
    ticket.assignedToId === user.sub ||
    (ticket.scope === "GROUP" && ticket.groupId
      ? await prisma.groupMember
          .findUnique({ where: { userId_groupId: { userId: user.sub, groupId: ticket.groupId } } })
          .then(Boolean)
      : false);

  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const history = await prisma.ticketHistory.findMany({
    where: { ticketId },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(history);
});
