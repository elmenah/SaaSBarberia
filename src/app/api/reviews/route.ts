import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReviewSchema = z.object({
  barbershopId:  z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  clientName:    z.string().min(2).max(80),
  clientPhone:   z.string().optional().nullable(),
  rating:        z.number().int().min(1).max(5),
  comment:       z.string().max(500).optional().nullable(),
});

// POST /api/reviews — crear reseña pública (sin autenticación)
export async function POST(request: NextRequest) {
  const body  = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });

  const parse = ReviewSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: parse.error.errors.map((e) => e.message).join(", ") },
      { status: 422 }
    );
  }

  const { barbershopId, appointmentId, clientName, clientPhone, rating, comment } = parse.data;

  // Verificar que la barbería existe
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { id: true },
  });
  if (!barbershop) {
    return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });
  }

  const review = await prisma.review.create({
    data: {
      barbershopId,
      appointmentId: appointmentId ?? null,
      clientName:    clientName.trim(),
      clientPhone:   clientPhone ?? null,
      rating,
      comment:       comment?.trim() ?? null,
    },
  });

  return NextResponse.json({ data: review }, { status: 201 });
}

// GET /api/reviews?barbershopId= — reseñas públicas de una barbería
export async function GET(request: NextRequest) {
  const barbershopId = request.nextUrl.searchParams.get("barbershopId");
  if (!barbershopId) {
    return NextResponse.json({ error: "barbershopId requerido" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where:   { barbershopId, isVisible: true },
    orderBy: { createdAt: "desc" },
    take:    50,
    select:  { id: true, clientName: true, rating: true, comment: true, createdAt: true },
  });

  return NextResponse.json({ data: reviews });
}
