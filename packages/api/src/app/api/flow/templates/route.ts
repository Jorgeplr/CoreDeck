import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createTemplateSchema } from "@/lib/validation";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const groupId = req.nextUrl.searchParams.get("groupId") ?? undefined;

  const userGroupIds = groupId
    ? [groupId]
    : await prisma.groupMember
        .findMany({ where: { userId: user.sub }, select: { groupId: true } })
        .then((rows) => rows.map((r) => r.groupId));

  const templates = await prisma.ticketTemplate.findMany({
    where: {
      OR: [
        { createdById: user.sub, scope: "INDIVIDUAL" },
        { scope: "GROUP", groupId: { in: userGroupIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { groupId, ...data } = parsed.data;

  if (groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.sub, groupId } },
    });
    if (!membership) return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  const template = await prisma.ticketTemplate.create({
    data: { ...data, groupId: groupId ?? undefined, createdById: user.sub },
  });

  return NextResponse.json(template, { status: 201 });
});
