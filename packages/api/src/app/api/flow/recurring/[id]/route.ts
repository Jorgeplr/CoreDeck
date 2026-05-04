import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { prisma } from "@/lib/prisma";
import { createRecurringTicketSchema } from "@/lib/validation";

type Params = { id: string };

export const PATCH = withAuth<Promise<Params>>(async (req: NextRequest, { params, user }) => {
  const { id } = await params;
  const rt = await prisma.recurringTicket.findUnique({ where: { id } });
  if (!rt || rt.createdById !== user.sub)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createRecurringTicketSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.recurringTicket.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
});

export const DELETE = withAuth<Promise<Params>>(async (_req, { params, user }) => {
  const { id } = await params;
  const rt = await prisma.recurringTicket.findUnique({ where: { id } });
  if (!rt || rt.createdById !== user.sub)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recurringTicket.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
