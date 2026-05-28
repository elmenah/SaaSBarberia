import { requireAuth, requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEffectiveLimits } from "@/lib/plans";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit, getClientIp, rateLimitResponse, API_LIMIT } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const CreateBarberSchema = z.object({
  name:       z.string().min(2),
  specialty:  z.string().min(2),
  phone:      z.string().optional(),
  colorTag:   z.string().default("#6366f1"),
  bio:        z.string().optional(),
  email:      z.string().email().optional(),
});

// GET /api/barbers?includeStats=true — lista Mibarberia con stats opcionales del mes
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session?.barbershop) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const includeStats = searchParams.get("includeStats") === "true";

  const barbers = await prisma.barber.findMany({
    where: { barbershopId: session.barbershop.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  if (!includeStats) {
    return NextResponse.json({ data: barbers });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const statsRaw = await prisma.appointment.groupBy({
    by: ["barberId"],
    where: {
      barbershopId: session.barbershop.id,
      startsAt: { gte: startOfMonth },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    _count: { id: true },
    _sum:   { totalPrice: true },
  });

  const statsById = Object.fromEntries(
    statsRaw.map((s) => [s.barberId, {
      turnosMes:   s._count.id,
      ingresosMes: Number(s._sum.totalPrice ?? 0),
    }])
  );

  const barbersWithStats = barbers.map((b) => ({
    ...b,
    stats: statsById[b.id] ?? { turnosMes: 0, ingresosMes: 0 },
  }));

  return NextResponse.json({ data: barbersWithStats });
}

// POST /api/barbers — crea un barbero (User + Barber)
export async function POST(request: NextRequest) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rl = rateLimit(`barbers:${ip}`, API_LIMIT.limit, API_LIMIT.windowMs);
  if (!rl.success) return rateLimitResponse(rl.retryAfter) as NextResponse;

  // ── Auth — solo dueños pueden agregar barberos ─────────────────────────────
  const session = await requireOwner();
  if (!session) return NextResponse.json({ error: "Solo el propietario puede agregar barberos." }, { status: 403 });

  const { barbershop, dbUser } = session;

  // ── Feature gating: límite de Mibarberia según plan ─────────────────────────
  const limits = getEffectiveLimits(
    barbershop.subscriptionPlan,
    barbershop.subscriptionStatus,
    barbershop.trialEndsAt,
  );

  const currentCount = await prisma.barber.count({
    where: { barbershopId: barbershop.id, isActive: true },
  });

  if (currentCount >= limits.maxBarbers) {
    return NextResponse.json(
      {
        error: `Tu plan permite hasta ${limits.maxBarbers} barbero${limits.maxBarbers !== 1 ? "s" : ""}. Actualizá tu plan para agregar más.`,
        code:  "PLAN_LIMIT_REACHED",
        limit: limits.maxBarbers,
      },
      { status: 403 }
    );
  }

  // ── Validación ─────────────────────────────────────────────────────────────
  const body  = await request.json();
  const parse = CreateBarberSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: parse.error.errors.map((e) => e.message).join(", ") },
      { status: 422 }
    );
  }

  const { name, specialty, phone, colorTag, bio, email } = parse.data;
  const finalEmail = email ?? `${name.toLowerCase().replace(/\s+/g, ".")}.${Date.now()}@placeholder.mibarberia.app`;

  // ── Crear en DB ────────────────────────────────────────────────────────────
  const newBarberUser = await prisma.user.create({
    data: {
      supabaseId: `placeholder-${Date.now()}`,
      email:      finalEmail,
      name,
      phone,
      role: "BARBER",
    },
  });

  const barber = await prisma.barber.create({
    data: {
      userId:       newBarberUser.id,
      barbershopId: barbershop.id,
      specialties:  [specialty],
      colorTag,
      bio,
    },
    include: { user: true },
  });

  // ── Enviar invite de Supabase si se proporcionó email real ─────────────────
  if (email && !email.includes("@placeholder.")) {
    try {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/set-password`,
        data: {
          name,
          role:         "BARBER",
          barberId:     barber.id,
          barbershopId: barbershop.id,
        },
      });
    } catch (inviteErr) {
      // No falla la creación si el invite no se puede enviar
      console.error("[barbers/invite] Error al enviar invite:", inviteErr);
    }
  }

  // ── AuditLog ───────────────────────────────────────────────────────────────
  writeAuditLog({
    barbershopId: barbershop.id,
    userId:       newBarberUser.id,
    action:       "BARBER_CREATED",
    entity:       "Barber",
    entityId:     barber.id,
    after:        { name, specialty, colorTag },
    ipAddress:    ip,
  });

  return NextResponse.json({ data: barber }, { status: 201 });
}
