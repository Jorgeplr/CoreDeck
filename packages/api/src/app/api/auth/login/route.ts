import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, createRefreshToken, setRefreshCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email, username: user.username });
    const refreshToken = await createRefreshToken(user.id);

    const { passwordHash: _, ...safeUser } = user;
    const res = NextResponse.json({ accessToken, user: safeUser });
    return setRefreshCookie(res, refreshToken);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
