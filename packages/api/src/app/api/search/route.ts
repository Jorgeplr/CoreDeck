import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ tickets: [], notes: [], vault: [] });
  }

  const userGroupIds = await prisma.groupMember
    .findMany({ where: { userId: user.sub }, select: { groupId: true } })
    .then((rows) => rows.map((r) => r.groupId));

  const [tickets, notes, vault] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        OR: [
          { createdById: user.sub },
          { assignedToId: user.sub },
          { scope: "GROUP", groupId: { in: userGroupIds } },
        ],
        AND: {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        scope: true,
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),

    prisma.note.findMany({
      where: {
        OR: [
          { userId: user.sub },
          { groupId: { in: userGroupIds } },
        ],
        AND: {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
          ],
        },
      },
      select: { id: true, title: true, isCollaborative: true },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),

    // Vault: only title and url (content is E2EE, server can't search inside)
    prisma.vaultEntry.findMany({
      where: {
        OR: [
          { userId: user.sub },
          { scope: "GROUP", groupId: { in: userGroupIds } },
        ],
        AND: {
          OR: [
            { title: { contains: q } },
            { url: { contains: q } },
          ],
        },
      },
      select: { id: true, title: true, url: true, scope: true },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ tickets, notes, vault });
});
