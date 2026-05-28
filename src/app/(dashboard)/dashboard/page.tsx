"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Users, Calendar,
  DollarSign, CheckCircle2, Clock, Scissors,
  ExternalLink, Copy, Check, Flame, Receipt,
  Share2, Cake, UserX, Bell,
  ChevronRight, Zap, ArrowRight, Eye, EyeOff,
} from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/utils";

/* ── Tipos ─────────────────────────────────────────────────────────────────── */
type TopService = { serviceId: string; name: string; count: number; revenue: number };
type SparkPoint  = { date: string; revenue: number; count: number };

type Metrics = {
  totalRevenue: number;      revenueGrowth: number;
  totalAppointments: number; appointmentsGrowth: number;
  newClients: number;        clientsGrowth: number;
  completionRate: number;    todayAppointments: number;
  topServices: TopService[];
  todayRevenue: number;      todayCompleted: number;  todayAvgTicket: number;
  bestDayOfWeek: string | null;
  sparkline: SparkPoint[];
};

type Alerts = {
  riskClients: number;      birthdaysThisWeek: number;
  unconfirmedTomorrow: number; weekAppointments: number;
  weekOccupancy: number;    servicesCount: number;
  totalClients: number;     activeBarbers: number;
};

type Appointment = {
  id: string; startsAt: string; status: string;
  client: { name: string };
  barber: { user: { name: string } };
  services: { service: { name: string } }[];
};

