import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, rotateRefreshToken, setRefreshCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    const token = match?.[1];

    if (!token) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const result = await rotateRefreshToken(token);
    if (!result) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { id: true, email: true, username: true, displayName: true, avatarUrl: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email, username: user.username });
    const res = NextResponse.json({ accessToken, user });
    return setRefreshCookie(res, result.newToken);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
