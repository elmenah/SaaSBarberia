import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// Límite muy estricto: 3 intentos por 15 minutos por IP
const FORGOT_LIMIT = { limit: 3, windowMs: 15 * 60_000 };

export async function POST(request: NextRequest) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rl = rateLimit(`forgot-password:${ip}`, FORGOT_LIMIT.limit, FORGOT_LIMIT.windowMs);
  if (!rl.success) return rateLimitResponse(rl.retryAfter) as NextResponse;

  let email: string;
  try {
    const body = await request.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const origin   = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  // No revelar si el email existe o no (evita enumeración)
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/set-password`,
  });

  // Siempre devolvemos ok=true para no filtrar si el email existe
  return NextResponse.json({ ok: true });
}
