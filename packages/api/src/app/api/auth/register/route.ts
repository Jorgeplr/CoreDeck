import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, createRefreshToken, setRefreshCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
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
    const user = await prisma.user.create({
      data: { email, username, passwordHash, displayName },
      select: { id: true, email: true, username: true, displayName: true, avatarUrl: true },
    });

    const accessToken = signAccessToken({ sub: user.id, email: user.email, username: user.username });
    const refreshToken = await createRefreshToken(user.id);

    const res = NextResponse.json({ accessToken, user }, { status: 201 });
    return setRefreshCookie(res, refreshToken);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
