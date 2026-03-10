import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { updateNoteSchema } from "@/lib/validation";

type Params = { noteId: string };

async function getNoteWithAccess(noteId: string, userId: string) {
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note) return null;
  if (note.userId === userId) return note;
  if (note.isCollaborative && note.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: note.groupId } },
    });
    if (membership) return note;
  }
  return null;
}

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { noteId } = await params;
  const note = await getNoteWithAccess(noteId, user.sub);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(note);
});

export const PATCH = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { noteId } = await params;
  const note = await getNoteWithAccess(noteId, user.sub);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.note.update({ where: { id: noteId }, data: parsed.data });
  return NextResponse.json(updated);
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { noteId } = await params;
  const note = await prisma.note.findUnique({ where: { id: noteId } });
  if (!note || note.userId !== user.sub) {
    return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  }
  await prisma.note.delete({ where: { id: noteId } });
  return NextResponse.json({ message: "Note deleted" });
});
