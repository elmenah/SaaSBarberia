import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAppointmentToken } from "@/lib/appointment-token";
import { notifyCancelledAppointment } from "@/lib/n8n/webhooks";
import { sendCancellationToClient } from "@/lib/email/send-appointment-emails";
import { sendPushToBarbershop } from "@/lib/push";

// GET /api/appointments/[id]/cancel-by-client?token=xxx
// Ruta pública — el cliente la abre desde el link del email/WhatsApp
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (!verifyAppointmentToken(id, "cancel", token)) {
    return NextResponse.redirect(`${origin}/appointment-response?status=invalid`);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      barbershop: true,
      client:     true,
      barber:     { include: { user: { select: { name: true } } } },
      services:   { include: { service: { select: { name: true } } } },
    },
  });

  if (!appointment) {
    return NextResponse.redirect(`${origin}/appointment-response?status=not_found`);
  }

  if (appointment.status === "CANCELLED") {
    return NextResponse.redirect(`${origin}/appointment-response?status=already_cancelled`);
  }

  if (appointment.status === "COMPLETED") {
    return NextResponse.redirect(`${origin}/appointment-response?status=already_completed`);
  }

  // Cancelar el turno
  await prisma.appointment.update({
    where: { id },
    data: {
      status:       "CANCELLED",
      cancelReason: "Cancelado por el cliente",
      cancelledAt:  new Date(),
    },
  });

  const serviceNames = appointment.services.map(s => s.service.name).join(", ");

  // Notificar al dueño via push
  sendPushToBarbershop(appointment.barbershopId, {
    title: `❌ Turno cancelado — ${appointment.client.name}`,
    body:  `${serviceNames} · ${appointment.barber.user.name} canceló desde el link del recordatorio`,
    url:   "/dashboard/reservas",
    tag:   `cancel-${id}`,
  }).catch(console.error);

  // WhatsApp al cliente confirmando la cancelación
  notifyCancelledAppointment({
    barbershopId:   appointment.barbershopId,
    barbershopName: appointment.barbershop.name,
    appointmentId:  id,
    clientName:     appointment.client.name,
    clientPhone:    appointment.client.phone,
    barberName:     appointment.barber.user.name,
    startsAt:       appointment.startsAt,
    cancelReason:   "Cancelado por el cliente",
  }).catch(console.error);

  // Email al cliente
  sendCancellationToClient({
    clientName:      appointment.client.name,
    clientEmail:     appointment.client.email,
    clientPhone:     appointment.client.phone,
    barbershopName:  appointment.barbershop.name,
    barbershopEmail: appointment.barbershop.email,
    barbershopAddress: appointment.barbershop.address,
    barberName:      appointment.barber.user.name,
    serviceName:     serviceNames,
    startsAt:        appointment.startsAt,
    totalPrice:      Number(appointment.totalPrice),
    slug:            appointment.barbershop.slug,
    cancelReason:    "Cancelado por el cliente",
  }).catch(console.error);

  const slug = appointment.barbershop?.slug ?? "";
  return NextResponse.redirect(
    `${origin}/appointment-response?status=cancelled&shop=${encodeURIComponent(appointment.barbershop?.name ?? "")}&slug=${slug}`
  );
}
