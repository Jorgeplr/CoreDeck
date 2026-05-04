import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "uploads");
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/markdown",
  "application/zip",
];

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const ticketId = formData.get("ticketId") as string | null;
  const noteId = formData.get("noteId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ticketId && !noteId) return NextResponse.json({ error: "ticketId or noteId required" }, { status: 400 });
  if (file.size > MAX_SIZE_BYTES) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 415 });

  // Verify access
  if (ticketId) {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        OR: [
          { createdById: user.sub },
          { assignedToId: user.sub },
          { scope: "GROUP", group: { members: { some: { userId: user.sub } } } },
        ],
      },
    });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (noteId) {
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        OR: [
          { userId: user.sub },
          { group: { members: { some: { userId: user.sub } } } },
        ],
      },
    });
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const { randomBytes } = await import("crypto");
  const ext = file.name.split(".").pop() ?? "bin";
  const filename = `${randomBytes(16).toString("hex")}.${ext}`;
  const dest = join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buffer);

  const attachment = await prisma.attachment.create({
    data: {
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      ticketId: ticketId ?? undefined,
      noteId: noteId ?? undefined,
      uploadedById: user.sub,
    },
  });

  return NextResponse.json(attachment, { status: 201 });
});

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const ticketId = req.nextUrl.searchParams.get("ticketId") ?? undefined;
  const noteId = req.nextUrl.searchParams.get("noteId") ?? undefined;

  if (!ticketId && !noteId) return NextResponse.json({ error: "ticketId or noteId required" }, { status: 400 });

  const attachments = await prisma.attachment.findMany({
    where: { ticketId, noteId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(attachments);
});
