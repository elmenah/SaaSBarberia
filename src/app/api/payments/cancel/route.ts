import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cancelMpSubscription } from "@/lib/mercadopago";
import { NextResponse } from "next/server";

/**
 * POST /api/payments/cancel
 * Cancela la suscripción activa en MercadoPago.
 */
export async function POST() {
  const session = await requireAuth();
  if (!session?.barbershop) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { barbershop } = session;

  const settings     = (barbershop.settings as Record<string, unknown>) ?? {};
  const mpData       = (settings.mp as Record<string, string> | undefined) ?? {};
  const subscriptionId = mpData.subscriptionId;

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "No tenés una suscripción activa registrada." },
      { status: 400 }
    );
  }

  try {
    await cancelMpSubscription(subscriptionId);

    await prisma.barbershop.update({
      where: { id: barbershop.id },
      data: {
        subscriptionStatus: "CANCELLED",
        settings: {
          ...settings,
          mp: {
            ...mpData,
            cancelledAt: new Date().toISOString(),
          },
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[payments/cancel] Error:", err);
    return NextResponse.json(
      { error: "Error al cancelar la suscripción. Intentá más tarde." },
      { status: 500 }
    );
  }
}
