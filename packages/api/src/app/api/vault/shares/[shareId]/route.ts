import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

type Params = { shareId: string };

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { shareId } = await params;
  const share = await prisma.vaultShare.findUnique({ where: { id: shareId } });
  if (!share) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Owner of the original entry OR the recipient can revoke
  const entry = await prisma.vaultEntry.findUnique({ where: { id: share.entryId } });
  const allowed =
    share.sharedWithUserId === user.sub ||
    share.sharedByUserId === user.sub ||
    (entry && entry.userId === user.sub);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.vaultShare.delete({ where: { id: shareId } });
  return NextResponse.json({ ok: true });
});
