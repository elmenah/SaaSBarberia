import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/register
 *
 * Crea el User + Barbershop en Prisma después de que Supabase Auth
 * completa el signup (cuando email confirmation está deshabilitado).
 * El flujo con confirmación de email usa /api/auth/callback en su lugar.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("[register] auth error:", authError);
      return NextResponse.json({ error: "Error de autenticación", detail: authError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Si ya existe en DB (p.ej. doble llamada), no recrear
    const existing = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { ownedBarbershops: true },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        existed: true,
        slug: existing.ownedBarbershops[0]?.slug ?? null,
      });
    }

    // Datos enviados desde el form de registro
    const body = await request.json().catch(() => ({}));
    const name = body.name
      ?? user.user_metadata?.name
      ?? user.email?.split("@")[0]
      ?? "Usuario";
    const barbershopName = body.barbershopName
      ?? user.user_metadata?.barbershop_name
      ?? `Barbería de ${name}`;

    // Crear usuario en DB
    const newUser = await prisma.user.create({
      data: {
        supabaseId: user.id,
        email: user.email!,
        name,
        role: "OWNER",
      },
    });

    // Crear barbería con trial de 14 días
    const slug = slugify(`${barbershopName}-${Date.now()}`);
    const barbershop = await prisma.barbershop.create({
      data: {
        name: barbershopName,
        slug,
        ownerId: newUser.id,
        subscriptionPlan: "FREE",
        subscriptionStatus: "TRIALING",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ ok: true, slug: barbershop.slug });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[register] unexpected error:", message);
    return NextResponse.json(
      { error: "Error interno del servidor", detail: message },
      { status: 500 }
    );
  }
}
