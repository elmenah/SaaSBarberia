import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type Cert = { id: string; name: string; issuer: string; year: string };

const UpdateSchema = z.object({
  name:           z.string().min(2).optional(),
  specialty:      z.string().optional(),
  phone:          z.string().optional(),
  colorTag:       z.string().optional(),
  bio:            z.string().optional(),
  isActive:       z.boolean().optional(),
  certifications: z.array(z.object({
    id:     z.string(),
    name:   z.string(),
    issuer: z.string(),
    year:   z.string(),
  })).optional(),
});

// PATCH /api/barbers/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireOwner();
  if (!session) return NextResponse.json({ error: "Solo el propietario puede realizar esta acción." }, { status: 403 });

  const { id } = await params;
  const body  = await request.json();
  const parse = UpdateSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });

  // Verificar que el barbero pertenece a esta barbería
  const barber = await prisma.barber.findFirst({
    where: { id, barbershopId: session.barbershop.id },
  });
  if (!barber) return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });

  const { name, specialty, phone, colorTag, bio, isActive, certifications } = parse.data;

  // Actualizar User si vienen datos de nombre/teléfono
  if (name || phone) {
    await prisma.user.update({
      where: { id: barber.userId },
      data: { ...(name && { name }), ...(phone && { phone }) },
    });
  }

  const updated = await prisma.barber.update({
    where: { id },
    data: {
      ...(specialty      !== undefined && specialty !== "" && { specialties: [specialty] }),
      ...(colorTag       && { colorTag }),
      ...(bio            !== undefined && { bio }),
      ...(isActive       !== undefined && { isActive }),
      ...(certifications !== undefined && { certifications }),
    },
    include: { user: true },
  });

  return NextResponse.json({ data: updated });
}

// DELETE /api/barbers/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireOwner();
  if (!session) return NextResponse.json({ error: "Solo el propietario puede realizar esta acción." }, { status: 403 });

  const { id } = await params;

  const barber = await prisma.barber.findFirst({
    where:   { id, barbershopId: session.barbershop.id },
    include: { user: true },
  });
  if (!barber) return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });

  const supabaseAdmin = createAdminClient();

  // Borrar en cascada manual (appointments no tiene onDelete:Cascade en barberId)
  await prisma.$transaction([
    // 1. appointment_services de los turnos de este barbero
    prisma.appointmentService.deleteMany({
      where: { appointment: { barberId: id } },
    }),
    // 2. automation_logs de esos turnos
    prisma.automationLog.deleteMany({
      where: { appointment: { barberId: id } },
    }),
    // 3. appointments del barbero
    prisma.appointment.deleteMany({ where: { barberId: id } }),
    // 4. audit_logs del user del barbero
    prisma.auditLog.deleteMany({ where: { userId: barber.userId } }),
    // 5. push_subscriptions del user
    prisma.pushSubscription.deleteMany({ where: { userId: barber.userId } }),
    // 6. el barber (cascade borra barber_services)
    prisma.barber.delete({ where: { id } }),
    // 7. el user de la DB (solo si no es el owner de alguna barbería)
    prisma.user.deleteMany({
      where: {
        id:              barber.userId,
        ownedBarbershops: { none: {} }, // no es dueño de ninguna barbería
      },
    }),
  ]);

  // Eliminar de Supabase Auth (con o sin placeholder — puede tener cuenta pendiente)
  const supabaseId = barber.user.supabaseId;
  if (supabaseId.startsWith("placeholder-")) {
    // Buscar por email en Supabase Auth (invitación pendiente)
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users.find((u) => u.email === barber.user.email);
    if (authUser) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id).catch(console.error);
    }
  } else {
    // Cuenta ya activada — borrar directamente por supabaseId
    await supabaseAdmin.auth.admin.deleteUser(supabaseId).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
