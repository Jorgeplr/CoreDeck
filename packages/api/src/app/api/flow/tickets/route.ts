import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createTicketSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notificationService";
import { fireAndForgetWebhook } from "@/lib/webhookDispatcher";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const groupId = searchParams.get("groupId");
  const scope = searchParams.get("scope");
  const assignedToId = searchParams.get("assignedToId");
  const limit = Number(searchParams.get("limit") ?? "0");
  const offset = Number(searchParams.get("offset") ?? "0");
  const take = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : undefined;
  const skip = Number.isFinite(offset) && offset > 0 ? offset : undefined;

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
    take,
    skip,
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

  // Notify assignee
  if (ticket.assignedToId && ticket.assignedToId !== user.sub) {
    createNotification({
      userId: ticket.assignedToId,
      type: "TICKET_ASSIGNED",
      title: "Te asignaron un ticket",
      body: ticket.title,
      ticketId: ticket.id,
      link: `/flow/tickets/${ticket.id}`,
    });
  }

  fireAndForgetWebhook({
    event: "ticket.created",
    groupId: ticket.groupId,
    userId: user.sub,
    payload: { ticket },
  });

  return NextResponse.json(ticket, { status: 201 });
});
