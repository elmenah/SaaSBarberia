import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/book/[slug] — datos públicos de la barbería (sin autenticación)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const barbershop = await prisma.barbershop.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true, name: true, description: true,
          price: true, durationMins: true, category: true,
        },
      },
      barbers: {
        where: { isActive: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      reviews: {
        where: { isVisible: true },
        select: { rating: true, comment: true, clientName: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!barbershop) {
    return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });
  }

  // Calcular rating promedio
  const visibleReviews = barbershop.reviews;
  const avgRating = visibleReviews.length
    ? visibleReviews.reduce((s, r) => s + r.rating, 0) / visibleReviews.length
    : null;

  const settings = barbershop.settings as Record<string, unknown> | null;

  return NextResponse.json({
    data: {
      id:             barbershop.id,
      name:           barbershop.name,
      slug:           barbershop.slug,
      logoUrl:        barbershop.logoUrl,
      address:        barbershop.address,
      city:           barbershop.city,
      phone:          barbershop.phone,
      email:          barbershop.email,
      whatsappNumber: barbershop.whatsappNumber,
      settings:       barbershop.settings,
      // Campo conveniente sacado de settings
      description:    (settings?.description    as string | null) ?? null,
      coverColor:     (settings?.coverColor     as string | null) ?? null,
      coverImageUrl:  (settings?.coverImageUrl  as string | null) ?? null,
      instagramUrl:   (settings?.instagramUrl   as string | null) ?? null,
      services:       barbershop.services,
      barbers:        barbershop.barbers.map((b) => ({
        id:             b.id,
        colorTag:       b.colorTag,
        specialties:    b.specialties,
        bio:            b.bio,
        user:           b.user,
        certifications: (b.certifications as unknown[]) ?? [],
      })),
      reviews: {
        avg:   avgRating ? Math.round(avgRating * 10) / 10 : null,
        count: visibleReviews.length,
        list:  visibleReviews,
      },
    },
  });
}
