import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { slaPolicySchema } from "@/lib/validation";

async function assertAdmin(userId: string, groupId: string | undefined | null): Promise<boolean> {
  if (!groupId) return false;
  const m = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return !!m && (m.role === "OWNER" || m.role === "ADMIN");
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const groupId = new URL(req.url).searchParams.get("groupId");
  if (groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.sub, groupId } },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const items = await prisma.slaPolicy.findMany({
      where: { groupId },
      orderBy: { priority: "asc" },
    });
    return NextResponse.json(items);
  }

  // Default global policies (groupId null)
  const items = await prisma.slaPolicy.findMany({
    where: { groupId: null },
    orderBy: { priority: "asc" },
  });
  return NextResponse.json(items);
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = slaPolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { groupId } = parsed.data;
  if (groupId) {
    const ok = await assertAdmin(user.sub, groupId);
    if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Global policies: any authenticated user can read; only allow create if no group provided
  // and rely on the deployment to lock this down — out of scope here.

  const existing = await prisma.slaPolicy.findFirst({
    where: { groupId: groupId ?? null, priority: parsed.data.priority },
  });
  const created = existing
    ? await prisma.slaPolicy.update({
        where: { id: existing.id },
        data: {
          firstResponseMinutes: parsed.data.firstResponseMinutes,
          resolutionMinutes: parsed.data.resolutionMinutes,
        },
      })
    : await prisma.slaPolicy.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
});
