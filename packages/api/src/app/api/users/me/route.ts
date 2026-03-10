import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  avatarUrl: z.string().url().optional(),
});

export const GET = withAuth(async (_req, { user }) => {
  const me = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, createdAt: true },
  });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(me);
});

export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.sub },
    data: parsed.data,
    select: { id: true, email: true, username: true, displayName: true, avatarUrl: true },
  });
  return NextResponse.json(updated);
});
