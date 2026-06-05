import type { AutomationTrigger, WebhookPayload } from "@/types";
import { prisma } from "@/lib/prisma";
import { getEffectiveLimits } from "@/lib/plans";
import { buildConfirmUrl, buildCancelUrl } from "@/lib/appointment-token";

/** Cuenta cuántos WhatsApps (webhooks SENT) se enviaron este mes para la barbería */
async function getMonthlyWhatsAppUsage(barbershopId: string): Promise<number> {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  return prisma.automationLog.count({
    where: { barbershopId, status: "SENT", sentAt: { gte: startOfMonth } },
  });
}

const WEBHOOK_URLS: Partial<Record<AutomationTrigger, string | undefined>> = {
  NEW_APPOINTMENT:          process.env.N8N_WEBHOOK_NEW_APPOINTMENT,
  APPOINTMENT_CANCELLED:    process.env.N8N_WEBHOOK_CANCEL_APPOINTMENT,
  APPOINTMENT_REMINDER_24H: process.env.N8N_WEBHOOK_REMINDER,
  APPOINTMENT_REMINDER_1H:  process.env.N8N_WEBHOOK_REMINDER_1H,
  CLIENT_INACTIVE_30D:      process.env.N8N_WEBHOOK_INACTIVE_CLIENT,
  POST_SERVICE_REVIEW:      process.env.N8N_WEBHOOK_REVIEW_REQUEST,
};

type FireWebhookArgs = {
  trigger: AutomationTrigger;
  barbershopId: string;
  barbershopName: string;
  appointmentId?: string;
  clientId?: string;
  data: Record<string, unknown>;
};

export async function fireWebhook({
  trigger,
  barbershopId,
  barbershopName,
  appointmentId,
  clientId,
  data,
}: FireWebhookArgs): Promise<void> {
  const webhookUrl =
    WEBHOOK_URLS[trigger] ??
    `${process.env.N8N_WEBHOOK_BASE_URL}/${trigger.toLowerCase().replace(/_/g, "-")}`;

  // ── Verificar límite de WhatsApp del plan ───────────────────────────────
  const shop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { subscriptionPlan: true, subscriptionStatus: true, trialEndsAt: true },
  });
  if (shop) {
    const limits = getEffectiveLimits(shop.subscriptionPlan, shop.subscriptionStatus, shop.trialEndsAt);
    if (limits.whatsappPerMonth === 0) {
      // Plan sin WhatsApp — no enviar ni logear (no consume cuota)
      return;
    }
    const usage = await getMonthlyWhatsAppUsage(barbershopId);
    if (usage >= limits.whatsappPerMonth) {
      // Límite alcanzado — loguear como SKIPPED para visibilidad
      await prisma.automationLog.create({
        data: {
          barbershopId, appointmentId, clientId, trigger,
          status: "SKIPPED",
          webhookUrl,
          payload: { trigger, barbershopId, reason: "monthly_limit_reached", usage, limit: limits.whatsappPerMonth } as Parameters<typeof prisma.automationLog.create>[0]["data"]["payload"],
        },
      });
      return;
    }
  }

  const payload: WebhookPayload = {
    trigger,
    barbershopId,
    barbershopName,
    timestamp: new Date().toISOString(),
    data,
  };

  // Registrar el intento antes de enviar
  const log = await prisma.automationLog.create({
    data: {
      barbershopId,
      appointmentId,
      clientId,
      trigger,
      status: "PENDING",
      webhookUrl,
      payload: payload as Parameters<typeof prisma.automationLog.create>[0]["data"]["payload"],
    },
  });

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mibarberia-Secret": process.env.N8N_API_KEY ?? "",
        "X-Mibarberia-Barbershop": barbershopId,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    const responseBody = await response.json().catch(() => ({}));

    await prisma.automationLog.update({
      where: { id: log.id },
      data: {
        status: response.ok ? "SENT" : "FAILED",
        response: responseBody,
        sentAt: new Date(),
        errorMessage: response.ok
          ? null
          : `HTTP ${response.status}: ${response.statusText}`,
      },
    });
  } catch (err) {
    await prisma.automationLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
        retryCount: { increment: 1 },
      },
    });
    // No re-throw: webhooks no deben romper el flujo principal
  }
}

// ── Helpers por caso de uso ─────────────────────────────────────────────────

function formatPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

