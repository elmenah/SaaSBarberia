import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const barbershopId = searchParams.get("barbershopId");
  if (!barbershopId) return NextResponse.json({ error: "barbershopId required" }, { status: 400 });

  const now = new Date();

  // Rango de mañana
  const tomorrowStart = new Date(now); tomorrowStart.setDate(now.getDate() + 1); tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd   = new Date(now); tomorrowEnd.setDate(now.getDate() + 1);   tomorrowEnd.setHours(23, 59, 59, 999);

  // Rango de esta semana (lunes a domingo)
  const dayOfWeek    = now.getDay(); // 0=dom
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart    = new Date(now); weekStart.setDate(now.getDate() + mondayOffset); weekStart.setHours(0, 0, 0, 0);
  const weekEnd      = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);

  // Clientes inactivos: sin visita hace +30 días (o que nunca vinieron)
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

  const [
    riskClients,
    birthdaysThisWeek,
    unconfirmedTomorrow,
    weekAppointments,
    servicesCount,
    totalClients,
    activeBarbers,
  ] = await Promise.all([
    // Clientes sin visita hace +30 días (con al menos 1 visita previa)
    prisma.client.count({
      where: {
        barbershopId,
        isActive: true,
        totalVisits: { gt: 0 },
        lastVisitAt: { lt: thirtyDaysAgo },
      },
    }),

    // Cumpleaños en los próximos 7 días
    prisma.$queryRaw<[{ cnt: string }]>`
      SELECT COUNT(*)::text AS cnt
      FROM clients
      WHERE barbershop_id = ${barbershopId}
        AND is_active = true
        AND birthdate IS NOT NULL
        AND (
          TO_CHAR(birthdate, 'MM-DD') BETWEEN TO_CHAR(NOW(), 'MM-DD')
          AND TO_CHAR(NOW() + INTERVAL '7 days', 'MM-DD')
        )
    `,

    // Turnos PENDING de mañana (sin confirmar)
    prisma.appointment.count({
      where: {
        barbershopId,
        status:   "PENDING",
        startsAt: { gte: tomorrowStart, lte: tomorrowEnd },
      },
    }),

    // Turnos esta semana (no cancelados)
    prisma.appointment.count({
      where: {
        barbershopId,
        status:   { notIn: ["CANCELLED"] },
        startsAt: { gte: weekStart, lte: weekEnd },
      },
    }),

    // Servicios configurados (para onboarding)
    prisma.service.count({ where: { barbershopId, isActive: true } }),

    // Clientes totales
    prisma.client.count({ where: { barbershopId } }),

    // Barberos activos (para estimar ocupación)
    prisma.barber.count({ where: { barbershopId, isActive: true } }),
  ]);

  const birthdayCount = Number((birthdaysThisWeek as [{ cnt: string }])[0]?.cnt ?? 0);

  // Ocupación estimada de la semana:
  // Capacidad ≈ barberos × días laborables × 8 turnos/día
  const workingDaysThisWeek = Math.min(5, weekAppointments > 0 ? 5 : 0); // simplificado
  const estimatedCapacity   = Math.max(1, activeBarbers) * 5 * 8;
  const weekOccupancy       = Math.min(100, Math.round((weekAppointments / estimatedCapacity) * 100));

  return NextResponse.json({
    data: {
      riskClients,
      birthdaysThisWeek: birthdayCount,
      unconfirmedTomorrow,
      weekAppointments,
      weekOccupancy,
      servicesCount,
      totalClients,
      activeBarbers,
    },
  });
}
