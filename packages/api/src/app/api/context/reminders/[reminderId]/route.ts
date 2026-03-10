import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { updateReminderSchema } from "@/lib/validation";

type Params = { reminderId: string };

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { reminderId } = await params;
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, userId: user.sub },
  });
  if (!reminder) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(reminder);
});

export const PATCH = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { reminderId } = await params;
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, userId: user.sub },
  });
  if (!reminder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateReminderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      ...parsed.data,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
    },
  });
  return NextResponse.json(updated);
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { reminderId } = await params;
  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, userId: user.sub },
  });
  if (!reminder) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.reminder.delete({ where: { id: reminderId } });
  return NextResponse.json({ message: "Reminder deleted" });
});
