import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

const uploadSchema = z.object({
  publicKey: z.string().min(1).max(100),
  encryptedPrivateKey: z.string().min(1).max(500),
  privateKeyIv: z.string().min(1).max(50),
});

export const GET = withAuth(async (_req, { user }) => {
  const u = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { publicKey: true, encryptedPrivateKey: true, privateKeyIv: true },
  });
  return NextResponse.json(u ?? { publicKey: null, encryptedPrivateKey: null, privateKeyIv: null });
});

export const PUT = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: user.sub },
    data: {
      publicKey: parsed.data.publicKey,
      encryptedPrivateKey: parsed.data.encryptedPrivateKey,
      privateKeyIv: parsed.data.privateKeyIv,
    },
  });
  return NextResponse.json({ ok: true });
});
