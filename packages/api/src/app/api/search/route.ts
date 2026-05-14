import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

/**
 * Build a boolean-mode MATCH expression: split into words, add a "+" prefix
 * and "*" suffix so each token must appear and prefix-matches.
 *   "open ticket" → "+open* +ticket*"
 */
function toBooleanQuery(q: string): string {
  return q
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .map((w) => `+${w.replace(/[+\-><()~*"@]/g, "")}*`)
    .join(" ");
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ tickets: [], notes: [], vault: [] });
  }

  const groupIds = await prisma.groupMember
    .findMany({ where: { userId: user.sub }, select: { groupId: true } })
    .then((rows) => rows.map((r) => r.groupId));

  const ftQuery = toBooleanQuery(q);
  const useFulltext = ftQuery.length > 0;

  const tickets = useFulltext
    ? await prisma.ticket.findMany({
        where: {
          OR: [
            { createdById: user.sub },
            { assignedToId: user.sub },
            { scope: "GROUP", groupId: { in: groupIds } },
          ],
          AND: {
            OR: [
              { title: { search: ftQuery } },
              { description: { search: ftQuery } },
            ],
          },
        },
        select: { id: true, title: true, status: true, priority: true, scope: true },
        take: 8,
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const notes = useFulltext
    ? await prisma.note.findMany({
        where: {
          OR: [
            { userId: user.sub },
            { groupId: { in: groupIds } },
          ],
          AND: {
            OR: [
              { title: { search: ftQuery } },
              { content: { search: ftQuery } },
            ],
          },
        },
        select: { id: true, title: true, isCollaborative: true },
        take: 8,
        orderBy: { updatedAt: "desc" },
      })
    : [];

  // Vault has no FULLTEXT (small column count, content is E2EE)
  const vault = await prisma.vaultEntry.findMany({
    where: {
      OR: [
        { userId: user.sub },
        { scope: "GROUP", groupId: { in: groupIds } },
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
  });

  return NextResponse.json({ tickets, notes, vault });
});