/* ── Status badges ─────────────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED:   { label: "Completada", color: "#22C55E", bg: "rgba(34,197,94,0.10)"   },
  IN_PROGRESS: { label: "En curso",   color: "#CA8A04", bg: "rgba(202,138,4,0.10)"   },
  CONFIRMED:   { label: "Confirmada", color: "#A78BFA", bg: "rgba(167,139,250,0.10)" },
  PENDING:     { label: "Pendiente",  color: "#F59E0B", bg: "rgba(245,158,11,0.10)"  },
  CANCELLED:   { label: "Cancelada",  color: "#EF4444", bg: "rgba(239,68,68,0.10)"   },
};

/* ── Skeleton ──────────────────────────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: "var(--ds-skeleton)" }}
    />
  );
}

/* ── Sparkline mini (64×24) ────────────────────────────────────────────────── */
function Sparkline({ data, color = "#CA8A04" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 64; const h = 24;
  const step = w / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => `${i * step},${h - (v / max) * (h - 2) - 1}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70 flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

/* ── Sparkline wide (hero) ─────────────────────────────────────────────────── */
function SparklineWide({ data, color = "#CA8A04" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 300; const h = 40;
  const step = w / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="opacity-80">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill="url(#spark-fill)" points={areaPoints} />
      <polyline fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

/* ── Componente principal ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { barbershop, isBarber } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [metrics,      setMetrics]      = useState<Metrics | null>(null);
  const [alerts,       setAlerts]       = useState<Alerts | null>(null);
  const [today,        setToday]        = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [copied,       setCopied]       = useState(false);
  const [hideBalance,  setHideBalance]  = useState(false);

  // Persistir preferencia de privacidad en localStorage
  useEffect(() => {
    const saved = localStorage.getItem("barber-hide-balance") === "1";
    setHideBalance(saved);
  }, []);

  function toggleBalance() {
    setHideBalance((v) => {
      const next = !v;
      localStorage.setItem("barber-hide-balance", next ? "1" : "0");
      return next;
    });
  }

  /** Formatea moneda o muestra ••••• si está oculto */
  function money(amount: number) {
    return hideBalance ? "•••••" : formatCurrency(amount);
  }

  // Barberos → redirigir a agenda
  useEffect(() => {
    if (isBarber) router.replace("/dashboard/agenda");
  }, [isBarber, router]);

  // Toast de bienvenida
  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      toast.success("¡Bienvenido de nuevo!", { description: "Sesión iniciada correctamente.", duration: 4000 });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  const publicUrl = barbershop?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/book/${barbershop.slug}`
    : null;

  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  useEffect(() => {
    if (!barbershop?.id) { setLoading(false); return; }

    const load = () => {
      const now        = new Date();
      const localStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const localEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      Promise.all([
        fetch(`/api/dashboard/metrics`).then(r => r.json()),
        fetch(`/api/appointments?barbershopId=${barbershop.id}&startsAtFrom=${localStart.toISOString()}&startsAtTo=${localEnd.toISOString()}&pageSize=10`).then(r => r.json()),
        fetch(`/api/dashboard/alerts`).then(r => r.json()),
      ])
        .then(([metricsRes, todayRes, alertsRes]) => {
          setMetrics(metricsRes.data ?? null);
          setToday(todayRes.data ?? []);
          setAlerts(alertsRes.data ?? null);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    load();
    const handleVisibility = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [barbershop?.id]);

  /* ── Datos derivados ───────────────────────────────────────────────────── */
  const sparkData = metrics?.sparkline ?? [];

  const onboardingSteps = !loading && alerts !== null ? [
    { step: 1, done: alerts.servicesCount > 0, label: "Configura tus servicios", desc: "Precios, duración, categorías",   href: "/dashboard/servicios",           icon: Scissors },
    { step: 2, done: alerts.activeBarbers > 0, label: "Agrega a tu equipo",      desc: "Invita barberos a la plataforma", href: "/dashboard/barberos",            icon: Users    },
    { step: 3, done: alerts.totalClients > 0,  label: "Comparte tu link",         desc: "Mándalo por WhatsApp o Instagram", href: `/book/${barbershop?.slug}`,   icon: Share2   },
  ] : null;
  const showOnboarding    = !loading && onboardingSteps !== null && onboardingSteps.some(s => !s.done);
  const hasNoAppointments = !loading && metrics !== null && metrics.totalAppointments === 0 && !showOnboarding;

  const activeAlerts = !loading && alerts ? [
    alerts.riskClients > 0 && {
      id: "risk", icon: UserX, color: "#EF4444",
      text: `${alerts.riskClients} cliente${alerts.riskClients !== 1 ? "s" : ""} sin volver hace +30 días`,
      cta: "Activar reenganche", href: "/dashboard/automatizaciones",
    },
    alerts.unconfirmedTomorrow > 0 && {
      id: "unconfirmed", icon: Bell, color: "#F59E0B",
      text: `${alerts.unconfirmedTomorrow} turno${alerts.unconfirmedTomorrow !== 1 ? "s" : ""} de mañana sin confirmar`,
      cta: "Ver agenda", href: "/dashboard/agenda",
    },
    alerts.birthdaysThisWeek > 0 && {
      id: "bdays", icon: Cake, color: "#A78BFA",
      text: `${alerts.birthdaysThisWeek} cumpleaño${alerts.birthdaysThisWeek !== 1 ? "s" : ""} esta semana`,
      cta: "Ver clientes", href: "/dashboard/clientes",
    },
  ].filter(Boolean) : [];

  /* ── Próximo turno del día ─────────────────────────────────────────────── */
  const now           = new Date();
  const nextAppt      = today.find(a => new Date(a.startsAt) > now && a.status !== "CANCELLED");
  const todayDone     = today.filter(a => a.status === "COMPLETED").length;
  const todayTotal    = today.filter(a => a.status !== "CANCELLED").length;
  const todayProgress = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 animate-fade-up">

      {/* ══════════════════════════════════════════════════════════════════
          ONBOARDING BANNER
      ══════════════════════════════════════════════════════════════════ */}
      {showOnboarding && onboardingSteps && (
        <div className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: "var(--ds-gold-surface)", border: "1px solid var(--ds-gold-border)" }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(202,138,4,0.12)" }}>
                <Zap className="w-4 h-4 text-gold" style={{ color: "#CA8A04" }} />
              </div>
              <div>
                <h2 className="text-sm font-bold font-body" style={{ color: "var(--ds-text-1)" }}>
                  ¡Bienvenido a mibarberia.site!
                </h2>
                <p className="text-xs font-body" style={{ color: "var(--ds-text-3)" }}>
                  Completa estos pasos para empezar a recibir turnos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold font-body" style={{ color: "#CA8A04" }}>
                {onboardingSteps.filter(s => s.done).length}/3
              </span>
              {/* Progress dots */}
              <div className="flex gap-1">
                {onboardingSteps.map(s => (
                  <div key={s.step} className="w-2 h-2 rounded-full transition-all"
                    style={{ backgroundColor: s.done ? "#22C55E" : "rgba(202,138,4,0.25)" }} />
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {onboardingSteps.map(({ step, done, label, desc, href, icon: Icon }) => (
              <Link key={step} href={href} target={step === 3 ? "_blank" : undefined}
                className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:scale-[1.01] cursor-pointer"
                style={{
                  backgroundColor: done ? "rgba(34,197,94,0.07)" : "var(--ds-surface)",
                  border: `1px solid ${done ? "rgba(34,197,94,0.18)" : "var(--ds-border)"}`,
                }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: done ? "#22C55E" : "rgba(202,138,4,0.1)",
                    color: done ? "#fff" : "#CA8A04",
                  }}>
                  {done ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold font-body truncate"
                    style={{ color: done ? "var(--ds-text-3)" : "var(--ds-text-1)", textDecoration: done ? "line-through" : "none" }}>
                    {label}
                  </p>
                  <p className="text-[11px] font-body truncate" style={{ color: "var(--ds-text-4)" }}>{desc}</p>
                </div>
                {done
                  ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#22C55E" }} />
                  : <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--ds-text-4)" }} />
                }
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ALERTAS ACCIONABLES — border-left style
      ══════════════════════════════════════════════════════════════════ */}
      {activeAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeAlerts.filter(Boolean).map((alert) => {
            if (!alert) return null;
            const Icon = alert.icon;
            return (
              <div key={alert.id}
                className="flex items-center gap-3 pl-4 pr-4 py-3 rounded-xl overflow-hidden relative"
                style={{
                  backgroundColor: "var(--ds-surface)",
                  border: "1px solid var(--ds-border)",
                  borderLeft: `3px solid ${alert.color}`,
                }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${alert.color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: alert.color }} />
                </div>
                <p className="flex-1 text-xs font-body font-medium" style={{ color: "var(--ds-text-2)" }}>
                  {alert.text}
                </p>
                <Link href={alert.href}
                  className="flex items-center gap-1 text-xs font-semibold font-body flex-shrink-0 transition-opacity hover:opacity-75"
                  style={{ color: alert.color }}>
                  {alert.cta}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HERO ROW — Ingresos del mes (grande) + Hoy en vivo (compacto)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* — Hero: Ingresos del mes — */}
        <div className="lg:col-span-2 rounded-2xl p-5 flex flex-col gap-3 overflow-hidden relative"
          style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
          {/* Gold accent gradient */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(202,138,4,0.06) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest font-body" style={{ color: "var(--ds-text-4)" }}>
                  Ingresos de {new Date().toLocaleString("es-419", { month: "long" })}
                </p>
                {/* Toggle ocultar saldo — visible en desktop y mobile */}
                <button
                  onClick={toggleBalance}
                  title={hideBalance ? "Mostrar saldo" : "Ocultar saldo"}
                  className="w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-opacity hover:opacity-75"
                  style={{ backgroundColor: "var(--ds-skeleton)" }}
                >
                  {hideBalance
                    ? <EyeOff className="w-3 h-3" style={{ color: "var(--ds-text-3)" }} />
                    : <Eye    className="w-3 h-3" style={{ color: "var(--ds-text-3)" }} />
                  }
                </button>
              </div>
              {loading
                ? <Skeleton className="h-10 w-44 mt-2" />
                : <p className="text-4xl font-bold mt-1 font-body" style={{ color: "var(--ds-text-1)" }}>
                    {money(metrics?.totalRevenue ?? 0)}
                  </p>
              }
              {!loading && metrics && metrics.revenueGrowth !== 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  {metrics.revenueGrowth >= 0
                    ? <TrendingUp  className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
                    : <TrendingDown className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                  }
                  <span className="text-sm font-semibold font-body"
                    style={{ color: metrics.revenueGrowth >= 0 ? "#22C55E" : "#EF4444" }}>
                    {metrics.revenueGrowth >= 0 ? "+" : ""}{metrics.revenueGrowth}%
                  </span>
                  <span className="text-xs font-body" style={{ color: "var(--ds-text-4)" }}>
                    vs. mes anterior
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {loading
                ? <Skeleton className="h-8 w-20" />
                : <div className="px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                    style={{ backgroundColor: "rgba(202,138,4,0.1)", border: "1px solid rgba(202,138,4,0.2)" }}>
                    <Receipt className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
                    <span className="text-xs font-semibold font-body" style={{ color: "#CA8A04" }}>
                      {metrics?.totalAppointments ?? 0} turnos
                    </span>
                  </div>
              }
              {!loading && metrics?.bestDayOfWeek && (
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
                  <span className="text-xs font-body" style={{ color: "var(--ds-text-4)" }}>
                    Pico: {metrics.bestDayOfWeek}s
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sparkline full-width */}
          <div className="mt-auto pt-3" style={{ borderTop: "1px solid var(--ds-border)" }}>
            {loading
              ? <Skeleton className="h-10 w-full" />
              : sparkData.length > 0
                ? <SparklineWide data={sparkData.map(d => d.revenue)} color="#CA8A04" />
                : <div className="h-10 flex items-center justify-center">
                    <p className="text-xs font-body" style={{ color: "var(--ds-text-4)" }}>Sin datos de los últimos 7 días</p>
                  </div>
            }
            <div className="flex justify-between mt-1">
              {sparkData.slice(0, 1).map(d => (
                <span key="start" className="text-[10px] font-body" style={{ color: "var(--ds-text-4)" }}>
                  {new Date(d.date + "T12:00:00").toLocaleDateString("es-419", { day: "numeric", month: "short" })}
                </span>
              ))}
              <span className="text-[10px] font-body" style={{ color: "var(--ds-text-4)" }}>Hoy</span>
            </div>
          </div>
        </div>

        {/* — Hoy en vivo — */}
        <div className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest font-body" style={{ color: "var(--ds-text-4)" }}>
                Hoy en vivo
              </p>
              {loading
                ? <Skeleton className="h-7 w-20 mt-1.5" />
                : <p className="text-2xl font-bold font-body mt-1" style={{ color: "var(--ds-text-1)" }}>
                    {money(metrics?.todayRevenue ?? 0)}
                  </p>
              }
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(34,197,94,0.10)" }}>
              <DollarSign className="w-4 h-4" style={{ color: "#22C55E" }} />
            </div>
          </div>

          {/* Progreso turnos hoy */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-body">
              <span style={{ color: "var(--ds-text-3)" }}>Turnos completados</span>
              {loading
                ? <Skeleton className="h-4 w-8" />
                : <span className="font-semibold" style={{ color: "var(--ds-text-1)" }}>
                    {todayDone}/{todayTotal}
                  </span>
              }
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--ds-skeleton)" }}>
              {!loading && (
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${todayProgress}%`, backgroundColor: "#22C55E" }} />
              )}
            </div>
          </div>

          {/* Ticket promedio hoy */}
          <div className="flex items-center justify-between py-2.5 px-3 rounded-xl"
            style={{ backgroundColor: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}>
            <span className="text-xs font-body" style={{ color: "var(--ds-text-3)" }}>Ticket promedio</span>
            {loading
              ? <Skeleton className="h-4 w-16" />
              : <span className="text-sm font-bold font-body" style={{ color: "var(--ds-text-1)" }}>
                  {metrics?.todayCompleted ? money(metrics.todayAvgTicket) : "—"}
                </span>
            }
          </div>

          {/* Próximo turno */}
          {!loading && nextAppt && (
            <div className="flex flex-col gap-1.5 pt-1" style={{ borderTop: "1px solid var(--ds-border)" }}>
              <p className="text-[10px] uppercase tracking-widest font-body font-semibold" style={{ color: "var(--ds-text-4)" }}>
                Próximo turno
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(202,138,4,0.10)" }}>
                  <Clock className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate font-body" style={{ color: "var(--ds-text-1)" }}>
                    {nextAppt.client.name}
                  </p>
                  <p className="text-xs font-body truncate" style={{ color: "var(--ds-text-3)" }}>
                    {formatTime(nextAppt.startsAt)} · {nextAppt.services[0]?.service.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && !nextAppt && (
            <div className="flex-1 flex items-center justify-center py-2">
              <p className="text-xs font-body text-center" style={{ color: "var(--ds-text-4)" }}>
                Sin turnos pendientes hoy
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STATS ROW — 3 tarjetas compactas
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Reservas del mes",
            value: loading ? null : String(metrics?.totalAppointments ?? 0),
            change: metrics?.appointmentsGrowth ?? 0,
            icon: Calendar,
            spark: sparkData.map(d => d.count),
            color: "#3B82F6",
          },
          {
            label: "Clientes nuevos",
            value: loading ? null : String(metrics?.newClients ?? 0),
            change: metrics?.clientsGrowth ?? 0,
            icon: Users,
            spark: [] as number[],
            color: "#A78BFA",
          },
          {
            label: "Tasa de completadas",
            value: loading ? null : `${metrics?.completionRate ?? 0}%`,
            change: 0,
            icon: CheckCircle2,
            spark: [] as number[],
            color: "#22C55E",
          },
        ].map((card) => (
          <div key={card.label} className="p-5 rounded-2xl flex flex-col gap-3"
            style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium font-body" style={{ color: "var(--ds-text-3)" }}>
                {card.label}
              </p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${card.color}15` }}>
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div>
                {card.value === null
                  ? <Skeleton className="h-8 w-24" />
                  : <p className="text-3xl font-bold font-body" style={{ color: "var(--ds-text-1)" }}>
                      {card.value}
                    </p>
                }
                {card.value !== null && card.change !== 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {card.change >= 0
                      ? <TrendingUp  className="w-3 h-3" style={{ color: "#22C55E" }} />
                      : <TrendingDown className="w-3 h-3" style={{ color: "#EF4444" }} />
                    }
                    <span className="text-xs font-medium font-body"
                      style={{ color: card.change >= 0 ? "#22C55E" : "#EF4444" }}>
                      {card.change >= 0 ? "+" : ""}{card.change}% vs mes ant.
                    </span>
                  </div>
                )}
              </div>
              {card.spark.length > 0 && <Sparkline data={card.spark} color={card.color} />}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN GRID — Agenda hoy + Panel derecho
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* — Agenda de hoy — */}
        <div className="xl:col-span-2 rounded-2xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white font-body" style={{ color: "var(--ds-text-1)" }}>
                Agenda de hoy
              </h2>
              <p className="text-xs mt-0.5 font-body" style={{ color: "var(--ds-text-4)" }}>
                {loading ? "Cargando..." : `${today.length} turno${today.length !== 1 ? "s" : ""} programado${today.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <Link href="/dashboard/agenda"
              className="flex items-center gap-1.5 text-xs font-semibold font-body transition-opacity hover:opacity-75"
              style={{ color: "#CA8A04" }}>
              Ver agenda completa
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : today.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "var(--ds-surface-2)" }}>
                <Calendar className="w-5 h-5" style={{ color: "var(--ds-text-4)" }} />
              </div>
              <p className="text-sm font-body" style={{ color: "var(--ds-text-3)" }}>Sin turnos para hoy</p>
              <Link href="/dashboard/reservas/nueva"
                className="text-xs font-semibold font-body px-4 py-2 rounded-xl transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}>
                + Crear reserva manual
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {today.map((a) => {
                const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.PENDING;
                const serviceName = a.services[0]?.service.name ?? "—";
                const isPast = new Date(a.startsAt) < now;
                return (
                  <div key={a.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                    style={{
                      backgroundColor: "var(--ds-surface-2)",
                      border: "1px solid var(--ds-border)",
                      opacity: isPast && a.status === "CANCELLED" ? 0.5 : 1,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--ds-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "var(--ds-surface-2)")}
                  >
                    <span className="text-xs font-mono w-12 flex-shrink-0 font-body" style={{ color: "var(--ds-text-3)" }}>
                      {formatTime(a.startsAt)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate font-body" style={{ color: "var(--ds-text-1)" }}>
                        {a.client.name}
                      </p>
                      <p className="text-xs truncate font-body" style={{ color: "var(--ds-text-3)" }}>
                        {serviceName}
                      </p>
                    </div>
                    <span className="text-xs hidden sm:block flex-shrink-0 font-body" style={{ color: "var(--ds-text-4)" }}>
                      {a.barber.user.name.split(" ")[0]}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 font-body"
                      style={{ color: s.color, backgroundColor: s.bg }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* — Panel derecho — */}
        <div className="flex flex-col gap-4">

          {/* Link de reservas */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ backgroundColor: "var(--ds-gold-surface)", border: "1px solid var(--ds-gold-border)" }}>
            <div className="flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
              <p className="text-xs font-semibold font-body" style={{ color: "var(--ds-text-1)" }}>
                Tu link de reservas
              </p>
            </div>
            {loading || !publicUrl ? (
              <Skeleton className="h-10 rounded-xl" />
            ) : (
              <>
                <div className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ backgroundColor: "var(--ds-surface-2)", border: "1px solid var(--ds-border)" }}>
                  <span className="flex-1 text-[11px] font-mono truncate min-w-0" style={{ color: "#CA8A04" }}>
                    mibarberia.site/book/{barbershop?.slug}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold font-body cursor-pointer transition-all"
                    style={copied
                      ? { backgroundColor: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.25)" }
                      : { backgroundColor: "rgba(202,138,4,0.12)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.25)" }
                    }>
                    {copied
                      ? <><Check className="w-3.5 h-3.5" />¡Copiado!</>
                      : <><Copy className="w-3.5 h-3.5" />Copiar</>
                    }
                  </button>
                  <Link href={`/book/${barbershop?.slug}`} target="_blank"
                    className="flex items-center justify-center w-10 rounded-xl transition-all hover:opacity-70"
                    style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", color: "var(--ds-text-3)" }}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Ocupación semanal */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold font-body" style={{ color: "var(--ds-text-1)" }}>
                Ocupación esta semana
              </p>
              {loading
                ? <Skeleton className="h-5 w-10" />
                : <span className="text-sm font-bold font-body"
                    style={{ color: (alerts?.weekOccupancy ?? 0) > 70 ? "#22C55E" : "#CA8A04" }}>
                    {alerts?.weekOccupancy ?? 0}%
                  </span>
              }
            </div>
            {loading
              ? <Skeleton className="h-2 rounded-full" />
              : <>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--ds-skeleton)" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${alerts?.weekOccupancy ?? 0}%`,
                        backgroundColor: (alerts?.weekOccupancy ?? 0) > 70 ? "#22C55E" : "#CA8A04",
                      }} />
                  </div>
                  <p className="text-xs font-body" style={{ color: "var(--ds-text-4)" }}>
                    {alerts?.weekAppointments ?? 0} turno{alerts?.weekAppointments !== 1 ? "s" : ""} esta semana
                  </p>
                </>
            }
          </div>

          {/* Acciones rápidas */}
          <div className="rounded-2xl p-4 flex flex-col gap-1.5"
            style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest font-body mb-2" style={{ color: "var(--ds-text-4)" }}>
              Acciones rápidas
            </p>
            {[
              { label: "Nueva reserva",      href: "/dashboard/reservas/nueva", icon: Calendar  },
              { label: "Agregar cliente",     href: "/dashboard/clientes",       icon: Users     },
              { label: "Gestionar servicios", href: "/dashboard/servicios",      icon: Scissors  },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                style={{ border: "1px solid var(--ds-border)" }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--ds-hover)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(202,138,4,0.08)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
                </div>
                <span className="text-sm font-body font-medium flex-1" style={{ color: "var(--ds-text-1)" }}>{label}</span>
                <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--ds-text-4)" }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          BOTTOM ROW — Top servicios + Stats del día
      ══════════════════════════════════════════════════════════════════ */}
      {!hasNoAppointments && !showOnboarding && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* — Top servicios — */}
          <div className="xl:col-span-2 rounded-2xl p-5"
            style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
                <h2 className="text-sm font-semibold font-body" style={{ color: "var(--ds-text-1)" }}>
                  Servicios más vendidos
                </h2>
              </div>
              <span className="text-xs font-body" style={{ color: "var(--ds-text-4)" }}>Este mes</span>
            </div>

            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : !metrics?.topServices?.length ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "var(--ds-surface-2)" }}>
                  <Scissors className="w-5 h-5" style={{ color: "var(--ds-text-4)" }} />
                </div>
                <p className="text-sm font-body" style={{ color: "var(--ds-text-3)" }}>
                  Aparecerán cuando haya reservas completadas este mes
                </p>
              </div>
            ) : (() => {
              const maxCount = metrics.topServices[0].count;
              const barColors = ["#CA8A04", "#A78BFA", "#3B82F6", "#22C55E", "#F59E0B"];
              return (
                <div className="flex flex-col gap-4">
                  {metrics.topServices.map((s, i) => (
                    <div key={s.serviceId} className="flex items-center gap-3">
                      <span className="text-xs font-mono w-4 flex-shrink-0 text-center font-body"
                        style={{ color: i === 0 ? "#CA8A04" : "var(--ds-text-4)" }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5 gap-2">
                          <span className="text-sm font-medium truncate font-body" style={{ color: "var(--ds-text-1)" }}>
                            {s.name}
                          </span>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs font-body" style={{ color: "var(--ds-text-3)" }}>
                              {s.count}×
                            </span>
                            <span className="text-xs font-semibold font-body" style={{ color: "#CA8A04" }}>
                              {money(s.revenue)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--ds-skeleton)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.round((s.count / maxCount) * 100)}%`,
                              backgroundColor: barColors[i] ?? "#52525B",
                            }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* — Cierre del día + Insight — */}
          <div className="flex flex-col gap-4">
            {[
              {
                label: "Ingresos hoy",
                value: loading ? null : money(metrics?.todayRevenue ?? 0),
                sub: loading ? "" : `${metrics?.todayCompleted ?? 0} cliente${(metrics?.todayCompleted ?? 0) !== 1 ? "s" : ""} atendido${(metrics?.todayCompleted ?? 0) !== 1 ? "s" : ""}`,
                icon: Receipt,
                color: "#22C55E",
              },
              {
                label: "Ticket promedio hoy",
                value: loading ? null : (metrics?.todayCompleted ? money(metrics.todayAvgTicket) : "—"),
                sub: "Por servicio completado",
                icon: DollarSign,
                color: "#A78BFA",
              },
              {
                label: "Tu día más fuerte",
                value: loading ? null : (metrics?.bestDayOfWeek ?? "Sin datos"),
                sub: metrics?.bestDayOfWeek ? `Los ${metrics.bestDayOfWeek}s son tu día pico` : "Basado en últimos 3 meses",
                icon: Flame,
                color: "#F59E0B",
              },
            ].map((card) => (
              <div key={card.label} className="p-4 rounded-2xl flex flex-col gap-2"
                style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium font-body" style={{ color: "var(--ds-text-3)" }}>{card.label}</p>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${card.color}15` }}>
                    <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                  </div>
                </div>
                {card.value === null
                  ? <Skeleton className="h-6 w-28" />
                  : <p className="text-xl font-bold font-body" style={{ color: "var(--ds-text-1)" }}>{card.value}</p>
                }
                <p className="text-xs font-body" style={{ color: "var(--ds-text-4)" }}>{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
