import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createTemplateSchema } from "@/lib/validation";

type Params = { id: string };

export const PATCH = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { id } = await params;
  const tpl = await prisma.ticketTemplate.findUnique({ where: { id } });
  if (!tpl || tpl.createdById !== user.sub)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createTemplateSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.ticketTemplate.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { id } = await params;
  const tpl = await prisma.ticketTemplate.findUnique({ where: { id } });
  if (!tpl || tpl.createdById !== user.sub)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.ticketTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
