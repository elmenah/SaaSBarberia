"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Check, Zap, Crown, Building2,
  CreditCard, AlertTriangle, Clock, Loader2,
  ChevronRight, ShieldCheck, X,
} from "lucide-react";
import { toast } from "sonner";

// ─── Definición de planes (client-side) ────────────────────────────────────────

type Plan = {
  key:              string;
  name:             string;
  description:      string;
  price:            number;
  barbers:          number;
  whatsappPerMonth: number;
  features:         string[];
  highlight:        boolean;
  icon:             React.ElementType;
};

const PLANS: Plan[] = [
  {
    key:              "STARTER",
    name:             "Individual",
    description:      "Para el barbero que trabaja solo",
    price:            9990,
    barbers:          1,
    whatsappPerMonth: 0,
    highlight:        false,
    icon:             Zap,
    features: [
      "1 barbero",
      "Reservas online ilimitadas",
      "Notificaciones por email",
      "Gestión de clientes",
      "Perfil público de barbería",
      "Soporte por email",
    ],
  },
  {
    key:              "PRO",
    name:             "Profesional",
    description:      "Para barberías con equipo",
    price:            24990,
    barbers:          7,
    whatsappPerMonth: 130,
    highlight:        true,
    icon:             Crown,
    features: [
      "Hasta 7 barberos",
      "130 mensajes WhatsApp/mes",
      "Notificaciones por email",
      "Automatizaciones completas",
      "Recordatorios automáticos",
      "Programa de fidelización",
      "Soporte prioritario",
    ],
  },
  {
    key:              "ENTERPRISE",
    name:             "Enterprise",
    description:      "Para cadenas de barberías",
    price:            49990,
    barbers:          10,
    whatsappPerMonth: 500,
    highlight:        false,
    icon:             Building2,
    features: [
      "Hasta 10 barberos",
      "500 mensajes WhatsApp/mes",
      "Notificaciones por email",
      "Todo lo del plan Profesional",
      "Reportes avanzados",
      "Onboarding personalizado",
      "Soporte 24/7",
    ],
  },
];

const PLAN_LABELS: Record<string, string> = {
  FREE:       "Gratuito",
  STARTER:    "Individual",
  PRO:        "Profesional",
  ENTERPRISE: "Enterprise",
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: "Activo",      color: "#22C55E", bg: "rgba(34,197,94,0.12)"   },
  TRIALING:  { label: "Trial",       color: "#CA8A04", bg: "rgba(202,138,4,0.12)"   },
  PAST_DUE:  { label: "Pago vencido",color: "#EF4444", bg: "rgba(239,68,68,0.12)"   },
  CANCELLED: { label: "Cancelado",   color: "#71717A", bg: "rgba(113,113,122,0.12)" },
  PAUSED:    { label: "Pausado",     color: "#F59E0B", bg: "rgba(245,158,11,0.12)"  },
};

function formatPrice(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}

function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Modal de confirmación de cancelación ──────────────────────────────────────

function CancelModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: () => void;
  onClose:   () => void;
  loading:   boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
            <AlertTriangle className="w-5 h-5" style={{ color: "#EF4444" }} />
          </div>
          <button onClick={onClose} className="transition-colors" style={{ color: "#52525B" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-semibold text-white font-body mb-1.5">
            ¿Cancelar suscripción?
          </h3>
          <p className="text-sm font-body leading-relaxed" style={{ color: "#71717A" }}>
            Tu plan seguirá activo hasta el final del período de facturación.
            Después perderás acceso a las funcionalidades premium.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#A1A1AA" }}>
            Mantener plan
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#EF4444", color: "#fff" }}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sí, cancelar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function BillingPage() {
  const { barbershop, refreshBarbershop } = useAuth();
  const [loadingPlan,   setLoadingPlan]   = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancel,    setShowCancel]    = useState(false);

  const currentPlan   = barbershop?.subscriptionPlan   ?? "FREE";
  const currentStatus = barbershop?.subscriptionStatus ?? "TRIALING";
  const daysLeft      = trialDaysLeft(barbershop?.trialEndsAt ?? null);
  const statusStyle   = STATUS_LABELS[currentStatus] ?? STATUS_LABELS.TRIALING;

  // ── Iniciar checkout de MercadoPago ────────────────────────────────────────
  async function handleUpgrade(planKey: string) {
    setLoadingPlan(planKey);
    try {
      const res = await fetch("/api/payments/create-subscription", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al iniciar el pago");
        return;
      }

      // Redirigir al checkout de MercadoPago
      window.location.href = data.init_point;

    } catch {
      toast.error("Error inesperado. Intentá más tarde.");
    } finally {
      setLoadingPlan(null);
    }
  }

  // ── Cancelar suscripción ───────────────────────────────────────────────────
  async function handleCancel() {
    setCancelLoading(true);
    try {
      const res  = await fetch("/api/payments/cancel", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Error al cancelar");
        return;
      }

      toast.success("Suscripción cancelada. Tu plan sigue activo hasta el final del período.");
      setShowCancel(false);
      await refreshBarbershop();

    } catch {
      toast.error("Error inesperado. Intentá más tarde.");
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <>
      {showCancel && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
          loading={cancelLoading}
        />
      )}

      <div className="flex flex-col gap-6 max-w-5xl">

        {/* ── Header + Estado actual ─────────────────────────────────────── */}
        <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>

          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
            <CreditCard className="w-5 h-5" style={{ color: "#CA8A04" }} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-base font-bold text-white font-body">
                {PLAN_LABELS[currentPlan] ?? currentPlan}
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full font-body"
                style={{ color: statusStyle.color, backgroundColor: statusStyle.bg }}>
                {statusStyle.label}
              </span>
            </div>
            <p className="text-xs font-body" style={{ color: "#52525B" }}>
              {currentStatus === "TRIALING" && daysLeft !== null
                ? `Trial: ${daysLeft} día${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`
                : currentStatus === "ACTIVE"
                  ? "Renovación automática mensual"
                  : currentStatus === "CANCELLED"
                    ? "Plan cancelado — upgrade disponible"
                    : currentStatus === "PAST_DUE"
                      ? "Hay un problema con tu pago"
                      : "Facturación mensual"}
            </p>
          </div>

          {/* Alerta de trial por expirar */}
          {currentStatus === "TRIALING" && daysLeft !== null && daysLeft <= 3 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold font-body"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              ¡Expira pronto!
            </div>
          )}

          {/* Countdown visual */}
          {currentStatus === "TRIALING" && daysLeft !== null && daysLeft > 3 && (
            <div className="flex items-center gap-2 text-xs font-body"
              style={{ color: "#CA8A04" }}>
              <Clock className="w-3.5 h-3.5" />
              {daysLeft}d de trial
            </div>
          )}
        </div>

        {/* ── PAST_DUE warning ──────────────────────────────────────────── */}
        {currentStatus === "PAST_DUE" && (
          <div className="rounded-2xl p-4 flex items-start gap-3"
            style={{ backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
            <div>
              <p className="text-sm font-semibold font-body mb-1" style={{ color: "#EF4444" }}>
                Pago vencido
              </p>
              <p className="text-xs font-body leading-relaxed" style={{ color: "#71717A" }}>
                No pudimos procesar tu último pago. Actualizá tu método de pago en MercadoPago o
                iniciá una nueva suscripción para restaurar el acceso.
              </p>
            </div>
          </div>
        )}

        {/* ── Plans ─────────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider font-body mb-4"
            style={{ color: "#3F3F46" }}>
            Planes disponibles
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent  = currentPlan === plan.key && currentStatus === "ACTIVE";
              const isLoading  = loadingPlan === plan.key;
              const Icon       = plan.icon;

              return (
                <div key={plan.key}
                  className="relative rounded-2xl p-5 flex flex-col gap-5 transition-all"
                  style={{
                    backgroundColor: plan.highlight ? "rgba(202,138,4,0.04)" : "#111111",
                    border: plan.highlight
                      ? "1px solid rgba(202,138,4,0.25)"
                      : isCurrent
                        ? "1px solid rgba(34,197,94,0.25)"
                        : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Destacado badge */}
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full font-body"
                        style={{ backgroundColor: "#CA8A04", color: "#000" }}>
                        Más popular
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: plan.highlight
                            ? "rgba(202,138,4,0.15)"
                            : "rgba(255,255,255,0.05)",
                        }}>
                        <Icon className="w-4 h-4"
                          style={{ color: plan.highlight ? "#CA8A04" : "#71717A" }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white font-body">{plan.name}</p>
                        <p className="text-xs font-body" style={{ color: "#52525B" }}>{plan.description}</p>
                      </div>
                    </div>

                    {/* Precio */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white font-body">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-xs font-body" style={{ color: "#52525B" }}>/mes</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{
                            backgroundColor: plan.highlight
                              ? "rgba(202,138,4,0.15)"
                              : "rgba(34,197,94,0.1)",
                          }}>
                          <Check className="w-2.5 h-2.5"
                            style={{ color: plan.highlight ? "#CA8A04" : "#22C55E" }} />
                        </div>
                        <span className="text-xs font-body leading-relaxed" style={{ color: "#A1A1AA" }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="flex flex-col gap-2">
                    {isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl text-sm font-semibold font-body flex items-center justify-center gap-2"
                        style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <Check className="w-3.5 h-3.5" />
                        Plan actual
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={!!loadingPlan}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold font-body flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={
                          plan.highlight
                            ? { backgroundColor: "#CA8A04", color: "#000" }
                            : { backgroundColor: "#1A1A1A", color: "#E4E4E7", border: "1px solid rgba(255,255,255,0.08)" }
                        }
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            {currentPlan === "FREE" || currentStatus !== "ACTIVE"
                              ? "Elegir plan"
                              : "Cambiar plan"}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Garantía + Seguridad ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, text: "Pagos seguros con MercadoPago" },
            { icon: Clock,       text: "Cancelá cuando quieras" },
            { icon: CreditCard,  text: "Sin cargos ocultos" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.04)" }}>
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#3F3F46" }} />
              <span className="text-xs font-body" style={{ color: "#52525B" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* ── Cancelación ───────────────────────────────────────────────── */}
        {currentStatus === "ACTIVE" && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowCancel(true)}
              className="text-xs font-body transition-colors hover:text-red-400"
              style={{ color: "#3F3F46" }}
            >
              Cancelar suscripción
            </button>
          </div>
        )}
      </div>
    </>
  );
}
