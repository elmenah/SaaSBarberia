import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

// GET /api/barbers/me — perfil de barbero del usuario autenticado
export async function GET() {
  const session = await requireAuth();
  if (!session?.dbUser || !session?.barbershop) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const barber = await prisma.barber.findFirst({
    where: {
      userId:       session.dbUser.id,
      barbershopId: session.barbershop.id,
    },
    include: {
      user: { select: { name: true, phone: true, email: true } },
      services: {
        include: { service: { select: { id: true, name: true, price: true, durationMins: true, category: true } } },
      },
      _count: {
        select: {
          appointments: {
            where: {
              status:   { notIn: ["CANCELLED", "NO_SHOW"] },
              startsAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
          },
        },
      },
    },
  });

  if (!barber) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({
    data: {
      id:             barber.id,
      colorTag:       barber.colorTag,
      specialties:    barber.specialties,
      bio:            barber.bio,
      isActive:       barber.isActive,
      createdAt:      barber.createdAt,
      user:           barber.user,
      turnosMes:      barber._count.appointments,
      services:       barber.services.map((bs) => bs.service),
      certifications: (barber.certifications as unknown[]) ?? [],
    },
  });
}

const CreateMeSchema = z.object({
  specialty: z.string().min(2),
  colorTag:  z.string().default("#CA8A04"),
  bio:       z.string().optional(),
  phone:     z.string().optional(),
});

// POST /api/barbers/me — crea un perfil de barbero para el dueño usando su User existente
export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session?.dbUser || !session?.barbershop) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Verificar que no tenga ya un perfil
  const existing = await prisma.barber.findFirst({
    where: { userId: session.dbUser.id, barbershopId: session.barbershop.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Ya tenés un perfil de barbero" }, { status: 409 });
  }

  const body  = await request.json();
  const parse = CreateMeSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });
  }

  const { specialty, colorTag, bio, phone } = parse.data;

  if (phone) {
    await prisma.user.update({ where: { id: session.dbUser.id }, data: { phone } });
  }

  const barber = await prisma.barber.create({
    data: {
      userId:       session.dbUser.id,
      barbershopId: session.barbershop.id,
      specialties:  [specialty],
      colorTag,
      bio,
    },
    include: { user: true },
  });

  return NextResponse.json({ data: barber }, { status: 201 });
}

// PUT /api/barbers/me/services — sincroniza los servicios del barbero autenticado
// (Esta ruta la maneja /api/barbers/me/services/route.ts)
