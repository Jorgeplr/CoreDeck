import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { updateTicketSchema } from "@/lib/validation";

type Params = { ticketId: string };

async function getTicketWithAccess(ticketId: string, userId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return null;

  if (ticket.createdById === userId || ticket.assignedToId === userId) return ticket;

  if (ticket.scope === "GROUP" && ticket.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: ticket.groupId } },
    });
    if (membership) return ticket;
  }

  return null;
}

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { ticketId } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      createdBy: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      assignedTo: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      labels: { include: { label: true } },
      history: {
        include: { user: { select: { id: true, username: true, displayName: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hasAccess = await getTicketWithAccess(ticketId, user.sub);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(ticket);
});

export const PATCH = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { ticketId } = await params;
  const existing = await getTicketWithAccess(ticketId, user.sub);
  if (!existing) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const body = await req.json();
  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { labelIds, ...ticketData } = parsed.data;

  // Track changes for history
  const historyEntries: { action: string; oldValue?: string; newValue?: string }[] = [];
  if (ticketData.status && ticketData.status !== existing.status) {
    historyEntries.push({ action: "STATUS_CHANGED", oldValue: existing.status, newValue: ticketData.status });
  }
  if (ticketData.priority && ticketData.priority !== existing.priority) {
    historyEntries.push({ action: "PRIORITY_CHANGED", oldValue: existing.priority, newValue: ticketData.priority });
  }
  if (ticketData.assignedToId !== undefined && ticketData.assignedToId !== existing.assignedToId) {
    historyEntries.push({ action: "ASSIGNED", oldValue: existing.assignedToId ?? undefined, newValue: ticketData.assignedToId ?? undefined });
  }

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...ticketData,
      dueDate: ticketData.dueDate ? new Date(ticketData.dueDate) : undefined,
      labels: labelIds
        ? {
            deleteMany: {},
            create: labelIds.map((labelId) => ({ labelId })),
          }
        : undefined,
    },
    include: {
      createdBy: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      assignedTo: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      labels: { include: { label: true } },
    },
  });

  if (historyEntries.length > 0) {
    await prisma.ticketHistory.createMany({
      data: historyEntries.map((h) => ({ ...h, ticketId, userId: user.sub })),
    });
  }

  return NextResponse.json(updated);
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { ticketId } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.createdById !== user.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.ticket.delete({ where: { id: ticketId } });
  return NextResponse.json({ message: "Ticket deleted" });
});
