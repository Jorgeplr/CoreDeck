// Root API route
import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({ name: "CoreDesk API", version: "1.0.0", status: "ok" });
}
