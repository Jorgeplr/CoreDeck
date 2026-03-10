import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { updateVaultEntrySchema } from "@/lib/validation";

type Params = { entryId: string };

async function getEntryWithAccess(entryId: string, userId: string) {
  const entry = await prisma.vaultEntry.findUnique({ where: { id: entryId } });
  if (!entry) return null;

  if (entry.scope === "PERSONAL" && entry.userId === userId) return entry;

  if (entry.scope === "GROUP" && entry.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId: entry.groupId } },
    });
    if (membership) return entry;
  }

  return null;
}

export const GET = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { entryId } = await params;
  const entry = await getEntryWithAccess(entryId, user.sub);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(entry);
});

export const PATCH = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { entryId } = await params;
  const entry = await getEntryWithAccess(entryId, user.sub);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateVaultEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.vaultEntry.update({
    where: { id: entryId },
    data: parsed.data,
  });
  return NextResponse.json(updated);
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { entryId } = await params;
  const entry = await getEntryWithAccess(entryId, user.sub);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.vaultEntry.delete({ where: { id: entryId } });
  return NextResponse.json({ message: "Entry deleted" });
});
