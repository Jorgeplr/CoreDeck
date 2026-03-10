import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, type JwtPayload } from "./auth";

type RouteHandler<T = unknown> = (
  req: NextRequest,
  context: { params: T; user: JwtPayload }
) => Promise<NextResponse> | NextResponse;

export function withAuth<T = unknown>(handler: RouteHandler<T>) {
  return async (req: NextRequest, context: { params: T }) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    let user: JwtPayload;
    try {
      user = verifyAccessToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    return await handler(req, { ...context, user });
  };
}
