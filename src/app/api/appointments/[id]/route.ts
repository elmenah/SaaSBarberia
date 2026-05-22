import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { notifyCancelledAppointment } from "@/lib/n8n/webhooks";
import { sendCancellationToClient } from "@/lib/email/send-appointment-emails";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  cancelReason: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  paidAmount: z.number().positive().optional(),
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
  const body = await request.json();
  const parse = UpdateSchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });
  }

  const existing = await prisma.appointment.findUnique({
    where: { id },
    include: {
      client:    true,
      barbershop: true,
      barber:    { include: { user: { select: { name: true } } } },
      services:  { include: { service: { select: { name: true } } } },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const { paidAmount, ...restData } = parse.data;
  const updateData: Record<string, unknown> = { ...restData };

  if (parse.data.status === "CONFIRMED") updateData.confirmedAt = new Date();
  if (parse.data.status === "CANCELLED") updateData.cancelledAt = new Date();

  // ── Caso A: transición a COMPLETED (no estaba completada antes)
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

  // ── Caso B: solo actualiza paidAmount en turno ya COMPLETADO (registro de descuento)
  if (paidAmount !== undefined && existing.status === "COMPLETED" && parse.data.status === undefined) {
    updateData.paidAmount = paidAmount;
    // Ajustar totalSpent del cliente: quitar monto anterior, sumar nuevo
    const oldAmount = Number((existing as { paidAmount?: number | null }).paidAmount ?? existing.totalPrice);
    const diff = paidAmount - oldAmount;
    if (diff !== 0) {
      await prisma.client.update({
        where: { id: existing.clientId },
        data: { totalSpent: { increment: diff } },
      });
    }
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      client: true,
      barber: { include: { user: true } },
      services: { include: { service: true } },
    },
  });

  // Notificar cancelación
  if (parse.data.status === "CANCELLED") {
    const serviceNames = existing.services.map((s) => s.service.name).join(", ");

    // Webhook n8n
    notifyCancelledAppointment({
      barbershopId:   existing.barbershopId,
      barbershopName: existing.barbershop.name,
      appointmentId:  id,
      clientName:     existing.client.name,
      clientPhone:    existing.client.phone,
      startsAt:       existing.startsAt,
      cancelReason:   parse.data.cancelReason,
    }).catch(console.error);

    // Email al cliente
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
      cancelReason:    parse.data.cancelReason,
    }).catch(console.error);
  }

  return NextResponse.json({ data: updated });
}

// DELETE /api/appointments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.appointment.delete({ where: { id } });

  return NextResponse.json({ message: "Deleted" });
}
