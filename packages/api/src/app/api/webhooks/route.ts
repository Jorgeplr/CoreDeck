import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createWebhookSchema } from "@/lib/validation";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const groupId = new URL(req.url).searchParams.get("groupId");

  if (groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.sub, groupId } },
    });
    if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const items = await prisma.webhook.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  }

  // Personal webhooks (no group)
  const items = await prisma.webhook.findMany({
    where: { userId: user.sub, groupId: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = createWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { groupId, events, ...rest } = parsed.data;

  if (groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.sub, groupId } },
    });
    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const webhook = await prisma.webhook.create({
    data: {
      ...rest,
      groupId,
      userId: user.sub,
      events: events.join(","),
      secret: randomBytes(24).toString("hex"),
    },
  });
  return NextResponse.json(webhook, { status: 201 });
});
