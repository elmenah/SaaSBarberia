import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateClientSchema = z.object({
  name:     z.string().min(2).optional(),
  phone:    z.string().min(8).optional(),
  email:    z.string().email().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  birthdate:z.string().optional().nullable(),
  notes:    z.string().optional(),
  tags:     z.array(z.string()).optional(),
  isVip:    z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/clients/[id] — perfil completo + historial de citas
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verificar que el cliente pertenece a la barbería del usuario autenticado
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedBarbershops: { take: 1 } },
  });
  if (!dbUser?.ownedBarbershops[0]) {
    return NextResponse.json({ error: "Barbershop not found" }, { status: 404 });
  }

  const barbershopId = dbUser.ownedBarbershops[0].id;

  const client = await prisma.client.findFirst({
    where: { id, barbershopId },
  });

  if (!client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  // Historial de citas (últimas 20, ordenadas por fecha desc)
  const appointments = await prisma.appointment.findMany({
    where: { clientId: id, barbershopId },
    include: {
      barber:   { include: { user: { select: { name: true } } } },
      services: { include: { service: { select: { name: true } } } },
    },
    orderBy: { startsAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ data: { ...client, appointments } });
}

// PATCH /api/clients/[id] — actualizar datos del cliente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body  = await request.json();
  const parse = UpdateClientSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedBarbershops: { take: 1 } },
  });
  if (!dbUser?.ownedBarbershops[0]) {
    return NextResponse.json({ error: "Barbershop not found" }, { status: 404 });
  }

  const barbershopId = dbUser.ownedBarbershops[0].id;

  const existing = await prisma.client.findFirst({ where: { id, barbershopId } });
  if (!existing) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      ...parse.data,
      birthdate: parse.data.birthdate ? new Date(parse.data.birthdate) : parse.data.birthdate,
    },
  });

  return NextResponse.json({ data: updated });
}
