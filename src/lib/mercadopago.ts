import { MercadoPagoConfig, PreApproval, Payment } from "mercadopago";

// ─── Cliente MP ────────────────────────────────────────────────────────────────

export const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
  options: { timeout: 10_000 },
});

export const mpPreApproval = new PreApproval(mp);
export const mpPayment     = new Payment(mp);

// ─── Definición de planes ──────────────────────────────────────────────────────

export type PlanKey = "STARTER" | "PRO" | "ENTERPRISE";

export type PlanDef = {
  key:              PlanKey;
  name:             string;
  description:      string;
  price:            number;       // en ARS
  currency:         string;
  barbers:          number;
  whatsappPerMonth: number;
  features:         string[];
  highlight?:       boolean;
};

export const PLANS: Record<PlanKey, PlanDef> = {
  STARTER: {
    key:              "STARTER",
    name:             "Individual",
    description:      "Para el barbero que trabaja solo",
    price:            9990,
    currency:         "ARS",
    barbers:          1,
    whatsappPerMonth: 0,
    features: [
      "1 barbero",
      "Reservas online ilimitadas",
      "Notificaciones por email",
      "Gestión de clientes",
      "Perfil público de barbería",
      "Soporte por email",
    ],
  },
  PRO: {
    key:              "PRO",
    name:             "Profesional",
    description:      "Para barberías con equipo",
    price:            24990,
    currency:         "ARS",
    barbers:          7,
    whatsappPerMonth: 130,
    highlight:        true,
    features: [
      "Hasta 7 barberos",
      "130 mensajes WhatsApp/mes",
      "Notificaciones por email",
      "Automatizaciones completas",
      "Recordatorios automáticos",
      "Programa de fidelización",
      "Soporte prioritario",
    ],
  },
  ENTERPRISE: {
    key:              "ENTERPRISE",
    name:             "Enterprise",
    description:      "Para cadenas de barberías",
    price:            49990,
    currency:         "ARS",
    barbers:          10,
    whatsappPerMonth: 500,
    features: [
      "Hasta 10 barberos",
      "500 mensajes WhatsApp/mes",
      "Notificaciones por email",
      "Todo lo del plan Profesional",
      "Reportes avanzados",
      "Onboarding personalizado",
      "Soporte 24/7",
    ],
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Crea la suscripción en MercadoPago y devuelve la URL de pago */
export async function createMpSubscription(args: {
  planKey:          PlanKey;
  payerEmail:       string;
  barbershopId:     string;
  barbershopName:   string;
  backUrl:          string;
}): Promise<{ id: string; init_point: string }> {
  const plan = PLANS[args.planKey];

  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);

  const result = await mpPreApproval.create({
    body: {
      reason:             `${plan.name} — BarberOS`,
      payer_email:        args.payerEmail,
      external_reference: `${args.barbershopId}:${args.planKey}`,
      back_url:           args.backUrl,
      auto_recurring: {
        frequency:          1,
        frequency_type:     "months",
        transaction_amount: plan.price,
        currency_id:        plan.currency,
        start_date:         today.toISOString(),
        end_date:           nextYear.toISOString(),
      },
      status: "pending",
    },
  });

  return {
    id:         result.id!,
    init_point: result.init_point!,
  };
}

/** Cancela una suscripción activa en MercadoPago */
export async function cancelMpSubscription(mpSubscriptionId: string): Promise<void> {
  await mpPreApproval.update({
    id:   mpSubscriptionId,
    body: { status: "cancelled" },
  });
}

/** Verifica la firma del webhook de MercadoPago */
export function verifyMpSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId:     string,
): boolean {
  if (!xSignature || !process.env.MERCADOPAGO_WEBHOOK_SECRET) return false;

  const { createHmac } = require("crypto") as typeof import("crypto");

  const parts = xSignature.split(",");
  const tsEntry = parts.find((p) => p.startsWith("ts="));
  const v1Entry = parts.find((p) => p.startsWith("v1="));
  if (!tsEntry || !v1Entry) return false;

  const ts   = tsEntry.split("=")[1];
  const hash = v1Entry.split("=")[1];

  const manifest = [
    `id:${dataId}`,
    xRequestId ? `request-id:${xRequestId}` : null,
    `ts:${ts}`,
  ].filter(Boolean).join(";");

  const expected = createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET)
    .update(manifest)
    .digest("hex");

  return expected === hash;
}
