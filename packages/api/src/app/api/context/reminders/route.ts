import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createReminderSchema } from "@/lib/validation";

export const GET = withAuth(async (_req, { user }) => {
  const reminders = await prisma.reminder.findMany({
    where: { userId: user.sub },
    orderBy: { dueAt: "asc" },
  });
  return NextResponse.json(reminders);
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = createReminderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      ...parsed.data,
      dueAt: new Date(parsed.data.dueAt),
      userId: user.sub,
    },
  });
  return NextResponse.json(reminder, { status: 201 });
});
