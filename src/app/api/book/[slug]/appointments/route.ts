import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewAppointment } from "@/lib/n8n/webhooks";
import { sendNewAppointmentEmails } from "@/lib/email/send-appointment-emails";
import { rateLimit, getClientIp, rateLimitResponse, BOOK_LIMIT } from "@/lib/rate-limit";
import { z } from "zod";

const BookSchema = z.object({
  barberId:    z.string().uuid(),
  serviceIds:  z.array(z.string().uuid()).min(1),
  startsAt:    z.string().datetime(),
  clientName:  z.string().min(2),
  clientPhone: z.string().min(6),
  clientEmail: z.string().email().optional().nullable(),
});

// POST /api/book/[slug]/appointments — crear turno desde la página pública
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // ── Rate limit: 10 reservas por minuto por IP ──────────────────────────────
  const ip = getClientIp(request);
  const rl = rateLimit(`book:${ip}`, BOOK_LIMIT.limit, BOOK_LIMIT.windowMs);
  if (!rl.success) return rateLimitResponse(rl.retryAfter) as NextResponse;

  const barbershop = await prisma.barbershop.findUnique({
    where: { slug },
    select: { id: true, name: true, phone: true, address: true, email: true },
  });

  if (!barbershop) {
    return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });
  }

  const body  = await request.json();
  const parse = BookSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });
  }

  const { barberId, serviceIds, startsAt, clientName, clientPhone, clientEmail } = parse.data;

  // Verificar que el barbero pertenece a la barbería
  const barber = await prisma.barber.findFirst({
    where: { id: barberId, barbershopId: barbershop.id, isActive: true },
    include: { user: { select: { name: true } } },
  });
  if (!barber) {
    return NextResponse.json({ error: "Barbero no disponible" }, { status: 400 });
  }

  // Obtener servicios y calcular totales
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, barbershopId: barbershop.id, isActive: true },
  });
  if (services.length !== serviceIds.length) {
    return NextResponse.json({ error: "Uno o más servicios no son válidos" }, { status: 400 });
  }

  const totalPrice    = services.reduce((sum, s) => sum + Number(s.price), 0);
  const totalDuration = services.reduce((sum, s) => sum + s.durationMins, 0);
  const startsAtDate  = new Date(startsAt);
  const endsAt        = new Date(startsAtDate.getTime() + totalDuration * 60_000);

  // Verificar conflicto de horario del barbero
  const conflict = await prisma.appointment.findFirst({
    where: {
      barberId,
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      OR: [{ startsAt: { lt: endsAt }, endsAt: { gt: startsAtDate } }],
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "Ese horario ya no está disponible. Elegí otro." }, { status: 409 });
  }

  // Buscar cliente existente por teléfono en esta barbería, o crear uno nuevo
  const phone = clientPhone.trim().replace(/\s+/g, "");
  let client = await prisma.client.findFirst({
    where: { phone, barbershopId: barbershop.id },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        name:        clientName.trim(),
        phone,
        email:       clientEmail ?? null,
        barbershopId: barbershop.id,
      },
    });
  } else if (clientEmail && !client.email) {
    // Cliente existente sin email → actualizar con el que acaba de proveer
    client = await prisma.client.update({
      where: { id: client.id },
      data:  { email: clientEmail },
    });
  }

  // Crear la cita
  const appointment = await prisma.appointment.create({
    data: {
      barbershopId: barbershop.id,
      clientId:     client.id,
      barberId,
      startsAt:     startsAtDate,
      endsAt,
      totalPrice,
      totalDuration,
      source:       "web",
      status:       "PENDING",
      services: {
        create: services.map((s) => ({
          serviceId:   s.id,
          price:       s.price,
          durationMins: s.durationMins,
        })),
      },
    },
    include: {
      client:   true,
      barber:   { include: { user: { select: { name: true } } } },
      services: { include: { service: { select: { name: true } } } },
    },
  });

  const serviceNames = services.map((s) => s.name).join(", ");

  // Disparar webhook n8n (no bloquea la respuesta)
  notifyNewAppointment({
    barbershopId:   barbershop.id,
    barbershopName: barbershop.name,
    appointmentId:  appointment.id,
    clientName:     client.name,
    clientPhone:    client.phone,
    barberName:     barber.user.name,
    serviceName:    serviceNames,
    startsAt:       startsAtDate,
    totalPrice,
  }).catch(console.error);

  // Enviar emails de confirmación (no bloquea la respuesta)
  // Prioridad de email del cliente: DB (ya actualizado) > formulario > null
  const emailForClient = client.email ?? clientEmail ?? null;
  sendNewAppointmentEmails({
    clientName:        client.name,
    clientEmail:       emailForClient,
    clientPhone:       client.phone,
    barbershopName:    barbershop.name,
    barbershopEmail:   barbershop.email,
    barbershopAddress: barbershop.address,
    barberName:        barber.user.name,
    serviceName:       serviceNames,
    startsAt:          startsAtDate,
    totalPrice,
    slug,
    source:            "web",
  }).catch(console.error);

  return NextResponse.json({ data: appointment }, { status: 201 });
}
