import { NextResponse } from "next/server";
import { getOpenApiSpec } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getOpenApiSpec());
}
