import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Inicialización lazy — no se ejecuta en build time, solo al primer envío
let initialized = false;
function initWebPush() {
  if (initialized) return;
  const email  = process.env.VAPID_EMAIL;
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const prvKey = process.env.VAPID_PRIVATE_KEY;
  if (!email || !pubKey || !prvKey) {
    throw new Error("[Push] Faltan variables de entorno VAPID. Configurá VAPID_EMAIL, NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en Vercel.");
  }
  webpush.setVapidDetails(email, pubKey, prvKey);
  initialized = true;
}

export { webpush };

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
};

/**
 * Envía una push notification a todos los dispositivos de un usuario.
 * Si el endpoint ya no existe (410), limpia la suscripción de la DB.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  initWebPush();
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 } // 24h TTL
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        // Suscripción expirada o inválida → limpiar
        if (status === 410 || status === 404) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
        }
        throw err;
      }
    })
  );

  const sent   = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent, failed, total: subscriptions.length };
}

/**
 * Envía push a todos los usuarios de una barbería (dueño + barberos).
 */
export async function sendPushToBarbershop(barbershopId: string, payload: PushPayload) {
  initWebPush();
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { barbershopId },
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 }
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
        }
        throw err;
      }
    })
  );

  return {
    sent:   results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
    total:  subscriptions.length,
  };
}
