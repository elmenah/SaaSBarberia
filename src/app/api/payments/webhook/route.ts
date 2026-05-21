import { prisma } from "@/lib/prisma";
import { mpPreApproval, verifyMpSignature, type PlanKey, PLANS } from "@/lib/mercadopago";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit, getClientIp, rateLimitResponse, WEBHOOK_LIMIT } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payments/webhook
 * Recibe eventos de MercadoPago (IPN + Webhooks).
 * Configurar en MP Dashboard → Notificaciones → URL: https://yourapp.com/api/payments/webhook
 */
export async function POST(req: NextRequest) {
  // ── Rate limit ────────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rl = rateLimit(`mp-webhook:${ip}`, WEBHOOK_LIMIT.limit, WEBHOOK_LIMIT.windowMs);
  if (!rl.success) return rateLimitResponse(rl.retryAfter) as NextResponse;

  // ── 1. Leer headers de firma ─────────────────────────────────────────────
  const xSignature  = req.headers.get("x-signature");
  const xRequestId  = req.headers.get("x-request-id");

  // ── 2. Parsear body ──────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    // MP a veces envía form-urlencoded para IPN
    const text = await req.text().catch(() => "");
    const params = new URLSearchParams(text);
    body = { topic: params.get("topic"), id: params.get("id") };
  }

  const topic  = (body.topic  ?? body.type) as string | undefined;
  const dataId = (body.id     ?? (body.data as Record<string,unknown>)?.id) as string | undefined;

  if (!dataId) {
    return NextResponse.json({ received: true });
  }

  // ── 3. Verificar firma (si está configurado el secret) ───────────────────
  if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    const valid = verifyMpSignature(xSignature, xRequestId, String(dataId));
    if (!valid) {
      console.warn("[mp/webhook] Firma inválida — ignorando evento");
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
  }

  // ── 4. Solo procesar eventos de suscripciones ────────────────────────────
  if (topic !== "preapproval" && topic !== "subscription_preapproval") {
    return NextResponse.json({ received: true });
  }

  try {
    // ── 5. Obtener detalles de la suscripción desde MP ───────────────────
    const preapproval = await mpPreApproval.get({ id: String(dataId) });

    const status            = preapproval.status;
    const externalReference = preapproval.external_reference ?? "";
    const mpSubscriptionId  = preapproval.id;

    // external_reference = "barbershopId:PLANKEY"
    const [barbershopId, planKeyRaw] = externalReference.split(":");
    const planKey = planKeyRaw as PlanKey;

    if (!barbershopId || !planKey || !PLANS[planKey]) {
      console.error("[mp/webhook] external_reference inválida:", externalReference);
      return NextResponse.json({ received: true });
    }

    // ── 6. Buscar la barbería ────────────────────────────────────────────
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
    });

    if (!barbershop) {
      console.error("[mp/webhook] Barbería no encontrada:", barbershopId);
      return NextResponse.json({ received: true });
    }

    const currentSettings = (barbershop.settings as Record<string, unknown>) ?? {};
    const mpData          = (currentSettings.mp as Record<string, string> | undefined) ?? {};

    // ── 7. Procesar según estado ─────────────────────────────────────────
    if (status === "authorized") {
      // Suscripción activada / renovada
      await prisma.barbershop.update({
        where: { id: barbershopId },
        data: {
          subscriptionPlan:   planKey,
          subscriptionStatus: "ACTIVE",
          settings: {
            ...currentSettings,
            mp: {
              ...mpData,
              subscriptionId:        mpSubscriptionId,
              pendingSubscriptionId: null,
              pendingPlan:           null,
              activatedAt:           new Date().toISOString(),
            },
          },
        },
      });

      console.info(`[mp/webhook] Suscripción ACTIVA: ${barbershopId} → ${planKey}`);

      writeAuditLog({
        barbershopId,
        userId:   barbershop.ownerId,
        action:   "PLAN_ACTIVATED",
        entity:   "Barbershop",
        entityId: barbershopId,
        after:    { plan: planKey, mpSubscriptionId, activatedAt: new Date().toISOString() },
      });

    } else if (status === "cancelled") {
      // Suscripción cancelada
      await prisma.barbershop.update({
        where: { id: barbershopId },
        data: {
          subscriptionStatus: "CANCELLED",
          settings: {
            ...currentSettings,
            mp: {
              ...mpData,
              subscriptionId: mpSubscriptionId,
              cancelledAt:    new Date().toISOString(),
            },
          },
        },
      });

      console.info(`[mp/webhook] Suscripción CANCELADA: ${barbershopId}`);

      writeAuditLog({
        barbershopId,
        userId:   barbershop.ownerId,
        action:   "PLAN_CANCELLED",
        entity:   "Barbershop",
        entityId: barbershopId,
        after:    { cancelledAt: new Date().toISOString() },
      });

    } else if (status === "paused") {
      await prisma.barbershop.update({
        where: { id: barbershopId },
        data: { subscriptionStatus: "PAUSED" },
      });

    } else if (status === "past_due" || status === "rejected") {
      await prisma.barbershop.update({
        where: { id: barbershopId },
        data: { subscriptionStatus: "PAST_DUE" },
      });
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("[mp/webhook] Error procesando evento:", err);
    // Devolvemos 200 igual para que MP no reintente indefinidamente
    return NextResponse.json({ received: true });
  }
}
