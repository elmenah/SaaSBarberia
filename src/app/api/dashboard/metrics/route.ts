import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const DAYS_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Seguridad: derivar barbershopId desde la sesión, nunca del cliente ──────
  // Evita IDOR: un usuario autenticado no puede leer métricas de otro tenant.
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedBarbershops: { take: 1 } },
  });
  const barbershopId = dbUser?.ownedBarbershops[0]?.id;

  if (!barbershopId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const startOfDay       = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay         = new Date(now); endOfDay.setHours(23, 59, 59, 999);
  const threeMonthsAgo   = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  // Sparkline: últimos 7 días
  const sevenDaysAgo     = new Date(now); sevenDaysAgo.setDate(now.getDate() - 6); sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    // 0 — reservas del mes actual (sin canceladas/no-show)
    currentMonthAppointments,
    // 1 — ingresos del mes (COALESCE paid_amount, total_price)
    currentMonthRevenueRaw,
    // 2 — ingresos + reservas del mes anterior (COALESCE)
    lastMonthRaw,
    // 3 — clientes nuevos este mes
    currentMonthClients,
    // 4 — clientes nuevos mes anterior
    lastMonthClients,
    // 5 — reservas programadas hoy (cualquier estado)
    todayAppointments,
    // 6 — completadas este mes
    completedThisMonth,
    // 7 — completadas + canceladas + no-show este mes (para tasa)
    totalThisMonth,
    // 8 — ingresos de hoy
    todayRevenueRaw,
    // 9 — clientes atendidos hoy (completados)
    todayCompleted,
    // 10 — día de la semana con más citas (últimos 3 meses)
    bestDayRaw,
    // 11 — top servicios del mes
    topServicesRaw,
    // 12 — ingresos diarios últimos 7 días (sparkline)
    sparklineRaw,
  ] = await Promise.all([
    prisma.appointment.aggregate({
      where: {
        barbershopId,
        startsAt: { gte: startOfMonth },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      _count: true,
      _sum: { totalPrice: true },
    }),

    prisma.$queryRaw<[{ total: string }]>`
      SELECT COALESCE(SUM(COALESCE(paid_amount, total_price)), 0)::text AS total
      FROM appointments
      WHERE barbershop_id = ${barbershopId}
        AND starts_at >= ${startOfMonth}
        AND status = 'COMPLETED'
    `,

    prisma.$queryRaw<[{ total: string; count: string }]>`
      SELECT COALESCE(SUM(COALESCE(paid_amount, total_price)), 0)::text AS total,
             COUNT(*)::text AS count
      FROM appointments
      WHERE barbershop_id = ${barbershopId}
        AND starts_at >= ${startOfLastMonth}
        AND starts_at <= ${endOfLastMonth}
        AND status = 'COMPLETED'
    `,

    prisma.client.count({
      where: { barbershopId, createdAt: { gte: startOfMonth } },
    }),

    prisma.client.count({
      where: { barbershopId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),

    prisma.appointment.count({
      where: { barbershopId, startsAt: { gte: startOfDay, lte: endOfDay } },
    }),

    prisma.appointment.count({
      where: { barbershopId, status: "COMPLETED", startsAt: { gte: startOfMonth } },
    }),

    prisma.appointment.count({
      where: {
        barbershopId,
        status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
        startsAt: { gte: startOfMonth },
      },
    }),

    prisma.$queryRaw<[{ total: string }]>`
      SELECT COALESCE(SUM(COALESCE(paid_amount, total_price)), 0)::text AS total
      FROM appointments
      WHERE barbershop_id = ${barbershopId}
        AND starts_at >= ${startOfDay}
        AND starts_at <= ${endOfDay}
        AND status = 'COMPLETED'
    `,

    prisma.appointment.count({
      where: { barbershopId, status: "COMPLETED", startsAt: { gte: startOfDay, lte: endOfDay } },
    }),

    prisma.$queryRaw<Array<{ dow: string; cnt: string }>>`
      SELECT EXTRACT(DOW FROM starts_at)::text AS dow, COUNT(*)::text AS cnt
      FROM appointments
      WHERE barbershop_id = ${barbershopId}
        AND starts_at >= ${threeMonthsAgo}
        AND status = 'COMPLETED'
      GROUP BY dow
      ORDER BY cnt DESC
      LIMIT 1
    `,

    prisma.appointmentService.groupBy({
      by: ["serviceId"],
      where: {
        appointment: {
          barbershopId,
          startsAt: { gte: startOfMonth },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
      },
      _count: { serviceId: true },
      _sum:   { price: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: 5,
    }),

    // Ingresos diarios para sparkline (últimos 7 días)
    prisma.$queryRaw<Array<{ day: string; revenue: string; count: string }>>`
      SELECT DATE(starts_at)::text AS day,
             COALESCE(SUM(COALESCE(paid_amount, total_price)), 0)::text AS revenue,
             COUNT(*)::text AS count
      FROM appointments
      WHERE barbershop_id = ${barbershopId}
        AND starts_at >= ${sevenDaysAgo}
        AND starts_at <= ${endOfDay}
        AND status = 'COMPLETED'
      GROUP BY DATE(starts_at)
      ORDER BY DATE(starts_at) ASC
    `,
  ]);

  // ── Top servicios — resolver nombres ────────────────────────────────────────
  const serviceIds = topServicesRaw.map((s) => s.serviceId);
  const serviceNames = serviceIds.length > 0
    ? await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = Object.fromEntries(serviceNames.map((s) => [s.id, s.name]));
  const topServices = topServicesRaw.map((s) => ({
    serviceId: s.serviceId,
    name:      nameById[s.serviceId] ?? "—",
    count:     s._count.serviceId,
    revenue:   Number(s._sum.price ?? 0),
  }));

  // ── Sparkline: llenar los 7 días aunque no haya datos ───────────────────────
  const sparklineMap = Object.fromEntries(
    (sparklineRaw as Array<{ day: string; revenue: string; count: string }>).map((r) => [
      r.day,
      { revenue: Number(r.revenue), count: Number(r.count) },
    ])
  );
  const sparkline = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
    return {
      date:    key,
      revenue: sparklineMap[key]?.revenue ?? 0,
      count:   sparklineMap[key]?.count   ?? 0,
    };
  });

  // ── Ingresos mensuales ───────────────────────────────────────────────────────
  const currentRevenue = Number((currentMonthRevenueRaw as [{ total: string }])[0]?.total ?? 0);
  const lastRow        = (lastMonthRaw as [{ total: string; count: string }])[0];
  const lastRevenue    = Number(lastRow?.total  ?? 0);
  const lastAppts      = Number(lastRow?.count  ?? 0);

  const revenueGrowth      = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
  const currentAppts       = currentMonthAppointments._count;
  const appointmentsGrowth = lastAppts > 0 ? ((currentAppts - lastAppts) / lastAppts) * 100 : 0;
  const clientsGrowth      = lastMonthClients > 0 ? ((currentMonthClients - lastMonthClients) / lastMonthClients) * 100 : 0;
  const completionRate     = totalThisMonth > 0 ? (completedThisMonth / totalThisMonth) * 100 : 0;

  // ── Cierre del día ───────────────────────────────────────────────────────────
  const todayRevenue   = Number((todayRevenueRaw as [{ total: string }])[0]?.total ?? 0);
  const todayAvgTicket = todayCompleted > 0 ? todayRevenue / todayCompleted : 0;

  // ── Día más fuerte ───────────────────────────────────────────────────────────
  const bestDowEntry  = (bestDayRaw as Array<{ dow: string; cnt: string }>)[0];
  const bestDayOfWeek = bestDowEntry ? (DAYS_ES[Number(bestDowEntry.dow)] ?? null) : null;

  return NextResponse.json({
    data: {
      totalRevenue:       currentRevenue,
      revenueGrowth:      Math.round(revenueGrowth * 10) / 10,
      totalAppointments:  currentAppts,
      appointmentsGrowth: Math.round(appointmentsGrowth * 10) / 10,
      newClients:         currentMonthClients,
      clientsGrowth:      Math.round(clientsGrowth * 10) / 10,
      completionRate:     Math.round(completionRate * 10) / 10,
      todayAppointments,
      topServices,
      // Cierre del día
      todayRevenue,
      todayCompleted,
      todayAvgTicket: Math.round(todayAvgTicket),
      // Insight
      bestDayOfWeek,
      // Sparkline últimos 7 días
      sparkline,
    },
  });
}
