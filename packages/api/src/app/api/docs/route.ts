import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { getOpenApiSpec } = await import("@/lib/openapi");
  return NextResponse.json(getOpenApiSpec());
}
