import { requireAuth, requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/barbershop
 * Retorna los datos completos de la barbería del usuario autenticado.
 */
export async function GET() {
  const session = await requireAuth();
  if (!session?.barbershop) {
    return NextResponse.json({ barbershop: null }, { status: 200 });
  }

  const { barbershop } = session;

  return NextResponse.json({
    barbershop: {
      id:                 barbershop.id,
      name:               barbershop.name,
      slug:               barbershop.slug,
      logoUrl:            barbershop.logoUrl,
      address:            barbershop.address,
      city:               barbershop.city,
      phone:              barbershop.phone,
      email:              barbershop.email,
      whatsappNumber:     barbershop.whatsappNumber,
      timezone:           barbershop.timezone,
      currency:           barbershop.currency,
      settings:           barbershop.settings,
      subscriptionPlan:   barbershop.subscriptionPlan,
      subscriptionStatus: barbershop.subscriptionStatus,
      trialEndsAt:        barbershop.trialEndsAt,
    },
  });
}

/**
 * PATCH /api/barbershop
 * Actualiza datos del perfil o configuración de la barbería.
 */
export async function PATCH(req: NextRequest) {
  const session = await requireOwner();
  if (!session) {
    return NextResponse.json({ error: "Solo el dueño puede modificar la barbería." }, { status: 403 });
  }

  const { barbershop } = session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const allowed = ["name", "slug", "logoUrl", "address", "city", "phone", "email",
                   "whatsappNumber", "timezone", "currency", "settings"] as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  // Validar slug si cambió
  if (data.slug && data.slug !== barbershop.slug) {
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return NextResponse.json(
        { error: "El slug solo puede contener letras minúsculas, números y guiones." },
        { status: 400 }
      );
    }
    const existing = await prisma.barbershop.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ error: "Ese slug ya está en uso. Elegí otro." }, { status: 409 });
    }
  }

  // Mergear settings en vez de reemplazar
  if (data.settings && typeof data.settings === "object") {
    const current = (barbershop.settings as Record<string, unknown>) ?? {};
    data.settings = { ...current, ...(data.settings as Record<string, unknown>) };
  }

  const updated = await prisma.barbershop.update({
    where: { id: barbershop.id },
    data,
    select: {
      id: true, name: true, slug: true, address: true, city: true,
      phone: true, email: true, whatsappNumber: true, settings: true,
      subscriptionPlan: true, subscriptionStatus: true, trialEndsAt: true,
    },
  });

  // AuditLog (fire-and-forget)
  const { settings: _s, ...loggableData } = data;
  writeAuditLog({
    barbershopId: barbershop.id,
    userId:       session.dbUser.id,
    action:       "SETTINGS_UPDATED",
    entity:       "Barbershop",
    entityId:     barbershop.id,
    after:        loggableData as import("@prisma/client").Prisma.InputJsonValue,
  });

  return NextResponse.json({ barbershop: updated });
}
