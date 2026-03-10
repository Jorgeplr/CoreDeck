import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createVaultEntrySchema } from "@/lib/validation";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const groupId = searchParams.get("groupId");

  const where =
    scope === "GROUP" && groupId
      ? { groupId, scope: "GROUP" as const }
      : { userId: user.sub, scope: "PERSONAL" as const };

  const entries = await prisma.vaultEntry.findMany({
    where,
    select: {
      id: true,
      title: true,
      url: true,
      usernameEncrypted: true,
      passwordEncrypted: true,
      notesEncrypted: true,
      iv: true,
      scope: true,
      groupId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { title: "asc" },
  });

  return NextResponse.json(entries);
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = createVaultEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify group membership for group-scoped entries
  if (parsed.data.scope === "GROUP" && parsed.data.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.sub, groupId: parsed.data.groupId } },
    });
    if (!membership) {
      return NextResponse.json({ error: "Not a group member" }, { status: 403 });
    }
  }

  const entry = await prisma.vaultEntry.create({
    data: {
      ...parsed.data,
      userId: parsed.data.scope === "PERSONAL" ? user.sub : null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
});
