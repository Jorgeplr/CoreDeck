import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailVerification } from "@/lib/emailService";
import { checkRateLimit } from "@/lib/rateLimiter";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(`resend:${ip}`, 3, 60_000)) {
    return NextResponse.json(
      { error: "Demasiados intentos, espera un minuto" },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always return 200 to avoid user enumeration
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const { randomBytes } = await import("crypto");
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken: token, emailVerifyExpires: expires },
  });

  sendEmailVerification(user.email, token).catch((err) =>
    console.error("[resend-verification] email failed:", err)
  );

  return NextResponse.json({ ok: true });
}
