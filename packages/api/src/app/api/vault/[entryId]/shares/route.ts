import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createVaultShareSchema } from "@/lib/validation";
import { createNotification } from "@/lib/notificationService";

type Params = { entryId: string };

async function canShare(userId: string, entryId: string) {
  const entry = await prisma.vaultEntry.findUnique({ where: { id: entryId } });
  if (!entry) return null;
  // Only the owner of a PERSONAL entry can share. GROUP entries are already shared via membership.
  if (entry.scope === "PERSONAL" && entry.userId === userId) return entry;
  return null;
}

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { entryId } = await params;
  const entry = await canShare(user.sub, entryId);
  if (!entry) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const shares = await prisma.vaultShare.findMany({
    where: { entryId },
    include: {
      sharedWithUser: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });
  return NextResponse.json(shares);
});

export const POST = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { entryId } = await params;
  const entry = await canShare(user.sub, entryId);
  if (!entry) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const body = await req.json();
  const parsed = createVaultShareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.sharedWithUserId === user.sub) {
    return NextResponse.json({ error: "No puedes compartir contigo mismo" }, { status: 400 });
  }

  const recipient = await prisma.user.findUnique({
    where: { id: parsed.data.sharedWithUserId },
    select: { id: true, username: true },
  });
  if (!recipient) return NextResponse.json({ error: "Usuario destinatario no existe" }, { status: 404 });

  const share = await prisma.vaultShare.upsert({
    where: {
      entryId_sharedWithUserId: { entryId, sharedWithUserId: parsed.data.sharedWithUserId },
    },
    create: {
      entryId,
      sharedWithUserId: parsed.data.sharedWithUserId,
      sharedByUserId: user.sub,
      passwordEncrypted: parsed.data.passwordEncrypted,
      iv: parsed.data.iv,
    },
    update: {
      passwordEncrypted: parsed.data.passwordEncrypted,
      iv: parsed.data.iv,
      sharedByUserId: user.sub,
    },
  });

  createNotification({
    userId: parsed.data.sharedWithUserId,
    type: "VAULT_SHARED",
    title: "Te compartieron una credencial",
    body: `${user.username} compartió "${entry.title}" contigo.`,
  });

  return NextResponse.json(share, { status: 201 });
});
