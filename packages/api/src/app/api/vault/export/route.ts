import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve todas las entradas del vault accesibles por el usuario (PERSONAL
 * + GROUP de los grupos a los que pertenece). El contenido ya está cifrado
 * en cliente, así que se devuelve tal cual. El usuario lo descifrará con su
 * clave local antes de guardarlo en disco.
 */
export const GET = withAuth(async (_req, { user }) => {
  const groupIds = await prisma.groupMember
    .findMany({ where: { userId: user.sub }, select: { groupId: true } })
    .then((rows) => rows.map((r) => r.groupId));

  const entries = await prisma.vaultEntry.findMany({
    where: {
      OR: [
        { userId: user.sub },
        { scope: "GROUP", groupId: { in: groupIds } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    userId: user.sub,
    version: 1,
    entries: entries.map((e) => ({
      id: e.id,
      title: e.title,
      url: e.url,
      scope: e.scope,
      groupId: e.groupId,
      iv: e.iv,
      usernameEncrypted: e.usernameEncrypted,
      passwordEncrypted: e.passwordEncrypted,
      notesEncrypted: e.notesEncrypted,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="coredesk-vault-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
});
