/**
 * Rate limiter de ventana fija — sin dependencias externas.
 *
 * Funciona en memoria por instancia serverless. En Vercel cada instancia
 * tiene su propio contador, lo que en la práctica multiplica el límite
 * por la cantidad de instancias activas. Para MVP es más que suficiente.
 *
 * Si en el futuro necesitás límites estrictos multi-instancia, migrá a
 * Upstash Redis + @upstash/ratelimit (misma API, 10k requests/día gratis).
 */

type Entry = { count: number; resetAt: number };

// Almacén global (persiste entre requests en la misma instancia)
const store = new Map<string, Entry>();

// Limpiar entradas expiradas cada 5 minutos para evitar memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export type RateLimitResult =
  | { success: true }
  | { success: false; retryAfter: number };

/**
 * Verifica el rate limit para una clave dada.
 *
 * @param key      Identificador único (ej. "ip:book:1.2.3.4")
 * @param limit    Número máximo de requests permitidos en la ventana
 * @param windowMs Duración de la ventana en milisegundos
 */
export function rateLimit(
  key:      string,
  limit:    number,
  windowMs: number,
): RateLimitResult {
  const now  = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // Ventana nueva
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (entry.count >= limit) {
    return { success: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { success: true };
}

/**
 * Extrae la IP del cliente desde los headers de Next.js / Vercel.
 */
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as { headers: Headers }).headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Respuesta estándar 429 con header Retry-After.
 */
export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: "Demasiadas solicitudes. Intentá en unos segundos." }),
    {
      status: 429,
      headers: {
        "Content-Type":  "application/json",
        "Retry-After":   String(retryAfter),
        "X-RateLimit-Limit": "exceeded",
      },
    }
  );
}

// ── Presets de límites por contexto ───────────────────────────────────────────

/** Reservas públicas: 10 por minuto por IP */
export const BOOK_LIMIT    = { limit: 10, windowMs: 60_000 };

/** Registro de cuenta: 5 por 10 minutos por IP */
export const REGISTER_LIMIT = { limit: 5, windowMs: 10 * 60_000 };

/** API autenticada general: 120 por minuto por barbershopId */
export const API_LIMIT      = { limit: 120, windowMs: 60_000 };

/** Webhooks de pagos: 30 por minuto (proteger el endpoint) */
export const WEBHOOK_LIMIT  = { limit: 30, windowMs: 60_000 };
