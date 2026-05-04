import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, createRefreshToken, setRefreshCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimiter";
import { sendEmailVerification } from "@/lib/emailService";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRateLimit(`register:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Demasiados intentos, inténtalo en un minuto" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, username, password, displayName } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email or username already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { randomBytes } = await import("crypto");
    const emailVerifyToken = randomBytes(32).toString("hex");
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: { email, username, passwordHash, displayName, emailVerifyToken, emailVerifyExpires },
      select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, emailVerified: true },
    });

    // Fire-and-forget — registration succeeds even if email delivery fails
    sendEmailVerification(email, emailVerifyToken).catch((err) =>
      console.error("[register] email verification send failed:", err)
    );

    const accessToken = signAccessToken({ sub: user.id, email: user.email, username: user.username });
    const refreshToken = await createRefreshToken(user.id);

    const res = NextResponse.json({ accessToken, user }, { status: 201 });
    return setRefreshCookie(res, refreshToken);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
