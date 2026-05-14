import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { getAccessibleTicket } from "@/lib/ticketAccess";
import { startTimeEntrySchema } from "@/lib/validation";

type Params = { ticketId: string };

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { ticketId } = await params;
  const ticket = await getAccessibleTicket(user.sub, ticketId);
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.timeEntry.findMany({
    where: { ticketId },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const totalSec = entries.reduce((sum, e) => sum + (e.durationSec ?? 0), 0);
  return NextResponse.json({ items: entries, totalSec });
});

export const POST = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { ticketId } = await params;
  const ticket = await getAccessibleTicket(user.sub, ticketId);
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = startTimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Auto-stop any open entries for this user+ticket
  await prisma.timeEntry.updateMany({
    where: { ticketId, userId: user.sub, endedAt: null },
    data: { endedAt: new Date() },
  });

  const entry = await prisma.timeEntry.create({
    data: {
      ticketId,
      userId: user.sub,
      startedAt: new Date(),
      note: parsed.data.note,
    },
  });

  return NextResponse.json(entry, { status: 201 });
});
