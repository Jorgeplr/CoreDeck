import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createTicketSchema } from "@/lib/validation";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const groupId = searchParams.get("groupId");
  const scope = searchParams.get("scope");
  const assignedToId = searchParams.get("assignedToId");

  const where: Record<string, unknown> = {};

  if (scope === "GROUP" && groupId) {
    where.groupId = groupId;
    where.scope = "GROUP";
  } else {
    where.OR = [{ createdById: user.sub }, { assignedToId: user.sub }];
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assignedToId) where.assignedToId = assignedToId;

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      createdBy: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      assignedTo: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      labels: { include: { label: true } },
      _count: { select: { history: true } },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tickets);
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { labelIds, ...ticketData } = parsed.data;

  const ticket = await prisma.ticket.create({
    data: {
      ...ticketData,
      dueDate: ticketData.dueDate ? new Date(ticketData.dueDate) : undefined,
      createdById: user.sub,
      labels: labelIds?.length
        ? { create: labelIds.map((labelId) => ({ labelId })) }
        : undefined,
    },
    include: {
      createdBy: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      assignedTo: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      labels: { include: { label: true } },
    },
  });

  // Initial history entry
  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      userId: user.sub,
      action: "CREATED",
      newValue: ticket.status,
    },
  });

  return NextResponse.json(ticket, { status: 201 });
});
