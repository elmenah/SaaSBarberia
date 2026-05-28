import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateClientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  birthdate: z.string().optional().nullable(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search   = searchParams.get("search") ?? "";
  const page     = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20");
  const isVip    = searchParams.get("isVip");

  // ── Seguridad: derivar barbershopId desde la sesión, nunca del cliente ──────
  // Soporta dueños y barberos: cada uno solo ve los clientes de su barbería.
  const dbUser = await prisma.user.findUnique({
    where:   { supabaseId: user.id },
    include: {
      ownedBarbershops: { take: 1 },
      barberProfile:    { select: { barbershopId: true } },
    },
  });
  const barbershopId =
    dbUser?.ownedBarbershops[0]?.id ??
    (dbUser?.barberProfile as { barbershopId?: string } | null)?.barbershopId;

  if (!barbershopId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where: Record<string, unknown> = {
    barbershopId,
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(isVip !== null && { isVip: isVip === "true" }),
  };

  const [total, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: [{ totalVisits: "desc" }, { name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({ data: clients, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parse = CreateClientSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedBarbershops: { take: 1 } },
  });

  if (!dbUser?.ownedBarbershops[0]) {
    return NextResponse.json({ error: "Barbershop not found" }, { status: 404 });
  }

  const barbershopId = dbUser.ownedBarbershops[0].id;

  const client = await prisma.client.create({
    data: {
      ...parse.data,
      barbershopId,
      birthdate: parse.data.birthdate ? new Date(parse.data.birthdate) : null,
    },
  });

  return NextResponse.json({ data: client }, { status: 201 });
}
