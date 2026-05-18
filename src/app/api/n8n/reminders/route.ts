import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/n8n/reminders?type=24h|1h|reactivation&secret=N8N_INTERNAL_SECRET
 * Endpoint interno — solo lo llaman los workflows de n8n.
 * Protegido por un secret compartido (env N8N_INTERNAL_SECRET).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type   = searchParams.get("type");
  const secret = searchParams.get("secret");

  // Verificar secret
  const expectedSecret = process.env.N8N_INTERNAL_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  if (type === "24h") {
    // Citas de mañana (entre las 00:00 y 23:59 del día siguiente)
    const tomorrow     = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
    const tomorrowEnd   = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { gte: tomorrowStart, lte: tomorrowEnd },
      },
      include: {
        client:   { select: { name: true, phone: true } },
        barber:   { include: { user: { select: { name: true } } } },
        barbershop: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    });

    const data = appointments.map((a) => ({
      appointmentId:  a.id,
      clientName:     a.client.name,
      clientPhone:    a.client.phone,
      barberName:     a.barber.user.name,
      barbershopName: a.barbershop.name,
      serviceName:    a.services.map((s) => s.service.name).join(", "),
      startsAt:       a.startsAt.toISOString(),
    }));

    return NextResponse.json({ data });
  }

  if (type === "1h") {
    // Citas en la próxima hora (entre ahora + 50min y ahora + 70min, para disparar ~1h antes)
    const from = new Date(now.getTime() + 50 * 60_000);
    const to   = new Date(now.getTime() + 70 * 60_000);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { gte: from, lte: to },
      },
      include: {
        client:   { select: { name: true, phone: true } },
        barber:   { include: { user: { select: { name: true } } } },
        barbershop: { select: { name: true, address: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    });

    const data = appointments.map((a) => ({
      appointmentId:  a.id,
      clientName:     a.client.name,
      clientPhone:    a.client.phone,
      barberName:     a.barber.user.name,
      barbershopName: a.barbershop.name,
      barbershopAddress: a.barbershop.address ?? "",
      serviceName:    a.services.map((s) => s.service.name).join(", "),
      startsAt:       a.startsAt.toISOString(),
    }));

    return NextResponse.json({ data });
  }

  if (type === "reactivation") {
    // Clientes que no visitan hace 30+ días y tienen teléfono
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60_000);

    const clients = await prisma.client.findMany({
      where: {
        phone:       { not: "" },
        lastVisitAt: { lte: cutoff },
      },
      include: {
        barbershop: { select: { name: true } },
      },
      take: 100, // máx 100 por ejecución para no saturar
    });

    const data = clients.map((c) => ({
      clientId:       c.id,
      clientName:     c.name,
      clientPhone:    c.phone,
      barbershopName: c.barbershop.name,
      lastVisitAt:    c.lastVisitAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "type debe ser: 24h, 1h o reactivation" }, { status: 400 });
}
