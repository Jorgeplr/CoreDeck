import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

type Params = { username: string };

/**
 * Look up another user's public key for vault sharing.
 * Only returns the public key (never private material).
 */
export const GET = withAuth<Promise<Params>>(async (_req, { params }) => {
  const { username } = await params;
  const u = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, avatarUrl: true, publicKey: true },
  });
  if (!u) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (!u.publicKey) {
    return NextResponse.json(
      { error: "El usuario aún no ha generado su clave pública. Pídele que abra su vault al menos una vez." },
      { status: 409 }
    );
  }
  return NextResponse.json({
    userId: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    publicKey: u.publicKey,
  });
});
