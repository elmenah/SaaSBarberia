import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

// ─── Helpers cacheados para Server Components y API Routes ────────────────────

/** Usuario de Supabase Auth */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
});

/** Usuario en nuestra DB (con barberías) */
export const getDbUser = cache(async () => {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  return prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: { ownedBarbershops: true },
  });
});

/** Barbería activa del usuario (la primera que es owner) */
export const getBarbershop = cache(async () => {
  const dbUser = await getDbUser();
  if (!dbUser) return null;
  return dbUser.ownedBarbershops[0] ?? null;
});

// ─── Helper para API Routes ───────────────────────────────────────────────────

/**
 * Verifica auth y devuelve { authUser, dbUser, barbershop }.
 * Retorna null si no está autenticado o si no tiene barbería.
 *
 * Uso en API routes:
 *   const session = await requireAuth();
 *   if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
 */
export async function requireAuth() {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const dbUser = await getDbUser();
  if (!dbUser) return null;

  const barbershop = dbUser.ownedBarbershops[0] ?? null;

  return { authUser, dbUser, barbershop };
}

/** Solo verifica si hay sesión activa (sin DB) — útil para middleware-like checks */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}
