import type { AutomationTrigger, WebhookPayload } from "@/types";
import { prisma } from "@/lib/prisma";

const WEBHOOK_URLS: Partial<Record<AutomationTrigger, string | undefined>> = {
  NEW_APPOINTMENT: process.env.N8N_WEBHOOK_NEW_APPOINTMENT,
  APPOINTMENT_CANCELLED: process.env.N8N_WEBHOOK_CANCEL_APPOINTMENT,
  APPOINTMENT_REMINDER_24H: process.env.N8N_WEBHOOK_REMINDER,
  CLIENT_INACTIVE_30D: process.env.N8N_WEBHOOK_INACTIVE_CLIENT,
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
        "X-BarberOS-Secret": process.env.N8N_API_KEY ?? "",
        "X-BarberOS-Barbershop": barbershopId,
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

export async function notifyNewAppointment(args: {
  barbershopId: string;
  barbershopName: string;
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  barberName: string;
  serviceName: string;
  startsAt: Date;
  totalPrice: number;
}) {
  return fireWebhook({
    trigger: "NEW_APPOINTMENT",
    barbershopId: args.barbershopId,
    barbershopName: args.barbershopName,
    appointmentId: args.appointmentId,
    data: {
      appointmentId: args.appointmentId,
      client: { name: args.clientName, phone: args.clientPhone },
      barber: args.barberName,
      service: args.serviceName,
      startsAt: args.startsAt.toISOString(),
      totalPrice: args.totalPrice,
    },
  });
}

export async function notifyCancelledAppointment(args: {
  barbershopId: string;
  barbershopName: string;
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  startsAt: Date;
  cancelReason?: string;
}) {
  return fireWebhook({
    trigger: "APPOINTMENT_CANCELLED",
    barbershopId: args.barbershopId,
    barbershopName: args.barbershopName,
    appointmentId: args.appointmentId,
    data: {
      appointmentId: args.appointmentId,
      client: { name: args.clientName, phone: args.clientPhone },
      startsAt: args.startsAt.toISOString(),
      cancelReason: args.cancelReason,
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
