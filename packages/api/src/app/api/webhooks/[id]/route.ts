import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { updateWebhookSchema } from "@/lib/validation";

type Params = { id: string };

async function canManage(userId: string, webhookId: string) {
  const wh = await prisma.webhook.findUnique({ where: { id: webhookId } });
  if (!wh) return null;
  if (wh.userId === userId) return wh;
  if (wh.groupId) {
    const m = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: wh.groupId } },
    });
    if (m && (m.role === "OWNER" || m.role === "ADMIN")) return wh;
  }
  return null;
}

export const PATCH = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { id } = await params;
  const wh = await canManage(user.sub, id);
  if (!wh) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const body = await req.json();
  const parsed = updateWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { events, ...rest } = parsed.data;
  const updated = await prisma.webhook.update({
    where: { id },
    data: {
      ...rest,
      events: events ? events.join(",") : undefined,
      failureCount: rest.isActive ? 0 : undefined,
    },
  });
  return NextResponse.json(updated);
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { id } = await params;
  const wh = await canManage(user.sub, id);
  if (!wh) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
  await prisma.webhook.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
