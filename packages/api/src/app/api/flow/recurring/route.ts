import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createRecurringTicketSchema } from "@/lib/validation";

export const GET = withAuth(async (_req, { user }) => {
  const recurring = await prisma.recurringTicket.findMany({
    where: { createdById: user.sub },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(recurring);
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = createRecurringTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { groupId, assignedToId, ...data } = parsed.data;

  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.sub, groupId } },
    });
    if (!membership) return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  const recurring = await prisma.recurringTicket.create({
    data: {
      ...data,
      groupId: groupId ?? undefined,
      assignedToId: assignedToId ?? undefined,
      createdById: user.sub,
    },
  });

  return NextResponse.json(recurring, { status: 201 });
});
