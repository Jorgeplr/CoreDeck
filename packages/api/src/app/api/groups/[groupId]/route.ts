import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { updateGroupSchema } from "@/lib/validation";

type Params = { groupId: string };

async function getMembership(userId: string, groupId: string) {
  return prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
}

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { groupId } = await params;
  const membership = await getMembership(user.sub, groupId);
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      _count: { select: { members: true, tickets: true, notes: true } },
    },
  });
  return NextResponse.json(group);
});

export const PATCH = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { groupId } = await params;
  const membership = await getMembership(user.sub, groupId);
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const group = await prisma.group.update({
    where: { id: groupId },
    data: parsed.data,
  });
  return NextResponse.json(group);
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { groupId } = await params;
  const membership = await getMembership(user.sub, groupId);
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.group.delete({ where: { id: groupId } });
  return NextResponse.json({ message: "Group deleted" });
});
