import { requireAuth, requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateServiceSchema = z.object({
  name:         z.string().min(2),
  description:  z.string().optional(),
  price:        z.number().positive(),
  durationMins: z.number().int().positive(),
  category:     z.string().default("general"),
  sortOrder:    z.number().int().default(0),
});

// GET /api/services
export async function GET() {
  const session = await requireAuth();
  if (!session?.barbershop) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const services = await prisma.service.findMany({
    where:   { barbershopId: session.barbershop.id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ data: services });
}

// POST /api/services — solo dueños
export async function POST(request: Request) {
  const session = await requireOwner();
  if (!session) return NextResponse.json({ error: "Solo el dueño puede crear servicios." }, { status: 403 });

  const body  = await request.json();
  const parse = CreateServiceSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.errors.map(e => e.message).join(", ") }, { status: 422 });

  const service = await prisma.service.create({
    data: { ...parse.data, barbershopId: session.barbershop.id },
  });

  return NextResponse.json({ data: service }, { status: 201 });
}
