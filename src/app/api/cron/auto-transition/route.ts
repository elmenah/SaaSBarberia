import { NextRequest, NextResponse } from "next/server";
import { runAutoTransition } from "@/lib/appointments/auto-transition";

// GET /api/cron/auto-transition
// Llamada por Vercel Cron cada 5 minutos en producción.
// Requiere header Authorization: Bearer <CRON_SECRET>
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // En producción siempre validar el secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Procesar todas las barberías (sin filtro de barbershopId)
  const result = await runAutoTransition();

  return NextResponse.json({ ok: true, ...result });
}
