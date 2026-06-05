import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, rateLimitResponse, REGISTER_LIMIT } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // ── Rate limit: 5 intentos por 10 minutos por IP ───────────────────────────
  const ip = getClientIp(request);
  const rl = rateLimit(`signup:${ip}`, REGISTER_LIMIT.limit, REGISTER_LIMIT.windowMs);
  if (!rl.success) return rateLimitResponse(rl.retryAfter) as NextResponse;

  let body: { email?: string; password?: string; name?: string; barbershopName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const email          = (body.email    ?? "").trim().toLowerCase();
  const password       = body.password  ?? "";
  const name           = (body.name     ?? "").trim();
  const barbershopName = (body.barbershopName ?? "").trim();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, barbershop_name: barbershopName },
    },
  });

  if (error) {
    // No revelar si el email ya existe (user enumeration)
    if (error.message.toLowerCase().includes("already registered")) {
      return NextResponse.json({ ok: true, emailSent: false, alreadyExists: true });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Si necesita confirmación de email
  const needsConfirmation = !data.session && !!data.user;
  return NextResponse.json({ ok: true, emailSent: needsConfirmation, userId: data.user?.id });
}
