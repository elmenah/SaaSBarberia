import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createMpSubscription, PLANS, type PlanKey } from "@/lib/mercadopago";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments/create-subscription
 * Body: { plan: "STARTER" | "PRO" | "ENTERPRISE" }
 * Returns: { init_point } — URL a la que redirigir al usuario
 */
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.barbershop) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const planKey = body.plan as PlanKey;
  if (!planKey || !PLANS[planKey]) {
    return NextResponse.json(
      { error: "Plan inválido. Valores válidos: STARTER, PRO, ENTERPRISE" },
      { status: 400 }
    );
  }

  // Verificar que MP esté configurado
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "Pagos no configurados. Contactá al soporte." },
      { status: 503 }
    );
  }

  const { barbershop, authUser } = session;

  // Si ya tiene una suscripción activa del mismo plan, no crear otra
  const currentSettings = (barbershop.settings as Record<string, unknown>) ?? {};
  const mpData = (currentSettings.mp as Record<string, string> | undefined) ?? {};

  if (
    barbershop.subscriptionPlan === planKey &&
    barbershop.subscriptionStatus === "ACTIVE" &&
    mpData.subscriptionId
  ) {
    return NextResponse.json(
      { error: "Ya tienes este plan activo." },
      { status: 409 }
    );
  }

  const backUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`;

  try {
    const { id: mpSubscriptionId, init_point } = await createMpSubscription({
      planKey,
      payerEmail:     authUser.email ?? "",
      barbershopId:   barbershop.id,
      barbershopName: barbershop.name,
      backUrl,
    });

    // Guardar el intent en settings (pendiente de confirmación)
    await prisma.barbershop.update({
      where: { id: barbershop.id },
      data: {
        settings: {
          ...(currentSettings),
          mp: {
            ...mpData,
            pendingSubscriptionId: mpSubscriptionId,
            pendingPlan:           planKey,
          },
        },
      },
    });

    return NextResponse.json({ init_point });
  } catch (err: unknown) {
    const mpErr = err as { status?: number; message?: string; cause?: unknown };
    console.error("[payments/create-subscription] MP Error:", {
      status:  mpErr?.status,
      message: mpErr?.message,
      cause:   JSON.stringify(mpErr?.cause),
    });

    // Mensaje legible según el error de MP
    const mpMessage = mpErr?.message ?? "";
    let userMessage = "Error al crear la suscripción con MercadoPago.";

    if (mpMessage.includes("not found") || mpMessage.includes("404")) {
      userMessage = "Plan no encontrado en MercadoPago. Verificá la configuración.";
    } else if (mpMessage.includes("unauthorized") || mpMessage.includes("401")) {
      userMessage = "Token de MercadoPago inválido. Verificá MERCADOPAGO_ACCESS_TOKEN en Vercel.";
    } else if (mpMessage.includes("preapproval") || mpMessage.includes("subscription")) {
      userMessage = "Las suscripciones recurrentes no están habilitadas en tu cuenta de MercadoPago. Contactá a soporte de MP.";
    }

    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
