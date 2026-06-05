import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { getEffectiveLimits } from "@/lib/plans";

// GET /api/export/clients — descarga CSV de todos los clientes (solo Enterprise)
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

  // Solo planes que tienen reportes avanzados (PRO+ y Enterprise)
  if (!limits.hasAdvancedReports) {
    return NextResponse.json(
      { error: "Esta función es exclusiva del plan Enterprise. Actualizá tu plan para exportar datos." },
      { status: 403 }
    );
  }

  const clients = await prisma.client.findMany({
    where:   { barbershopId: barbershop.id },
    include: {
      appointments: {
        where:   { status: "COMPLETED" },
        select:  { startsAt: true },
        orderBy: { startsAt: "desc" },
        take:    1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Construir CSV
  const headers = [
    "Nombre",
    "Teléfono",
    "Email",
    "VIP",
    "Total visitas",
    "Total gastado",
    "Última visita",
    "Fecha registro",
    "Notas",
  ];

  const TZ = "America/Santiago";
  const fmtDate = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString("es-CL", { timeZone: TZ }) : "";

  const rows = clients.map((c) => [
    c.name,
    c.phone,
    c.email ?? "",
    c.isVip ? "Sí" : "No",
    String(c.totalVisits),
    String(Number(c.totalSpent).toFixed(0)),
    fmtDate(c.lastVisitAt),
    fmtDate(c.createdAt),
    (c.notes ?? "").replace(/"/g, '""'), // escapar comillas
  ]);

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ];

  const csv      = csvLines.join("\r\n");
  const filename = `clientes-${barbershop.slug}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
