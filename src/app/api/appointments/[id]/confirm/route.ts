import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAppointmentToken } from "@/lib/appointment-token";

// GET /api/appointments/[id]/confirm?token=xxx
// Ruta pública — el cliente la abre desde el link del email/WhatsApp
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (!verifyAppointmentToken(id, "confirm", token)) {
    return NextResponse.redirect(`${origin}/appointment-response?status=invalid`);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      barbershop: { select: { name: true, slug: true } },
    },
  });

  if (!appointment) {
    return NextResponse.redirect(`${origin}/appointment-response?status=not_found`);
  }

  if (appointment.status === "CANCELLED" || appointment.status === "NO_SHOW") {
    return NextResponse.redirect(`${origin}/appointment-response?status=already_cancelled`);
  }

  if (appointment.status === "COMPLETED") {
    return NextResponse.redirect(`${origin}/appointment-response?status=already_completed`);
  }

  // Marcar como confirmado por el cliente
  await prisma.appointment.update({
    where: { id },
    data: { status: "CONFIRMED" },
  });

  const slug = appointment.barbershop?.slug ?? "";
  return NextResponse.redirect(
    `${origin}/appointment-response?status=confirmed&shop=${encodeURIComponent(appointment.barbershop?.name ?? "")}&slug=${slug}`
  );
}
