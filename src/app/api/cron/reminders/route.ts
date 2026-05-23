import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderToClient } from "@/lib/email/send-appointment-emails";
import { notifyReminder } from "@/lib/n8n/webhooks";

// GET /api/cron/reminders — envía recordatorios 24h y 1h antes del turno
// Ejecutado por Vercel Cron cada 30 minutos
export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // ── Recordatorio 24 horas ──────────────────────────────────────────────────
  // Busca turnos que empiecen entre 23:45h y 24:15h desde ahora
  const from24 = new Date(now.getTime() + 23.75 * 60 * 60 * 1000);
  const to24   = new Date(now.getTime() + 24.25 * 60 * 60 * 1000);

  const appts24 = await prisma.appointment.findMany({
    where: {
      startsAt:         { gte: from24, lte: to24 },
      status:           { in: ["PENDING", "CONFIRMED"] },
      reminder24hSentAt: null,
    },
    include: {
      client:    true,
      barber:    { include: { user: { select: { name: true } } } },
      barbershop: true,
      services:  { include: { service: { select: { name: true } } } },
    },
  });

  let sent24 = 0;
  for (const appt of appts24) {
    const serviceNames = appt.services.map(s => s.service.name).join(", ");
    try {
      await Promise.allSettled([
        // Email (solo si tiene email)
        appt.client.email
          ? sendReminderToClient({
              clientName:       appt.client.name,
              clientEmail:      appt.client.email,
              clientPhone:      appt.client.phone,
              barbershopName:   appt.barbershop.name,
              barbershopEmail:  appt.barbershop.email,
              barbershopAddress: appt.barbershop.address,
              barberName:       appt.barber.user.name,
              serviceName:      serviceNames,
              startsAt:         appt.startsAt,
              totalPrice:       Number(appt.totalPrice),
              slug:             appt.barbershop.slug,
              appointmentId:    appt.id,
              hoursAhead:       24,
            })
          : Promise.resolve(),
        // WhatsApp via n8n (siempre, solo necesita teléfono)
        notifyReminder({
          barbershopId:    appt.barbershopId,
          barbershopName:  appt.barbershop.name,
          barbershopPhone: appt.barbershop.phone,
          appointmentId:   appt.id,
          clientName:      appt.client.name,
          clientPhone:     appt.client.phone,
          barberName:      appt.barber.user.name,
          serviceName:     serviceNames,
          startsAt:        appt.startsAt,
          totalPrice:      Number(appt.totalPrice),
          hoursAhead:      24,
        }),
      ]);
      await prisma.appointment.update({
        where: { id: appt.id },
        data:  { reminder24hSentAt: new Date() },
      });
      sent24++;
    } catch (e) { console.error("[cron/reminders] 24h error", e); }
  }

  // ── Recordatorio 1 hora ───────────────────────────────────────────────────
  const from1 = new Date(now.getTime() + 45 * 60 * 1000);
  const to1   = new Date(now.getTime() + 75 * 60 * 1000);

  const appts1 = await prisma.appointment.findMany({
    where: {
      startsAt:        { gte: from1, lte: to1 },
      status:          { in: ["PENDING", "CONFIRMED"] },
      reminder1hSentAt: null,
    },
    include: {
      client:    true,
      barber:    { include: { user: { select: { name: true } } } },
      barbershop: true,
      services:  { include: { service: { select: { name: true } } } },
    },
  });

  let sent1 = 0;
  for (const appt of appts1) {
    const serviceNames = appt.services.map(s => s.service.name).join(", ");
    try {
      await Promise.allSettled([
        // Email (solo si tiene email)
        appt.client.email
          ? sendReminderToClient({
              clientName:       appt.client.name,
              clientEmail:      appt.client.email,
              clientPhone:      appt.client.phone,
              barbershopName:   appt.barbershop.name,
              barbershopEmail:  appt.barbershop.email,
              barbershopAddress: appt.barbershop.address,
              barberName:       appt.barber.user.name,
              serviceName:      serviceNames,
              startsAt:         appt.startsAt,
              totalPrice:       Number(appt.totalPrice),
              slug:             appt.barbershop.slug,
              appointmentId:    appt.id,
              hoursAhead:       1,
            })
          : Promise.resolve(),
        // WhatsApp via n8n con links de confirmar/cancelar
        notifyReminder({
          barbershopId:    appt.barbershopId,
          barbershopName:  appt.barbershop.name,
          barbershopPhone: appt.barbershop.phone,
          appointmentId:   appt.id,
          clientName:      appt.client.name,
          clientPhone:     appt.client.phone,
          barberName:      appt.barber.user.name,
          serviceName:     serviceNames,
          startsAt:        appt.startsAt,
          totalPrice:      Number(appt.totalPrice),
          hoursAhead:      1,
        }),
      ]);
      await prisma.appointment.update({
        where: { id: appt.id },
        data:  { reminder1hSentAt: new Date() },
      });
      sent1++;
    } catch (e) { console.error("[cron/reminders] 1h error", e); }
  }

  return NextResponse.json({ ok: true, sent24, sent1 });
}
