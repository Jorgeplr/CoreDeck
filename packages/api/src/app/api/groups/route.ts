import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createGroupSchema } from "@/lib/validation";

export const GET = withAuth(async (_req, { user }) => {
  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.sub } } },
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId: user.sub },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(groups);
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slug =
    parsed.data.slug ??
    parsed.data.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .substring(0, 40) +
      "-" +
      Date.now().toString(36);

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const existing = await prisma.group.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
  }

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      slug,
      inviteCode,
      members: {
        create: { userId: user.sub, role: "OWNER" },
      },
    },
    include: { _count: { select: { members: true } } },
  });

  return NextResponse.json(group, { status: 201 });
});
