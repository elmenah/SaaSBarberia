import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/**
 * GET /auth/confirm?token_hash=xxx&type=signup&next=/dashboard
 *
 * Supabase envía el link de confirmación de email a esta ruta.
 * Verifica el token, crea User + Barbershop en Prisma si no existen,
 * y redirige al dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") as "signup" | "email" | null;
  const next       = searchParams.get("next") ?? "/dashboard";

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=token_invalid`);
  }

  // Crear User + Barbershop en DB si no existen (primer login tras confirmar)
  const existing = await prisma.user.findUnique({
    where: { supabaseId: data.user.id },
  });

  if (!existing) {
    const name           = data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "Usuario";
    const barbershopName = data.user.user_metadata?.barbershop_name ?? `Barbería de ${name}`;

    const newUser = await prisma.user.create({
      data: {
        supabaseId: data.user.id,
        email:      data.user.email!,
        name,
        role:       "OWNER",
      },
    });

    await prisma.barbershop.create({
      data: {
        name:               barbershopName,
        slug:               slugify(`${barbershopName}-${Date.now()}`),
        ownerId:            newUser.id,
        subscriptionPlan:   "FREE",
        subscriptionStatus: "TRIALING",
        trialEndsAt:        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
