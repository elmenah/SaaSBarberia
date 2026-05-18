import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBirthdayEmail } from "@/lib/email/send-appointment-emails";

// GET /api/cron/birthdays — felicita a clientes que cumplen años hoy
// Vercel Cron: diario a las 09:00 AM
export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now   = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day   = now.getDate();

  // Clientes cuyo birthdate coincide en mes y día (cualquier año)
  const clients = await prisma.client.findMany({
    where: {
      email:     { not: null },
      birthdate: { not: null },
    },
    include: { barbershop: true },
  });

  let sent = 0;
  for (const client of clients) {
    if (!client.email || !client.birthdate) continue;
    const bd = new Date(client.birthdate);
    if (bd.getMonth() + 1 !== month || bd.getDate() !== day) continue;

    try {
      await sendBirthdayEmail({
        clientName:     client.name,
        clientEmail:    client.email,
        barbershopName: client.barbershop.name,
        barbershopSlug: client.barbershop.slug,
      });
      sent++;
    } catch (e) { console.error("[cron/birthdays] error", e); }
  }

  return NextResponse.json({ ok: true, sent });
}
