import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { slugify } from "@/lib/utils";

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

  // Sincronizar usuario en DB si no existe
  const existingUser = await prisma.user.findUnique({
    where: { supabaseId: data.user.id },
  });

  if (!existingUser) {
    const name = data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "Usuario";
    const barbershopName = data.user.user_metadata?.barbershop_name ?? `${name}'s Barbería`;

    const newUser = await prisma.user.create({
      data: {
        supabaseId: data.user.id,
        email: data.user.email!,
        name,
        role: "OWNER",
      },
    });

    await prisma.barbershop.create({
      data: {
        name: barbershopName,
        slug: slugify(`${barbershopName}-${Date.now()}`),
        ownerId: newUser.id,
        subscriptionPlan: "FREE",
        subscriptionStatus: "TRIALING",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
