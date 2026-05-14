import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (_req, { user }) => {
  const shares = await prisma.vaultShare.findMany({
    where: { sharedWithUserId: user.sub },
    include: {
      entry: {
        select: { id: true, title: true, url: true, scope: true },
      },
      sharedByUser: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(shares);
});
