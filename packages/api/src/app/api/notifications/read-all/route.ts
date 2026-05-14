import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export const POST = withAuth(async (_req, { user }) => {
  const result = await prisma.notification.updateMany({
    where: { userId: user.sub, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true, updated: result.count });
});
