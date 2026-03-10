import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { joinGroupSchema } from "@/lib/validation";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = joinGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const group = await prisma.group.findUnique({ where: { inviteCode: parsed.data.inviteCode } });
  if (!group) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.sub, groupId: group.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  const member = await prisma.groupMember.create({
    data: { userId: user.sub, groupId: group.id, role: "MEMBER" },
  });
  return NextResponse.json({ group, member }, { status: 201 });
});
