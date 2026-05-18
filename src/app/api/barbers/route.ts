import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateBarberSchema = z.object({
  name:       z.string().min(2),
  specialty:  z.string().min(2),
  phone:      z.string().optional(),
  colorTag:   z.string().default("#6366f1"),
  bio:        z.string().optional(),
});

// GET /api/barbers?includeStats=true — lista barberos con stats opcionales del mes
export async function GET(request: Request) {
  const session = await requireAuth();
  if (!session?.barbershop) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const includeStats = searchParams.get("includeStats") === "true";

  const barbers = await prisma.barber.findMany({
    where: { barbershopId: session.barbershop.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  if (!includeStats) {
    return NextResponse.json({ data: barbers });
  }

  // Stats del mes actual por barbero (reservas no canceladas)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const statsRaw = await prisma.appointment.groupBy({
    by: ["barberId"],
    where: {
      barbershopId: session.barbershop.id,
      startsAt: { gte: startOfMonth },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    _count: { id: true },
    _sum:   { totalPrice: true },
  });

  const statsById = Object.fromEntries(
    statsRaw.map((s) => [s.barberId, {
      turnosMes:   s._count.id,
      ingresosMes: Number(s._sum.totalPrice ?? 0),
    }])
  );

  const barbersWithStats = barbers.map((b) => ({
    ...b,
    stats: statsById[b.id] ?? { turnosMes: 0, ingresosMes: 0 },
  }));

  return NextResponse.json({ data: barbersWithStats });
}

// POST /api/barbers — crea un barbero (User + Barber)
export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session?.barbershop) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const parse = CreateBarberSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });

  const { name, specialty, phone, colorTag, bio } = parse.data;

  // Crear un User placeholder (sin supabaseId real hasta que acepte la invitación)
  const email = body.email ?? `${name.toLowerCase().replace(/\s+/g, ".")}.${Date.now()}@placeholder.barberos.app`;

  const user = await prisma.user.create({
    data: {
      supabaseId: `placeholder-${Date.now()}`,
      email,
      name,
      phone,
      role: "BARBER",
    },
  });

  const barber = await prisma.barber.create({
    data: {
      userId:      user.id,
      barbershopId: session.barbershop.id,
      specialties: [specialty],
      colorTag,
      bio,
    },
    include: { user: true },
  });

  return NextResponse.json({ data: barber }, { status: 201 });
}
