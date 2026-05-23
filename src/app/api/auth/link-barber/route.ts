import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// POST /api/auth/link-barber
// Llamado desde /set-password después de que un barbero invitado establece su contraseña.
// Vincula su supabaseId real al User placeholder creado cuando el dueño lo agregó.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const meta = user.user_metadata;

  // Solo aplica a barberos invitados
  if (meta?.role !== "BARBER" || !meta?.barberId) {
    return NextResponse.json({ linked: false, reason: "not_a_barber_invite" });
  }

  const barberId = meta.barberId as string;

  const barber = await prisma.barber.findUnique({
    where:   { id: barberId },
    include: { user: true },
  });

  if (!barber) {
    return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
  }

  // Si ya está vinculado (supabaseId real), no hacer nada
  if (!barber.user.supabaseId.startsWith("placeholder-")) {
    return NextResponse.json({ linked: false, reason: "already_linked" });
  }

  // Vincular el supabaseId real
  await prisma.user.update({
    where: { id: barber.userId },
    data: {
      supabaseId: user.id,
      email:      user.email ?? barber.user.email,
      name:       meta.name ?? barber.user.name,
    },
  });

  return NextResponse.json({ linked: true });
}
