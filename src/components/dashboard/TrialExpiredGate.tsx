"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Crown, ArrowRight, AlertTriangle, X } from "lucide-react";
import { useState } from "react";

/**
 * Banner suave que aparece en la parte superior del dashboard cuando:
 * - El trial venció
 * - La suscripción fue cancelada
 * - El pago está vencido
 *
 * NO bloquea el acceso — el usuario puede seguir usando el panel.
 * Solo se oculta en /dashboard/billing (donde ya ven los planes).
 */
export function TrialExpiredGate({ children }: { children: React.ReactNode }) {
  const { barbershop }    = useAuth();
  const pathname          = usePathname();
  const router            = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const isActive    = barbershop?.subscriptionStatus === "ACTIVE";
  const isTrialing  = barbershop?.subscriptionStatus === "TRIALING";
  const isCancelled = barbershop?.subscriptionStatus === "CANCELLED";
  const isPastDue   = barbershop?.subscriptionStatus === "PAST_DUE";

  const trialEnd     = barbershop?.trialEndsAt ? new Date(barbershop.trialEndsAt) : null;
  const trialExpired = isTrialing && trialEnd !== null && trialEnd < new Date();

  // Días restantes de trial (solo si aún está activo)
  const daysLeft = isTrialing && trialEnd && trialEnd > new Date()
    ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const hideBanner = pathname.startsWith("/dashboard/billing");

  // ── Qué mostrar ───────────────────────────────────────────────────────────

  // Trial activo con pocos días → aviso amarillo suave
  const showTrialWarning = isTrialing && daysLeft !== null && daysLeft <= 3 && !hideBanner;

  // Trial vencido / cancelado / pago vencido → banner rojo urgente
  const showExpiredBanner =
    !isActive && (trialExpired || isCancelled || isPastDue) && !hideBanner && !dismissed;

  const expiredMessage = isCancelled
    ? "Tu suscripción fue cancelada."
    : isPastDue
      ? "Problema con tu último pago."
      : "Tu prueba gratuita venció.";

  return (
    <div className="flex flex-col h-full">

      {/* ── Banner de trial por vencer (1-3 días) ───────────────────────── */}
      {showTrialWarning && !showExpiredBanner && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-2.5 mb-4 rounded-xl flex-shrink-0"
          style={{ backgroundColor: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.2)" }}
        >
          <div className="flex items-center gap-2">
            <Crown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#CA8A04" }} />
            <p className="text-xs font-body font-medium" style={{ color: "#CA8A04" }}>
              Tu trial vence en <strong>{daysLeft} día{daysLeft !== 1 ? "s" : ""}</strong>.
              Elegí un plan para no perder el acceso.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/billing")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-body flex-shrink-0 transition-all hover:opacity-90"
            style={{ backgroundColor: "#CA8A04", color: "#000" }}
          >
            Ver planes <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Banner de trial vencido / cancelado / pago vencido ──────────── */}
      {showExpiredBanner && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 mb-4 rounded-xl flex-shrink-0"
          style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#EF4444" }} />
            <div className="min-w-0">
              <p className="text-xs font-bold font-body" style={{ color: "#EF4444" }}>
                {expiredMessage}
              </p>
              <p className="text-xs font-body mt-0.5 truncate" style={{ color: "#71717A" }}>
                Podés seguir explorando, pero algunas funciones están limitadas.
                Activá tu plan para usarlas sin restricciones.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push("/dashboard/billing")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-body transition-all hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: "#EF4444", color: "#fff" }}
            >
              Activar plan <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="transition-colors hover:text-white"
              style={{ color: "#52525B" }}
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Contenido normal del dashboard ──────────────────────────────── */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
