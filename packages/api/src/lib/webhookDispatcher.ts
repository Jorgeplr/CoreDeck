import { createHmac, randomUUID } from "crypto";
import { prisma } from "./prisma";

const TIMEOUT_MS = Number(process.env.WEBHOOK_TIMEOUT_MS ?? 5000);
const MAX_FAILURES_BEFORE_DISABLE = 10;

type WebhookEvent =
  | "ticket.created"
  | "ticket.updated"
  | "ticket.status_changed"
  | "ticket.assigned"
  | "ticket.deleted"
  | "ticket.commented"
  | "ticket.sla_breached";

interface DispatchInput {
  event: WebhookEvent;
  groupId?: string | null;
  userId?: string;
  payload: Record<string, unknown>;
}

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function deliver(url: string, secret: string, event: WebhookEvent, payload: Record<string, unknown>) {
  const body = JSON.stringify({
    id: randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-coredesk-event": event,
        "x-coredesk-signature": `sha256=${sign(secret, body)}`,
      },
      body,
      signal: controller.signal,
    });
    return res.status;
  } finally {
    clearTimeout(timer);
  }
}

export async function dispatchWebhook(input: DispatchInput): Promise<void> {
  const { event, groupId, userId, payload } = input;

  const candidates = await prisma.webhook.findMany({
    where: {
      isActive: true,
      OR: [
        groupId ? { groupId } : { id: "__never__" },
        userId ? { userId, groupId: null } : { id: "__never__" },
      ],
    },
  });

  await Promise.all(
    candidates
      .filter((wh) => wh.events.split(",").map((e) => e.trim()).includes(event))
      .map(async (wh) => {
        try {
          const status = await deliver(wh.url, wh.secret, event, payload);
          const ok = status >= 200 && status < 300;
          await prisma.webhook.update({
            where: { id: wh.id },
            data: {
              lastFiredAt: new Date(),
              lastStatus: status,
              failureCount: ok ? 0 : wh.failureCount + 1,
              isActive: ok || wh.failureCount + 1 < MAX_FAILURES_BEFORE_DISABLE,
            },
          });
        } catch (err) {
          console.error(`[webhook ${wh.id}] delivery failed:`, err);
          await prisma.webhook
            .update({
              where: { id: wh.id },
              data: {
                lastFiredAt: new Date(),
                lastStatus: 0,
                failureCount: wh.failureCount + 1,
                isActive: wh.failureCount + 1 < MAX_FAILURES_BEFORE_DISABLE,
              },
            })
            .catch(() => {});
        }
      })
  );
}

export function fireAndForgetWebhook(input: DispatchInput): void {
  dispatchWebhook(input).catch((err) => console.error("[webhook] dispatch error:", err));
}
