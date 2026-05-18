import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const barbershopId = searchParams.get("barbershopId");

  if (!barbershopId) {
    return NextResponse.json({ error: "barbershopId required" }, { status: 400 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    currentMonthAppointments,
    currentMonthRevenue,
    lastMonthAppointments,
    currentMonthClients,
    lastMonthClients,
    todayAppointments,
    completedThisMonth,
    totalThisMonth,
    topServicesRaw,
  ] = await Promise.all([
    // Reservas del mes actual (todas excepto canceladas y no-show = confirmadas/en curso/completadas)
    prisma.appointment.aggregate({
      where: {
        barbershopId,
        startsAt: { gte: startOfMonth },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      _count: true,
      _sum: { totalPrice: true },
    }),
    // Ingresos del mes actual: solo reservas COMPLETADAS
    prisma.appointment.aggregate({
      where: {
        barbershopId,
        startsAt: { gte: startOfMonth },
        status: "COMPLETED",
      },
      _sum: { totalPrice: true },
    }),
    prisma.appointment.aggregate({
      where: {
        barbershopId,
        startsAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: "COMPLETED",
      },
      _count: true,
      _sum: { totalPrice: true },
    }),
    prisma.client.count({
      where: { barbershopId, createdAt: { gte: startOfMonth } },
    }),
    prisma.client.count({
      where: {
        barbershopId,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
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
    // Servicios más vendidos del mes (reservas no canceladas)
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
  ]);

  // Resolver nombres de servicios para el top
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

  // Ingresos: solo COMPLETADAS (currentMonthRevenue), comparado con COMPLETADAS del mes anterior
  const currentRevenue = Number(currentMonthRevenue._sum.totalPrice ?? 0);
  const lastRevenue = Number(lastMonthAppointments._sum.totalPrice ?? 0);
  const revenueGrowth = lastRevenue > 0
    ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
    : 0;

  // Reservas del mes: excluye canceladas y no-show (refleja agenda real)
  const currentAppts = currentMonthAppointments._count;
  const lastAppts = lastMonthAppointments._count;
  const appointmentsGrowth = lastAppts > 0
    ? ((currentAppts - lastAppts) / lastAppts) * 100
    : 0;

  const clientsGrowth = lastMonthClients > 0
    ? ((currentMonthClients - lastMonthClients) / lastMonthClients) * 100
    : 0;

  const completionRate = totalThisMonth > 0
    ? (completedThisMonth / totalThisMonth) * 100
    : 0;

  return NextResponse.json({
    data: {
      totalRevenue: currentRevenue,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      totalAppointments: currentAppts,
      appointmentsGrowth: Math.round(appointmentsGrowth * 10) / 10,
      newClients: currentMonthClients,
      clientsGrowth: Math.round(clientsGrowth * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      todayAppointments,
      topServices,
    },
  });
}
