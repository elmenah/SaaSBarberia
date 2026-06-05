import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/resend";
import { createElement } from "react";
import TrialExpiredEmail from "@/emails/trial-expired";

// GET /api/cron/expire-trials
// Ejecutado por Vercel Cron cada día a las 02:00 ART (05:00 UTC)
// Busca barberías con trial vencido y las degrada a plan FREE
export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Barberías en TRIALING cuyo trial ya venció
  const expired = await prisma.barbershop.findMany({
    where: {
      subscriptionStatus: "TRIALING",
      trialEndsAt:        { lt: now },
    },
    include: {
      owner: { select: { email: true, name: true } },
    },
  });

  if (expired.length === 0) {
    return NextResponse.json({ ok: true, expired: 0 });
  }

  // Degradar a FREE en batch
  // Dejamos subscriptionStatus en TRIALING pero cambiamos plan a FREE.
  // getEffectiveLimits() solo da beneficios PRO si trialEndsAt > now,
  // como ya venció, cae al plan FREE automáticamente.
  // El TrialExpiredGate detecta (isTrialing && trialEndsAt < now) → muestra
  // "Tu prueba gratuita venció" en vez de "Tu suscripción fue cancelada".
  await prisma.barbershop.updateMany({
    where: {
      id: { in: expired.map((b) => b.id) },
    },
    data: {
      subscriptionPlan: "FREE",
    },
  });

  // Enviar email de aviso a cada dueño (no bloquea la respuesta si falla)
  await Promise.allSettled(
    expired.map((shop) => {
      if (!shop.owner?.email) return Promise.resolve();
      return sendEmail({
        to:      shop.owner.email,
        subject: `Tu prueba gratuita en Mibarberia venció — elige tu plan`,
        react:   createElement(TrialExpiredEmail, {
          ownerName:      shop.owner.name ?? "Hola",
          barbershopName: shop.name,
          billingUrl:     `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
        }),
      });
    })
  );

  console.log(`[expire-trials] Degradadas ${expired.length} barberías a FREE`);

  return NextResponse.json({ ok: true, expired: expired.length });
}
