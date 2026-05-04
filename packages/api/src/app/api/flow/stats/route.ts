import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const groupId = req.nextUrl.searchParams.get("groupId") ?? undefined;

  const baseWhere = groupId
    ? { groupId, group: { members: { some: { userId: user.sub } } } }
    : {
        OR: [
          { createdById: user.sub },
          { assignedToId: user.sub },
        ],
        scope: "INDIVIDUAL" as const,
      };

  const [byStatus, byPriority, assigneeStats, recentActivity] = await Promise.all([
    // Count per status
    prisma.ticket.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: true,
    }),

    // Count per priority
    prisma.ticket.groupBy({
      by: ["priority"],
      where: baseWhere,
      _count: true,
    }),

    // Group view: top assignees
    groupId
      ? prisma.ticket.groupBy({
          by: ["assignedToId"],
          where: { groupId, assignedToId: { not: null } },
          _count: true,
          orderBy: { _count: { assignedToId: "desc" } },
          take: 5,
        })
      : Promise.resolve([]),

    // Tickets updated in the last 7 days
    prisma.ticket.count({
      where: {
        ...baseWhere,
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return NextResponse.json({ byStatus, byPriority, assigneeStats, recentActivity });
});
