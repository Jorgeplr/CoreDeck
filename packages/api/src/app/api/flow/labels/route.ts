import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createLabelSchema } from "@/lib/validation";

export const GET = withAuth(async () => {
  const labels = await prisma.label.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(labels);
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = createLabelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const label = await prisma.label.create({ data: parsed.data });
  return NextResponse.json(label, { status: 201 });
});
