import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import { join } from "path";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");

type Params = { id: string };

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify access via ticket or note ownership
  const hasAccess =
    attachment.uploadedById === user.sub ||
    (attachment.ticketId &&
      (await prisma.ticket.findFirst({
        where: {
          id: attachment.ticketId,
          OR: [
            { createdById: user.sub },
            { assignedToId: user.sub },
            { scope: "GROUP", group: { members: { some: { userId: user.sub } } } },
          ],
        },
      }))) ||
    (attachment.noteId &&
      (await prisma.note.findFirst({
        where: {
          id: attachment.noteId,
          OR: [{ userId: user.sub }, { group: { members: { some: { userId: user.sub } } } }],
        },
      })));

  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const filePath = join(UPLOAD_DIR, attachment.filename);
  const buffer = await readFile(filePath).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "File not found on disk" }, { status: 404 });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${attachment.originalName}"`,
    },
  });
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (attachment.uploadedById !== user.sub)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.attachment.delete({ where: { id } });
  await unlink(join(UPLOAD_DIR, attachment.filename)).catch(() => null);

  return NextResponse.json({ ok: true });
});
