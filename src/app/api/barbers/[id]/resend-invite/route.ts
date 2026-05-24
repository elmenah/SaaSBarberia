import { requireOwner } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// POST /api/barbers/[id]/resend-invite
// Reenvía la invitación de Supabase al barbero (solo si aún no vinculó su cuenta)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireOwner();
  if (!session) {
    return NextResponse.json({ error: "Solo el dueño puede reenviar invitaciones." }, { status: 403 });
  }

  const { id } = await params;

  const barber = await prisma.barber.findFirst({
    where:   { id, barbershopId: session.barbershop.id },
    include: { user: true },
  });

  if (!barber) {
    return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
  }

  // Solo reenviar si aún no vinculó su cuenta real
  if (!barber.user.supabaseId.startsWith("placeholder-")) {
    return NextResponse.json(
      { error: "Este barbero ya tiene su cuenta activada." },
      { status: 409 }
    );
  }

  const supabaseAdmin = createAdminClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/set-password`;

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    barber.user.email,
    {
      redirectTo,
      data: {
        barberId:     barber.id,
        barbershopId: barber.barbershopId,
        name:         barber.user.name,
        role:         "BARBER",
      },
    }
  );

  if (error) {
    console.error("[resend-invite] Supabase error:", error.message);
    return NextResponse.json(
      { error: `No se pudo reenviar: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
