import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const SyncSchema = z.object({
  serviceIds: z.array(z.string().uuid()),
});

// PUT /api/barbers/me/services — sincroniza los servicios del barbero
// Recibe { serviceIds: string[] } y reemplaza las asignaciones actuales
export async function PUT(request: Request) {
  const session = await requireAuth();
  if (!session?.dbUser || !session?.barbershop) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const barber = await prisma.barber.findFirst({
    where: {
      userId:       session.dbUser.id,
      barbershopId: session.barbershop.id,
    },
  });

  if (!barber) {
    return NextResponse.json({ error: "No tenés perfil de barbero" }, { status: 404 });
  }

  const body  = await request.json();
  const parse = SyncSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });
  }

  const { serviceIds } = parse.data;

  // Verificar que todos los serviceIds pertenecen a la misma barbería (seguridad multi-tenant)
  if (serviceIds.length > 0) {
    const count = await prisma.service.count({
      where: { id: { in: serviceIds }, barbershopId: session.barbershop.id },
    });
    if (count !== serviceIds.length) {
      return NextResponse.json({ error: "Algunos servicios no son válidos" }, { status: 422 });
    }
  }

  // Sincronizar: borrar los actuales y crear los nuevos en una transacción
  await prisma.$transaction([
    prisma.barberService.deleteMany({ where: { barberId: barber.id } }),
    ...(serviceIds.length > 0
      ? [prisma.barberService.createMany({
          data: serviceIds.map((serviceId) => ({ barberId: barber.id, serviceId })),
          skipDuplicates: true,
        })]
      : []),
  ]);

  return NextResponse.json({ ok: true, count: serviceIds.length });
}
