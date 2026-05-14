import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);

  const where: Record<string, unknown> = { userId: user.sub };
  if (unreadOnly) where.readAt = null;

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId: user.sub, readAt: null } }),
  ]);

  return NextResponse.json({ items, unreadCount });
});

export const DELETE = withAuth(async (_req, { user }) => {
  // Delete all read notifications older than 30 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  await prisma.notification.deleteMany({
    where: { userId: user.sub, readAt: { not: null, lt: cutoff } },
  });
  return NextResponse.json({ ok: true });
});
