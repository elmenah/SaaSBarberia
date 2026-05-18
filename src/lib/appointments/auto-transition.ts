import { prisma } from "@/lib/prisma";

/**
 * Auto-transiciona appointments según la hora actual:
 *
 *  PENDING / CONFIRMED  →  IN_PROGRESS   cuando: startsAt <= now < endsAt
 *  PENDING / CONFIRMED / IN_PROGRESS → COMPLETED  cuando: endsAt <= now
 *
 * Al completar, actualiza totalVisits, totalSpent y lastVisitAt del cliente.
 * Devuelve cuántos registros se afectaron.
 */
export async function runAutoTransition(barbershopId?: string): Promise<{
  inProgress: number;
  completed: number;
}> {
  const now = new Date();

  const shopFilter = barbershopId ? { barbershopId } : {};

  /* ── 1. Pasar a IN_PROGRESS ─────────────────────────────────────────────── */
  const { count: inProgress } = await prisma.appointment.updateMany({
    where: {
      ...shopFilter,
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { lte: now },
      endsAt:   { gt:  now },
    },
    data: { status: "IN_PROGRESS" },
  });

  /* ── 2. Pasar a COMPLETED ───────────────────────────────────────────────── */
  // Buscar primero para actualizar stats de cliente
  const toComplete = await prisma.appointment.findMany({
    where: {
      ...shopFilter,
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      endsAt: { lte: now },
    },
    select: { id: true, clientId: true, totalPrice: true, startsAt: true },
  });

  if (toComplete.length > 0) {
    // Marcar COMPLETED en batch
    await prisma.appointment.updateMany({
      where: { id: { in: toComplete.map((a) => a.id) } },
      data: { status: "COMPLETED" },
    });

    // Actualizar stats de cada cliente usando la fecha REAL del turno (startsAt)
    await Promise.all(
      toComplete.map((a) =>
        prisma.client.update({
          where: { id: a.clientId },
          data: {
            totalVisits: { increment: 1 },
            totalSpent:  { increment: Number(a.totalPrice) },
            lastVisitAt: a.startsAt, // fecha real del turno, no "ahora"
          },
        }).catch(() => {})
      )
    );
  }

  return { inProgress, completed: toComplete.length };
}
