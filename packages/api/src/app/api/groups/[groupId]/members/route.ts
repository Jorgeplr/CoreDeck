import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { inviteMemberSchema } from "@/lib/validation";

type Params = { groupId: string };

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { groupId } = await params;
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.sub, groupId } },
  });
  if (!membership) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, email: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
  return NextResponse.json(members);
});

export const POST = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { groupId } = await params;
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.sub, groupId } },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: targetUser.id, groupId } },
  });
  if (existing) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  const newMember = await prisma.groupMember.create({
    data: { userId: targetUser.id, groupId, role: parsed.data.role },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
  });
  return NextResponse.json(newMember, { status: 201 });
});

export const DELETE = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { groupId } = await params;
  const { userId: targetUserId } = await req.json();

  const myMembership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.sub, groupId } },
  });

  // Allow self-removal or admin/owner removal
  if (!myMembership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (
    targetUserId !== user.sub &&
    myMembership.role !== "OWNER" &&
    myMembership.role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.groupMember.delete({
    where: { userId_groupId: { userId: targetUserId, groupId } },
  });
  return NextResponse.json({ message: "Member removed" });
});
