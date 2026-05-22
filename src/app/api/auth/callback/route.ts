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

  // Sincronizar usuario en DB si no existe
  const existingUser = await prisma.user.findUnique({
    where: { supabaseId: data.user.id },
  });

  let isNewUser = false;

  if (!existingUser) {
    isNewUser = true;
    const name = data.user.user_metadata?.name ?? data.user.email?.split("@")[0] ?? "Usuario";

    // Solo crear el User — la Barbershop se crea en /setup
    await prisma.user.create({
      data: {
        supabaseId: data.user.id,
        email: data.user.email!,
        name,
        role: "OWNER",
      },
    });
  }

  if (isNewUser) {
    return NextResponse.redirect(`${origin}/registro-exitoso`);
  }

  return NextResponse.redirect(`${origin}${next}?welcome=1`);
}
