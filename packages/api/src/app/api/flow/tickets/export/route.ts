import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const groupId = searchParams.get("groupId");
  const scope = searchParams.get("scope");

  const where: Record<string, unknown> = {};
  if (scope === "GROUP" && groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.sub, groupId } },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    where.groupId = groupId;
    where.scope = "GROUP";
  } else {
    where.OR = [{ createdById: user.sub }, { assignedToId: user.sub }];
  }
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      createdBy: { select: { username: true } },
      assignedTo: { select: { username: true } },
      group: { select: { slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = [
    "id",
    "title",
    "status",
    "priority",
    "scope",
    "group",
    "createdBy",
    "assignedTo",
    "dueDate",
    "createdAt",
    "updatedAt",
    "description",
  ];
  const rows = tickets.map((t) =>
    [
      t.id,
      t.title,
      t.status,
      t.priority,
      t.scope,
      t.group?.slug ?? "",
      t.createdBy.username,
      t.assignedTo?.username ?? "",
      t.dueDate?.toISOString() ?? "",
      t.createdAt.toISOString(),
      t.updatedAt.toISOString(),
      t.description ?? "",
    ]
      .map(escapeCsv)
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\r\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="coredesk-tickets-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});
