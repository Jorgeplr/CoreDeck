import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createNoteSchema } from "@/lib/validation";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  const where = groupId
    ? { groupId, isCollaborative: true }
    : { userId: user.sub };

  const notes = await prisma.note.findMany({
    where,
    select: { id: true, title: true, isCollaborative: true, groupId: true, userId: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(notes);
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isCollaborative && parsed.data.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.sub, groupId: parsed.data.groupId } },
    });
    if (!membership) return NextResponse.json({ error: "Not a group member" }, { status: 403 });
  }

  const note = await prisma.note.create({
    data: {
      ...parsed.data,
      userId: parsed.data.isCollaborative ? null : user.sub,
    },
  });
  return NextResponse.json(note, { status: 201 });
});
