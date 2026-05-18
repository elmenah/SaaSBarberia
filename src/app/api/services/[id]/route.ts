import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateSchema = z.object({
  name:         z.string().min(2).optional(),
  description:  z.string().optional(),
  price:        z.number().positive().optional(),
  durationMins: z.number().int().positive().optional(),
  category:     z.string().optional(),
  isActive:     z.boolean().optional(),
  sortOrder:    z.number().int().optional(),
});

// PATCH /api/services/[id]
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

  const service = await prisma.service.findFirst({
    where: { id, barbershopId: session.barbershop.id },
  });
  if (!service) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });

  const updated = await prisma.service.update({
    where: { id },
    data:  parse.data,
  });

  return NextResponse.json({ data: updated });
}

// DELETE /api/services/[id] — desactiva en vez de eliminar (puede tener historial)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session?.barbershop) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const service = await prisma.service.findFirst({
    where: { id, barbershopId: session.barbershop.id },
  });
  if (!service) return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });

  await prisma.service.update({ where: { id }, data: { isActive: false } });

  return NextResponse.json({ ok: true });
}