function formatWhatsAppDate(date: Date): string {
  const tz    = "America/Santiago";
  const fecha = date.toLocaleDateString("es-CL",  { weekday: "long", day: "numeric", month: "long", timeZone: tz });
  const hora  = date.toLocaleTimeString("es-CL",  { hour: "2-digit", minute: "2-digit", timeZone: tz });
  return `${fecha} a las ${hora}`;
}

export async function notifyNewAppointment(args: {
  barbershopId: string;
  barbershopName: string;
  barbershopPhone?: string | null;
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  barberName: string;
  serviceName: string;
  startsAt: Date;
  totalPrice: number;
}) {
  const precio = args.totalPrice
    ? `$${Number(args.totalPrice).toLocaleString("es-CL")}`
    : "";

  const whatsappMessage = [
    `✅ *Turno confirmado*`,
    ``,
    `Hola ${args.clientName}! Tu turno en *${args.barbershopName}* quedó reservado.`,
    ``,
    `📅 *Fecha:* ${formatWhatsAppDate(args.startsAt)}`,
    `💈 *Barbero:* ${args.barberName}`,
    `✂️ *Servicio:* ${args.serviceName}`,
    precio ? `💰 *Precio:* ${precio}` : null,
    ``,
    args.barbershopPhone
      ? `Si no puedes asistir, avisanos con tiempo al ${formatPhone(args.barbershopPhone)}.`
      : `Si no puedes asistir, avisanos con tiempo.`,
  ].filter(Boolean).join("\n");

  return fireWebhook({
    trigger: "NEW_APPOINTMENT",
    barbershopId: args.barbershopId,
    barbershopName: args.barbershopName,
    appointmentId: args.appointmentId,
    data: {
      appointmentId: args.appointmentId,
      client: { name: args.clientName, phone: formatPhone(args.clientPhone) },
      barber: args.barberName,
      service: args.serviceName,
      startsAt: args.startsAt.toISOString(),
      totalPrice: args.totalPrice,
      whatsappPhone:   formatPhone(args.clientPhone),
      whatsappMessage,
    },
  });
}

export async function notifyCancelledAppointment(args: {
  barbershopId: string;
  barbershopName: string;
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  barberName?: string;
  startsAt: Date;
  cancelReason?: string;
}) {
  const whatsappMessage = [
    `❌ *Turno cancelado*`,
    ``,
    `Hola ${args.clientName}, tu turno en *${args.barbershopName}* fue cancelado.`,
    ``,
    `📅 *Fecha:* ${formatWhatsAppDate(args.startsAt)}`,
    args.barberName ? `💈 *Barbero:* ${args.barberName}` : null,
    ``,
    `Podés reservar un nuevo turno cuando quieras.`,
  ].filter(Boolean).join("\n");

  return fireWebhook({
    trigger: "APPOINTMENT_CANCELLED",
    barbershopId: args.barbershopId,
    barbershopName: args.barbershopName,
    appointmentId: args.appointmentId,
    data: {
      appointmentId: args.appointmentId,
      client: { name: args.clientName, phone: formatPhone(args.clientPhone) },
      startsAt: args.startsAt.toISOString(),
      cancelReason: args.cancelReason,
      whatsappPhone:   formatPhone(args.clientPhone),
      whatsappMessage,
    },
  });
}

