import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reEncryptedEntrySchema = z.object({
  id: z.string(),
  usernameEncrypted: z.string().optional(),
  passwordEncrypted: z.string(),
  notesEncrypted: z.string().optional(),
  iv: z.string(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  // Vault entries re-encrypted with the new master key (client-side)
  reEncryptedEntries: z.array(reEncryptedEntrySchema).optional(),
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { currentPassword, newPassword, reEncryptedEntries } = parsed.data;

  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.sub }, data: { passwordHash } });

    if (reEncryptedEntries?.length) {
      for (const entry of reEncryptedEntries) {
        // Only update entries that belong to this user
        await tx.vaultEntry.updateMany({
          where: { id: entry.id, userId: user.sub },
          data: {
            usernameEncrypted: entry.usernameEncrypted,
            passwordEncrypted: entry.passwordEncrypted,
            notesEncrypted: entry.notesEncrypted,
            iv: entry.iv,
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
});
