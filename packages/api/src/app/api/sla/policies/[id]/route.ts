import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { updateSlaPolicySchema } from "@/lib/validation";

type Params = { id: string };

async function canManage(userId: string, policyId: string) {
  const p = await prisma.slaPolicy.findUnique({ where: { id: policyId } });
  if (!p) return null;
  if (!p.groupId) return p; // global — allow any (lock down outside)
  const m = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: p.groupId } },
  });
  if (!m || (m.role !== "OWNER" && m.role !== "ADMIN")) return null;
  return p;
}

export const PATCH = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { id } = await params;
  const policy = await canManage(user.sub, id);
  if (!policy) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSlaPolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.slaPolicy.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { id } = await params;
  const policy = await canManage(user.sub, id);
  if (!policy) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  await prisma.slaPolicy.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
