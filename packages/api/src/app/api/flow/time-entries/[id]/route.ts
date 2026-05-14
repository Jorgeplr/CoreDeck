import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { stopTimeEntrySchema } from "@/lib/validation";

type Params = { id: string };

export const PATCH = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { id } = await params;
  const entry = await prisma.timeEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (entry.endedAt) {
    return NextResponse.json({ error: "Ya está cerrada" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = stopTimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const endedAt = new Date();
  const durationSec = Math.floor((endedAt.getTime() - entry.startedAt.getTime()) / 1000);

  const updated = await prisma.timeEntry.update({
    where: { id },
    data: {
      endedAt,
      durationSec,
      note: parsed.data.note ?? entry.note,
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { id } = await params;
  const entry = await prisma.timeEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.timeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
