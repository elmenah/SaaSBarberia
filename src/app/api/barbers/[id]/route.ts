import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
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
  const session = await requireAuth();
  if (!session?.barbershop) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
  const session = await requireAuth();
  if (!session?.barbershop) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const barber = await prisma.barber.findFirst({
    where: { id, barbershopId: session.barbershop.id },
  });
  if (!barber) return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });

  await prisma.barber.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
