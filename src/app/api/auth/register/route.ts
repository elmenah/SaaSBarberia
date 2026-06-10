import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { rateLimit, getClientIp, rateLimitResponse, REGISTER_LIMIT } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/register
 *
 * Crea el User + Barbershop en Prisma después de que Supabase Auth
 * completa el signup (cuando email confirmation está deshabilitado).
 * El flujo con confirmación de email usa /api/auth/callback en su lugar.
 */
export async function POST(request: NextRequest) {
  // ── Rate limit: 5 registros por 10 minutos por IP ──────────────────────────
  const ip = getClientIp(request);
  const rl = rateLimit(`register:${ip}`, REGISTER_LIMIT.limit, REGISTER_LIMIT.windowMs);
  if (!rl.success) return rateLimitResponse(rl.retryAfter) as NextResponse;

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

    // Datos enviados desde el form de setup
    const body = await request.json().catch(() => ({}));
    const name = body.name
      ?? user.user_metadata?.name
      ?? user.email?.split("@")[0]
      ?? "Usuario";
    const barbershopName = body.barbershopName
      ?? user.user_metadata?.barbershop_name
      ?? `Barbería de ${name}`;

    // Verificar si ya existe en DB
    const existing = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { ownedBarbershops: true },
    });

    if (existing) {
      // User existe — si ya tiene barbería, devolver slug
      if (existing.ownedBarbershops.length > 0) {
        return NextResponse.json({
          ok: true,
          existed: true,
          slug: existing.ownedBarbershops[0].slug,
        });
      }

      // User existe pero sin barbería (creado por callback OAuth) → crear barbería
      const slug = slugify(`${barbershopName}-${Date.now()}`);
      const barbershop = await prisma.barbershop.create({
        data: {
          name: barbershopName,
          slug,
          email: user.email ?? null,
          ownerId: existing.id,
          subscriptionPlan: "FREE",
          subscriptionStatus: "TRIALING",
          trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      return NextResponse.json({ ok: true, slug: barbershop.slug });
    }

    // Usuario completamente nuevo → crear User + Barbershop
    const newUser = await prisma.user.create({
      data: {
        supabaseId: user.id,
        email: user.email!,
        name,
        role: "OWNER",
      },
    });

    const slug = slugify(`${barbershopName}-${Date.now()}`);
    const barbershop = await prisma.barbershop.create({
      data: {
        name: barbershopName,
        slug,
        email: user.email ?? null,
        ownerId: newUser.id,
        subscriptionPlan: "FREE",
        subscriptionStatus: "TRIALING",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ ok: true, slug: barbershop.slug });

  } catch (err: unknown) {
    // Logear internamente pero NO exponer detalles al cliente
    const message = err instanceof Error ? err.message : String(err);
    console.error("[register] unexpected error:", message);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