export async function notifyReminder(args: {
  barbershopId:    string;
  barbershopName:  string;
  barbershopPhone?: string | null;
  appointmentId:   string;
  clientName:      string;
  clientPhone:     string;
  barberName:      string;
  serviceName:     string;
  startsAt:        Date;
  totalPrice:      number;
  hoursAhead:      1 | 24;
}) {
  const trigger: AutomationTrigger =
    args.hoursAhead === 1 ? "APPOINTMENT_REMINDER_1H" : "APPOINTMENT_REMINDER_24H";

  const precio      = args.totalPrice ? `$${Number(args.totalPrice).toLocaleString("es-CL")}` : "";
  const label       = args.hoursAhead === 1 ? "en 1 hora" : "mañana";
  const confirmUrl  = buildConfirmUrl(args.appointmentId);
  const cancelUrl   = buildCancelUrl(args.appointmentId);

  const whatsappMessage = [
    args.hoursAhead === 1 ? `⏰ *Recordatorio — tu turno es en 1 hora*` : `📅 *Recordatorio — tu turno es mañana*`,
    ``,
    `Hola ${args.clientName}! Te recordamos tu turno en *${args.barbershopName}*.`,
    ``,
    `📅 *Fecha:* ${formatWhatsAppDate(args.startsAt)}`,
    `💈 *Barbero:* ${args.barberName}`,
    `✂️ *Servicio:* ${args.serviceName}`,
    precio ? `💰 *Precio:* ${precio}` : null,
    ``,
    `¿Podés asistir?`,
    `✅ Confirmar: ${confirmUrl}`,
    `❌ Cancelar: ${cancelUrl}`,
  ].filter(Boolean).join("\n");

  // Payload de botones interactivos para Evolution API (n8n lo usa directamente)
  const evolutionButtons = {
    title:    `Recordatorio ${label}`,
    text:     `Hola ${args.clientName}! Tu turno en *${args.barbershopName}* es ${label}.\n\n📅 ${formatWhatsAppDate(args.startsAt)}\n💈 ${args.barberName} — ${args.serviceName}`,
    footer:   args.barbershopPhone ? `Consultas: ${formatPhone(args.barbershopPhone)}` : args.barbershopName,
    buttons:  [
      { type: "reply", reply: { id: `confirm:${args.appointmentId}`, title: "✅ Sí, confirmar" } },
      { type: "reply", reply: { id: `cancel:${args.appointmentId}`,  title: "❌ No puedo ir"   } },
    ],
  };

  return fireWebhook({
    trigger,
    barbershopId:   args.barbershopId,
    barbershopName: args.barbershopName,
    appointmentId:  args.appointmentId,
    data: {
      appointmentId:   args.appointmentId,
      hoursAhead:      args.hoursAhead,
      client:          { name: args.clientName, phone: formatPhone(args.clientPhone) },
      barber:          args.barberName,
      service:         args.serviceName,
      startsAt:        args.startsAt.toISOString(),
      totalPrice:      args.totalPrice,
      whatsappPhone:   formatPhone(args.clientPhone),
      whatsappMessage,
      evolutionButtons,   // n8n usa esto para enviar el mensaje interactivo
      confirmUrl,
      cancelUrl,
    },
  });
}

export async function notifyInactiveClients(args: {
  barbershopId: string;
  barbershopName: string;
  clients: Array<{ id: string; name: string; phone: string; lastVisitAt: Date | null }>;
}) {
  return fireWebhook({
    trigger: "CLIENT_INACTIVE_30D",
    barbershopId: args.barbershopId,
    barbershopName: args.barbershopName,
    data: {
      clients: args.clients.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        lastVisitAt: c.lastVisitAt?.toISOString() ?? null,
      })),
      count: args.clients.length,
    },
  });
}

export async function notifyReviewRequest(args: {
  barbershopId:   string;
  barbershopName: string;
  appointmentId:  string;
  clientName:     string;
  clientPhone:    string;
  barberName:     string;
  serviceName:    string;
  googlePlaceId?: string | null;
  barbershopSlug: string;
}) {
  // URL interna siempre disponible como segunda opción
  const internalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${args.barbershopSlug}?appt=${args.appointmentId}`;
  // URL de Google solo si hay Place ID configurado
  const googleUrl   = args.googlePlaceId
    ? `https://search.google.com/local/writereview?placeid=${args.googlePlaceId}`
    : null;

  const whatsappMessage = googleUrl
    ? [
        `⭐ *¿Cómo te fue hoy en ${args.barbershopName}?*`,
        ``,
        `Hola ${args.clientName}! Gracias por visitarnos. Tu opinión nos ayuda mucho.`,
        ``,
        `¿Dónde querés dejar tu reseña?`,
        ``,
        `🟡 *Google Maps* (recomendado):`,
        googleUrl,
        ``,
        `💬 *En el sitio*:`,
        internalUrl,
      ].join("\n")
    : [
        `⭐ *¿Cómo te fue hoy en ${args.barbershopName}?*`,
        ``,
        `Hola ${args.clientName}! Gracias por visitarnos.`,
        ``,
        `Tu opinión nos ayuda a seguir mejorando. Solo 30 segundos:`,
        internalUrl,
      ].join("\n");

  // reviewUrl para el payload (usamos Google si hay, sino interno)
  const reviewUrl = googleUrl ?? internalUrl;

  return fireWebhook({
    trigger:        "POST_SERVICE_REVIEW",
    barbershopId:   args.barbershopId,
    barbershopName: args.barbershopName,
    appointmentId:  args.appointmentId,
    data: {
      appointmentId:  args.appointmentId,
      client:         { name: args.clientName, phone: formatPhone(args.clientPhone) },
      barber:         args.barberName,
      service:        args.serviceName,
      reviewUrl,
      whatsappPhone:   formatPhone(args.clientPhone),
      whatsappMessage,
    },
  });
}
