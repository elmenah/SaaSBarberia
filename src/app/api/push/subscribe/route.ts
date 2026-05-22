import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const SubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth:   z.string(),
  }),
  userAgent: z.string().optional(),
});

// POST /api/push/subscribe — guardar suscripción
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedBarbershops: { select: { id: true }, take: 1 } },
  });
  if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const body = await request.json();
  const parse = SubscribeSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { endpoint, keys, userAgent } = parse.data;
  const barbershopId = dbUser.ownedBarbershops[0]?.id ?? null;

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    create: { userId: dbUser.id, barbershopId, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent ?? null },
    update: { p256dh: keys.p256dh, auth: keys.auth, barbershopId, userAgent: userAgent ?? null },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/push/subscribe — eliminar suscripción
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { endpoint } = await request.json();
  if (!endpoint) return NextResponse.json({ error: "Falta endpoint" }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint } });

  return NextResponse.json({ ok: true });
}
