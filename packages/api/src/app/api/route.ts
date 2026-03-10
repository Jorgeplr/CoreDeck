// Root API route — initializes cron jobs once on first request
import { NextResponse } from "next/server";
import { initCronJobs } from "@/lib/cronJobs";

initCronJobs();

export function GET() {
  return NextResponse.json({ name: "CoreDesk API", version: "1.0.0", status: "ok" });
}
