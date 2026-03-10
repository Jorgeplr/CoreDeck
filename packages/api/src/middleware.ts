import { NextRequest, NextResponse } from "next/server";

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only handle /api routes
  if (!pathname.startsWith("/api")) return NextResponse.next();

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": CORS_ORIGIN,
        "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
