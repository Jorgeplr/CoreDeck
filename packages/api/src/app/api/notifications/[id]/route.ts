import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

type Params = { id: string };

export const PATCH = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { id } = await params;
  const updated = await prisma.notification.updateMany({
    where: { id, userId: user.sub },
    data: { readAt: new Date() },
  });
  if (updated.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { id } = await params;
  await prisma.notification.deleteMany({ where: { id, userId: user.sub } });
  return NextResponse.json({ ok: true });
});
