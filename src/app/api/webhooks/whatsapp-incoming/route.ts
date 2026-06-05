import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToBarbershop } from "@/lib/push";
import { notifyCancelledAppointment } from "@/lib/n8n/webhooks";
import { sendCancellationToClient } from "@/lib/email/send-appointment-emails";

/**
 * POST /api/webhooks/whatsapp-incoming
 *
 * Llamado desde n8n cuando un cliente responde un mensaje de WhatsApp.
 * El workflow de n8n escucha eventos de Evolution API (incoming messages),
 * filtra los que son "CANCELAR" o "CONFIRMAR" y llama a este endpoint.
 *
 * Body esperado:
 * {
 *   phone:   "56912345678",    // número sin + ni espacios
 *   message: "CANCELAR",      // texto que envió el cliente (se normaliza)
 *   secret:  "xxx"            // debe coincidir con N8N_API_KEY
 * }
 */
export async function POST(request: NextRequest) {
  let body: { phone?: string; message?: string; secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  // Validar secreto compartido con n8n (N8N_INTERNAL_SECRET)
  if (body.secret !== process.env.N8N_INTERNAL_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const phone   = (body.phone   ?? "").replace(/[^0-9]/g, "");
  const message = (body.message ?? "").trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  if (!phone || !message) {
    return NextResponse.json({ error: "phone y message son requeridos" }, { status: 400 });
  }

  const isCancel  = message.includes("CANCELAR") || message === "CANCEL" || message === "NO";
  const isConfirm = message.includes("CONFIRMAR") || message === "SI" || message === "SÍ" || message === "OK";

  if (!isCancel && !isConfirm) {
    // Mensaje que no es una acción → ignorar silenciosamente
    return NextResponse.json({ ok: true, action: "ignored" });
  }

  // Buscar el turno más próximo PENDIENTE o CONFIRMADO para ese teléfono
  const client = await prisma.client.findFirst({
    where: { phone },
  });

  if (!client) {
    return NextResponse.json({ ok: true, action: "client_not_found" });
  }

  const now = new Date();
  const appointment = await prisma.appointment.findFirst({
    where: {
      clientId: client.id,
      status:   { in: ["PENDING", "CONFIRMED"] },
      startsAt: { gte: now },
    },
    include: {
      barbershop: true,
      barber:     { include: { user: { select: { name: true } } } },
      services:   { include: { service: { select: { name: true } } } },
    },
    orderBy: { startsAt: "asc" }, // el más próximo primero
  });

  if (!appointment) {
    return NextResponse.json({ ok: true, action: "no_upcoming_appointment" });
  }

  const serviceNames = appointment.services.map((s) => s.service.name).join(", ");

  if (isCancel) {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status:       "CANCELLED",
        cancelReason: "Cancelado por el cliente vía WhatsApp",
        cancelledAt:  new Date(),
      },
    });

    // Push al dueño
    sendPushToBarbershop(appointment.barbershopId, {
      title: `❌ Cancelación WhatsApp — ${client.name}`,
      body:  `${serviceNames} · ${appointment.barber.user.name} fue cancelado por el cliente`,
      url:   "/dashboard/reservas",
      tag:   `cancel-wa-${appointment.id}`,
    }).catch(console.error);

    // Email al cliente
    sendCancellationToClient({
      clientName:      client.name,
      clientEmail:     client.email,
      clientPhone:     client.phone,
      barbershopName:  appointment.barbershop.name,
      barbershopEmail: appointment.barbershop.email,
      barbershopAddress: appointment.barbershop.address,
      barberName:      appointment.barber.user.name,
      serviceName:     serviceNames,
      startsAt:        appointment.startsAt,
      totalPrice:      Number(appointment.totalPrice),
      slug:            appointment.barbershop.slug,
      cancelReason:    "Cancelado por el cliente vía WhatsApp",
    }).catch(console.error);

    // WhatsApp al cliente confirmando la baja
    notifyCancelledAppointment({
      barbershopId:   appointment.barbershopId,
      barbershopName: appointment.barbershop.name,
      appointmentId:  appointment.id,
      clientName:     client.name,
      clientPhone:    client.phone,
      barberName:     appointment.barber.user.name,
      startsAt:       appointment.startsAt,
      cancelReason:   "Cancelado por el cliente vía WhatsApp",
    }).catch(console.error);

    return NextResponse.json({ ok: true, action: "cancelled", appointmentId: appointment.id });
  }

  if (isConfirm) {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CONFIRMED" },
    });

    // Push al dueño
    sendPushToBarbershop(appointment.barbershopId, {
      title: `✅ Confirmado vía WhatsApp — ${client.name}`,
      body:  `${serviceNames} · ${appointment.barber.user.name}`,
      url:   "/dashboard/reservas",
      tag:   `confirm-wa-${appointment.id}`,
    }).catch(console.error);

    return NextResponse.json({ ok: true, action: "confirmed", appointmentId: appointment.id });
  }

  return NextResponse.json({ ok: true, action: "ignored" });
}
