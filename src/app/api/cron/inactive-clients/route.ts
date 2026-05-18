import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReengagement } from "@/lib/email/send-appointment-emails";

// GET /api/cron/inactive-clients — reactivación clientes +30 días sin visita
// Vercel Cron: diario a las 10:00 AM
export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Buscar clientes inactivos (o sin visitas) y con email
  const clients = await prisma.client.findMany({
    where: {
      email:    { not: null },
      OR: [
        { lastVisitAt: { lt: cutoff } },
        { lastVisitAt: null, createdAt: { lt: cutoff } },
      ],
    },
    include: { barbershop: true },
  });

  let sent = 0;
  for (const client of clients) {
    if (!client.email) continue;
    try {
      const days = client.lastVisitAt
        ? Math.floor((Date.now() - client.lastVisitAt.getTime()) / 86400000)
        : Math.floor((Date.now() - client.createdAt.getTime()) / 86400000);

      await sendReengagement({
        clientName:     client.name,
        clientEmail:    client.email,
        barbershopName: client.barbershop.name,
        barbershopSlug: client.barbershop.slug,
        daysSinceVisit: days,
      });
      sent++;
    } catch (e) { console.error("[cron/inactive-clients] error", e); }
  }

  return NextResponse.json({ ok: true, sent });
}
