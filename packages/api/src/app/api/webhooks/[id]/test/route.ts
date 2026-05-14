import { NextResponse } from "next/server";
import { createHmac, randomUUID } from "crypto";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

type Params = { id: string };

export const POST = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { id } = await params;
  const wh = await prisma.webhook.findUnique({ where: { id } });
  if (!wh) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the creator can manually fire a test
  if (wh.userId !== user.sub) {
    if (wh.groupId) {
      const m = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: user.sub, groupId: wh.groupId } },
      });
      if (!m || (m.role !== "OWNER" && m.role !== "ADMIN")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = JSON.stringify({
    id: randomUUID(),
    event: "webhook.test",
    timestamp: new Date().toISOString(),
    data: { message: "Webhook test from CoreDesk" },
  });
  const signature = createHmac("sha256", wh.secret).update(body).digest("hex");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  let status = 0;
  let errorMsg: string | null = null;
  try {
    const res = await fetch(wh.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-coredesk-event": "webhook.test",
        "x-coredesk-signature": `sha256=${signature}`,
      },
      body,
      signal: controller.signal,
    });
    status = res.status;
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "unknown error";
  } finally {
    clearTimeout(timer);
  }

  await prisma.webhook.update({
    where: { id },
    data: { lastFiredAt: new Date(), lastStatus: status },
  });

  return NextResponse.json({ status, error: errorMsg });
});
