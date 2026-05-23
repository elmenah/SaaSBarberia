import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const supaUser = data.user;

  // ── ¿Es un barbero invitado? ──────────────────────────────────────────────
  // El metadata del invite tiene { role: "BARBER", barberId, barbershopId }
  const isInvitedBarber =
    supaUser.user_metadata?.role === "BARBER" &&
    supaUser.user_metadata?.barberId;

  if (isInvitedBarber) {
    const barberId = supaUser.user_metadata.barberId as string;

    // Buscar el Barber en DB y actualizar su User con el supabaseId real
    const barber = await prisma.barber.findUnique({
      where:   { id: barberId },
      include: { user: true },
    });

    if (barber && barber.user.supabaseId.startsWith("placeholder-")) {
      await prisma.user.update({
        where: { id: barber.userId },
        data:  {
          supabaseId: supaUser.id,
          email:      supaUser.email ?? barber.user.email,
          name:       supaUser.user_metadata?.name ?? barber.user.name,
        },
      });
    }

    // Redirigir al dashboard del barbero
    return NextResponse.redirect(`${origin}/dashboard?welcome=1`);
  }

  // ── Flujo normal: dueño ───────────────────────────────────────────────────
  const existingUser = await prisma.user.findUnique({
    where: { supabaseId: supaUser.id },
  });

  let isNewUser = false;

  if (!existingUser) {
    // Verificar si existe por email (puede ser un barbero con placeholder)
    const userByEmail = await prisma.user.findFirst({
      where: { email: supaUser.email! },
    });

    if (userByEmail && userByEmail.supabaseId.startsWith("placeholder-")) {
      // Vincular cuenta existente con Supabase real
      await prisma.user.update({
        where: { id: userByEmail.id },
        data:  { supabaseId: supaUser.id },
      });
    } else {
      // Usuario completamente nuevo → crear y mandar a setup
      isNewUser = true;
      const name = supaUser.user_metadata?.name ?? supaUser.email?.split("@")[0] ?? "Usuario";
      await prisma.user.create({
        data: {
          supabaseId: supaUser.id,
          email:      supaUser.email!,
          name,
          role:       "OWNER",
        },
      });
    }
  }

  if (isNewUser) {
    return NextResponse.redirect(`${origin}/registro-exitoso`);
  }

  return NextResponse.redirect(`${origin}${next}?welcome=1`);
}
