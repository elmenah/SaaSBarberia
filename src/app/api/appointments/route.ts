import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notifyNewAppointment } from "@/lib/n8n/webhooks";
import { z } from "zod";

const CreateAppointmentSchema = z.object({
  clientId: z.string().uuid(),
  barberId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).min(1),
  startsAt: z.string().datetime(),
  notes: z.string().optional(),
  source: z.enum(["manual", "whatsapp", "web", "api"]).default("manual"),
});

// GET /api/appointments?barbershopId=&date=&status=&page=&pageSize=
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const barbershopId = searchParams.get("barbershopId");
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20");

  if (!barbershopId) {
    return NextResponse.json({ error: "barbershopId required" }, { status: 400 });
  }

  const dateFrom    = searchParams.get("dateFrom");
  const dateTo      = searchParams.get("dateTo");
  // startsAtFrom / startsAtTo: ISO timestamp strings (timezone-aware, from client)
  const startsAtFrom = searchParams.get("startsAtFrom");
  const startsAtTo   = searchParams.get("startsAtTo");

  const where: Record<string, unknown> = { barbershopId };

  if (startsAtFrom || startsAtTo) {
    // Prioridad: timestamps explícitos del cliente (ya en UTC, sin conversión)
    const range: Record<string, Date> = {};
    if (startsAtFrom) range.gte = new Date(startsAtFrom);
    if (startsAtTo)   range.lte = new Date(startsAtTo);
    where.startsAt = range;
  } else if (date) {
    // date = "YYYY-MM-DD" — interpretar como UTC para consistencia
    const [y, m, d] = date.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    const end   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    where.startsAt = { gte: start, lte: end };
  } else if (dateFrom || dateTo) {
    // dateFrom/dateTo: "YYYY-MM-DD" strings; usar setHours para respetar
    // que el cliente ya envió la fecha local correcta
    const range: Record<string, Date> = {};
    if (dateFrom) {
      const d = new Date(dateFrom);
      d.setHours(0, 0, 0, 0);
      range.gte = d;
    }
    if (dateTo) {
      const d = new Date(dateTo);
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
    where.startsAt = range;
  }

  if (status) {
    where.status = status.toUpperCase();
  }

  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      include: {
        client: true,
        barber: { include: { user: true } },
        services: { include: { service: true } },
      },
      orderBy: { startsAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: appointments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

// POST /api/appointments
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parse = CreateAppointmentSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });
  }

  const { clientId, barberId, serviceIds, startsAt, notes, source } = parse.data;

  // Obtener la barbería del usuario
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedBarbershops: { take: 1 } },
  });

  if (!dbUser || !dbUser.ownedBarbershops[0]) {
    return NextResponse.json({ error: "Barbershop not found" }, { status: 404 });
  }

  const barbershop = dbUser.ownedBarbershops[0];

  // Obtener servicios y calcular totales
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, barbershopId: barbershop.id, isActive: true },
  });

  if (services.length !== serviceIds.length) {
    return NextResponse.json({ error: "One or more services are invalid" }, { status: 400 });
  }

  const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
  const totalDuration = services.reduce((sum, s) => sum + s.durationMins, 0);
  const startsAtDate = new Date(startsAt);
  const endsAt = new Date(startsAtDate.getTime() + totalDuration * 60_000);

  // Verificar conflicto de horario del barbero
  const conflict = await prisma.appointment.findFirst({
    where: {
      barberId,
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      OR: [
        { startsAt: { lt: endsAt }, endsAt: { gt: startsAtDate } },
      ],
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "Horario no disponible para este barbero" },
      { status: 409 }
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      barbershopId: barbershop.id,
      clientId,
      barberId,
      startsAt: startsAtDate,
      endsAt,
      totalPrice,
      totalDuration,
      notes,
      source,
      status: "PENDING",
      services: {
        create: services.map((s) => ({
          serviceId: s.id,
          price: s.price,
          durationMins: s.durationMins,
        })),
      },
    },
    include: {
      client: true,
      barber: { include: { user: true } },
      services: { include: { service: true } },
    },
  });

  // Nota: totalVisits y totalSpent se actualizan al marcar COMPLETADA (ver PATCH /api/appointments/[id])

  // Disparar webhook n8n
  notifyNewAppointment({
    barbershopId: barbershop.id,
    barbershopName: barbershop.name,
    appointmentId: appointment.id,
    clientName: appointment.client.name,
    clientPhone: appointment.client.phone,
    barberName: appointment.barber.user.name,
    serviceName: services.map((s) => s.name).join(", "),
    startsAt: startsAtDate,
    totalPrice,
  }).catch(console.error);

  return NextResponse.json({ data: appointment }, { status: 201 });
}
