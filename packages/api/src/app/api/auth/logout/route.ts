import { NextRequest, NextResponse } from "next/server";
import { revokeRefreshToken, clearRefreshCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/refreshToken=([^;]+)/);
    const token = match?.[1];

    if (token) {
      await revokeRefreshToken(token);
    }

    const res = NextResponse.json({ message: "Logged out successfully" });
    res.headers.append("Set-Cookie", clearRefreshCookie());
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
