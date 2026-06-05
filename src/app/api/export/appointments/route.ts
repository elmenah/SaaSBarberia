import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { getEffectiveLimits } from "@/lib/plans";

// GET /api/export/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session?.barbershop) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { barbershop } = session;
  const limits = getEffectiveLimits(
    barbershop.subscriptionPlan,
    barbershop.subscriptionStatus,
    barbershop.trialEndsAt,
  );

  if (!limits.hasAdvancedReports) {
    return NextResponse.json(
      { error: "Esta función es exclusiva del plan Enterprise." },
      { status: 403 }
    );
  }

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  const appointments = await prisma.appointment.findMany({
    where: {
      barbershopId: barbershop.id,
      ...(from || to ? {
        startsAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to   ? { lte: new Date(to + "T23:59:59Z") } : {}),
        },
      } : {}),
    },
    include: {
      client:   { select: { name: true, phone: true, email: true } },
      barber:   { include: { user: { select: { name: true } } } },
      services: { include: { service: { select: { name: true } } } },
    },
    orderBy: { startsAt: "desc" },
  });

  const headers = [
    "Fecha",
    "Hora",
    "Cliente",
    "Teléfono cliente",
    "Barbero",
    "Servicio(s)",
    "Duración (min)",
    "Total",
    "Cobrado",
    "Estado",
    "Fuente",
  ];

  const TZ = "America/Santiago";
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("es-CL",  { timeZone: TZ });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("es-CL",  { hour: "2-digit", minute: "2-digit", timeZone: TZ });

  const STATUS_MAP: Record<string, string> = {
    PENDING:     "Pendiente",
    CONFIRMED:   "Confirmada",
    IN_PROGRESS: "En curso",
    COMPLETED:   "Completada",
    CANCELLED:   "Cancelada",
    NO_SHOW:     "No se presentó",
  };

  const rows = appointments.map((a) => [
    fmtDate(a.startsAt),
    fmtTime(a.startsAt),
    a.client.name,
    a.client.phone,
    a.barber.user.name,
    a.services.map((s) => s.service.name).join(" + "),
    String(a.totalDuration),
    String(Number(a.totalPrice).toFixed(0)),
    String(Number(a.paidAmount ?? a.totalPrice).toFixed(0)),
    STATUS_MAP[a.status] ?? a.status,
    a.source,
  ]);

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ];

  const csv      = csvLines.join("\r\n");
  const suffix   = from && to ? `${from}_${to}` : new Date().toISOString().slice(0, 10);
  const filename = `reservas-${barbershop.slug}-${suffix}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
