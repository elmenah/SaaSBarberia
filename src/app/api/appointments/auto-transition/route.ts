import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { runAutoTransition } from "@/lib/appointments/auto-transition";

// POST /api/appointments/auto-transition
// Llamada desde el dashboard al cargar Reservas/Agenda para mantener estados al día.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Obtener barbershopId del usuario logueado
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { ownedBarbershops: { take: 1, select: { id: true } } },
  });

  const barbershopId = dbUser?.ownedBarbershops[0]?.id;

  const result = await runAutoTransition(barbershopId);

  return NextResponse.json({ data: result });
}
