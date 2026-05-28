import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notifyCancelledAppointment } from "@/lib/n8n/webhooks";
import { sendCancellationToClient } from "@/lib/email/send-appointment-emails";
import { z } from "zod";

// Campos que solo el dueño puede modificar
const OwnerOnlySchema = z.object({
  status:        z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  cancelReason:  z.string().optional(),
  notes:         z.string().optional(),
  internalNotes: z.string().optional(),
  paidAmount:    z.number().positive().optional(),
});

// Campos que el barbero puede modificar (solo sus turnos, solo estado limitado)
const BarberSchema = z.object({
  status:       z.enum(["IN_PROGRESS", "COMPLETED", "NO_SHOW"]).optional(),
  notes:        z.string().optional(),
});

// PATCH /api/appointments/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const isBarber = user.user_metadata?.role === "BARBER";

  // Validar según rol
  const parse = isBarber
    ? BarberSchema.safeParse(body)
    : OwnerOnlySchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });
  }

  const existing = await prisma.appointment.findUnique({
    where:   { id },
    include: {
      client:    true,
      barbershop: true,
      barber:    { include: { user: { select: { name: true } } } },
      services:  { include: { service: { select: { name: true } } } },
    },
  });

  if (!existing) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  // Barbero solo puede modificar SUS propios turnos
  if (isBarber) {
    const dbUser = await prisma.user.findUnique({
      where:   { supabaseId: user.id },
      include: { barberProfile: true },
    });
    if (!dbUser?.barberProfile || dbUser.barberProfile.id !== existing.barberId) {
      return NextResponse.json({ error: "Solo puedes modificar tus propios turnos." }, { status: 403 });
    }
  } else {
    // Owner: verificar que el turno pertenece a su barbería
    const dbUser = await prisma.user.findUnique({
      where:   { supabaseId: user.id },
      include: { ownedBarbershops: true },
    });
    const owns = dbUser?.ownedBarbershops.some(b => b.id === existing.barbershopId);
    if (!owns) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { paidAmount, ...restData } = (parse.data as z.infer<typeof OwnerOnlySchema>);
  const updateData: Record<string, unknown> = { ...restData };

  if (parse.data.status === "CONFIRMED") updateData.confirmedAt = new Date();
  if (parse.data.status === "CANCELLED") updateData.cancelledAt = new Date();

  // Transición a COMPLETED → actualizar stats del cliente
  if (parse.data.status === "COMPLETED" && existing.status !== "COMPLETED") {
    const amountCharged = paidAmount ?? Number(existing.totalPrice);
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
    await prisma.client.update({
      where: { id: existing.clientId },
      data: {
        totalVisits: { increment: 1 },
        totalSpent:  { increment: amountCharged },
        lastVisitAt: existing.startsAt,
      },
    });
  }

  // Ajuste de paidAmount en turno ya COMPLETADO
  if (!isBarber && paidAmount !== undefined && existing.status === "COMPLETED" && parse.data.status === undefined) {
    updateData.paidAmount = paidAmount;
    const oldAmount = Number((existing as { paidAmount?: number | null }).paidAmount ?? existing.totalPrice);
    const diff = paidAmount - oldAmount;
    if (diff !== 0) {
      await prisma.client.update({
        where: { id: existing.clientId },
        data:  { totalSpent: { increment: diff } },
      });
    }
  }

  const updated = await prisma.appointment.update({
    where:   { id },
    data:    updateData,
    include: {
      client:   true,
      barber:   { include: { user: true } },
      services: { include: { service: true } },
    },
  });

  // Notificar cancelación (solo dueño puede cancelar)
  if (!isBarber && parse.data.status === "CANCELLED") {
    const serviceNames = existing.services.map((s) => s.service.name).join(", ");
    notifyCancelledAppointment({
      barbershopId:   existing.barbershopId,
      barbershopName: existing.barbershop.name,
      appointmentId:  id,
      clientName:     existing.client.name,
      clientPhone:    existing.client.phone,
      startsAt:       existing.startsAt,
      cancelReason:   (parse.data as z.infer<typeof OwnerOnlySchema>).cancelReason,
    }).catch(console.error);
    sendCancellationToClient({
      clientName:      existing.client.name,
      clientEmail:     existing.client.email,
      clientPhone:     existing.client.phone,
      barbershopName:  existing.barbershop.name,
      barbershopEmail: existing.barbershop.email,
      barberName:      existing.barber.user.name,
      serviceName:     serviceNames,
      startsAt:        existing.startsAt,
      totalPrice:      Number(existing.totalPrice),
      cancelReason:    (parse.data as z.infer<typeof OwnerOnlySchema>).cancelReason,
    }).catch(console.error);
  }

  return NextResponse.json({ data: updated });
}

// DELETE /api/appointments/[id] — solo dueños
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.user_metadata?.role === "BARBER") {
    return NextResponse.json({ error: "Solo el propietario puede eliminar reservas." }, { status: 403 });
  }

  const { id } = await params;

  // Si el turno estaba COMPLETADO, revertir stats del cliente
  const appt = await prisma.appointment.findUnique({
    where:   { id },
    select:  { status: true, clientId: true, totalPrice: true, paidAmount: true, startsAt: true, barbershopId: true },
  });

  // ── Seguridad: verificar ownership antes de eliminar ───────────────────────
  if (appt) {
    const dbUserDel = await prisma.user.findUnique({
      where:   { supabaseId: user.id },
      include: { ownedBarbershops: { select: { id: true } } },
    });
    const ownsAppt = dbUserDel?.ownedBarbershops.some(b => b.id === appt.barbershopId);
    if (!ownsAppt) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (appt?.status === "COMPLETED") {
    const charged = Number(appt.paidAmount ?? appt.totalPrice);
    // Decrementar contadores del cliente
    const client = await prisma.client.findUnique({ where: { id: appt.clientId } });
    if (client) {
      await prisma.client.update({
        where: { id: appt.clientId },
        data: {
          totalVisits: Math.max(0, client.totalVisits - 1),
          totalSpent:  Math.max(0, Number(client.totalSpent) - charged),
        },
      });
    }
  }

  await prisma.appointmentService.deleteMany({ where: { appointmentId: id } });
  await prisma.automationLog.deleteMany({ where: { appointmentId: id } });
  await prisma.appointment.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}
