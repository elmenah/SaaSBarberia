import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const DaySchema = z.object({
  enabled:   z.boolean(),
  from:      z.string(),
  to:        z.string(),
  breakFrom: z.string(),
  breakTo:   z.string(),
  hasBreak:  z.boolean(),
});

const ScheduleSchema = z.record(z.string(), DaySchema);

// GET /api/barbers/me/schedule
export async function GET() {
  const session = await requireAuth();
  if (!session?.dbUser || !session?.barbershop) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const barber = await prisma.barber.findFirst({
    where: { userId: session.dbUser.id, barbershopId: session.barbershop.id },
    select: { id: true, schedule: true },
  });

  if (!barber) return NextResponse.json({ error: "Perfil de barbero no encontrado" }, { status: 404 });

  return NextResponse.json({ data: barber.schedule ?? {} });
}

// PATCH /api/barbers/me/schedule
export async function PATCH(request: Request) {
  const session = await requireAuth();
  if (!session?.dbUser || !session?.barbershop) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const barber = await prisma.barber.findFirst({
    where: { userId: session.dbUser.id, barbershopId: session.barbershop.id },
  });

  if (!barber) return NextResponse.json({ error: "Perfil de barbero no encontrado" }, { status: 404 });

  const body  = await request.json();
  const parse = ScheduleSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.errors.map((e) => e.message).join(", ") }, { status: 422 });
  }

  const updated = await prisma.barber.update({
    where: { id: barber.id },
    data:  { schedule: parse.data },
    select: { schedule: true },
  });

  return NextResponse.json({ data: updated.schedule });
}
