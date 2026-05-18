import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReviewRequest } from "@/lib/email/send-appointment-emails";

// GET /api/cron/post-service — pide reseña 2h después de completar el turno
// Vercel Cron cada 30 minutos
export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now     = new Date();
  // Turnos que terminaron entre 1:45h y 2:15h atrás
  const fromEnd = new Date(now.getTime() - 2.25 * 60 * 60 * 1000);
  const toEnd   = new Date(now.getTime() - 1.75 * 60 * 60 * 1000);

  const appts = await prisma.appointment.findMany({
    where: {
      status:             "COMPLETED",
      endsAt:             { gte: fromEnd, lte: toEnd },
      reviewRequestSentAt: null,
    },
    include: {
      client:    true,
      barber:    { include: { user: { select: { name: true } } } },
      barbershop: true,
      services:  { include: { service: { select: { name: true } } } },
    },
  });

  let sent = 0;
  for (const appt of appts) {
    if (!appt.client.email) continue;
    try {
      await sendReviewRequest({
        clientName:     appt.client.name,
        clientEmail:    appt.client.email,
        barbershopName: appt.barbershop.name,
        barbershopId:   appt.barbershop.id,
        barbershopSlug: appt.barbershop.slug,
        barberName:     appt.barber.user.name,
        serviceName:    appt.services.map(s => s.service.name).join(", "),
        appointmentId:  appt.id,
      });
      await prisma.appointment.update({
        where: { id: appt.id },
        data:  { reviewRequestSentAt: new Date() },
      });
      sent++;
    } catch (e) { console.error("[cron/post-service] error", e); }
  }

  return NextResponse.json({ ok: true, sent });
}
