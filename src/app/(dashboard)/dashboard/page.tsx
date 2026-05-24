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
  AlertTriangle, Share2, Cake, UserX, Bell,
  ChevronRight, Zap,
} from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/utils";

/* ── Tipos ───────────────────────────────────────────────────────────────── */
type TopService = {
  serviceId: string;
  name: string;
  count: number;
  revenue: number;
};

type SparkPoint = { date: string; revenue: number; count: number };

type Metrics = {
  totalRevenue: number;
  revenueGrowth: number;
  totalAppointments: number;
  appointmentsGrowth: number;
  newClients: number;
  clientsGrowth: number;
  completionRate: number;
  todayAppointments: number;
  topServices: TopService[];
  // Cierre del día
  todayRevenue: number;
  todayCompleted: number;
  todayAvgTicket: number;
  // Insight
  bestDayOfWeek: string | null;
  // Sparkline
  sparkline: SparkPoint[];
};

type Alerts = {
  riskClients: number;
  birthdaysThisWeek: number;
  unconfirmedTomorrow: number;
  weekAppointments: number;
  weekOccupancy: number;
  servicesCount: number;
  totalClients: number;
  activeBarbers: number;
};

type Appointment = {
  id: string;
  startsAt: string;
  status: string;
  client: { name: string };
  barber: { user: { name: string } };
  services: { service: { name: string } }[];
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED:   { label: "Completada", color: "#22C55E", bg: "rgba(34,197,94,0.08)"   },
  IN_PROGRESS: { label: "En curso",   color: "#CA8A04", bg: "rgba(202,138,4,0.08)"   },
  CONFIRMED:   { label: "Confirmada", color: "#A78BFA", bg: "rgba(167,139,250,0.08)" },
  PENDING:     { label: "Pendiente",  color: "#F59E0B", bg: "rgba(245,158,11,0.08)"  },
  CANCELLED:   { label: "Cancelada",  color: "#EF4444", bg: "rgba(239,68,68,0.08)"   },
};

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
    />
  );
}

/* ── Mini Sparkline SVG ─────────────────────────────────────────────────────── */
function Sparkline({ data, color = "#CA8A04" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 64; const h = 24;
  const step = w / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => `${i * step},${h - (v / max) * (h - 2) - 1}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { barbershop, isBarber } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [metrics, setMetrics]   = useState<Metrics | null>(null);
  const [alerts,  setAlerts]    = useState<Alerts | null>(null);
  const [today,   setToday]     = useState<Appointment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [copied,  setCopied]    = useState(false);

  // Barberos no tienen acceso al dashboard de métricas → redirigir a agenda
  useEffect(() => {
    if (isBarber) router.replace("/dashboard/agenda");
  }, [isBarber, router]);

  // Toast de bienvenida al iniciar sesión
  useEffect(() => {
    if (searchParams.get("welcome") === "1") {
      toast.success("¡Bienvenido de nuevo!", {
        description: "Sesión iniciada correctamente.",
        duration: 4000,
      });
      // Limpiar el query param sin recargar
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
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    if (!barbershop?.id) { setLoading(false); return; }

    const load = () => {
      // Construir rango del día local como timestamps UTC explícitos
      // para evitar errores de zona horaria al filtrar reservas de hoy
      const now = new Date();
      const localStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const localEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      Promise.all([
        fetch(`/api/dashboard/metrics?barbershopId=${barbershop.id}`).then(r => r.json()),
        fetch(
          `/api/appointments?barbershopId=${barbershop.id}&startsAtFrom=${localStart.toISOString()}&startsAtTo=${localEnd.toISOString()}&pageSize=10`
        ).then(r => r.json()),
        fetch(`/api/dashboard/alerts?barbershopId=${barbershop.id}`).then(r => r.json()),
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

    // Re-fetch cuando el usuario vuelve a la pestaña o regresa con el navegador
    const handleVisibility = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [barbershop?.id]);

  const sparkData = metrics?.sparkline ?? [];
  const metricCards = metrics
    ? [
        { label: "Ingresos del mes",  value: formatCurrency(metrics.totalRevenue),       change: metrics.revenueGrowth,      up: metrics.revenueGrowth >= 0,      icon: DollarSign,   spark: sparkData.map((d) => d.revenue), sparkColor: "#22C55E" },
        { label: "Reservas del mes",  value: String(metrics.totalAppointments),           change: metrics.appointmentsGrowth, up: metrics.appointmentsGrowth >= 0, icon: Calendar,     spark: sparkData.map((d) => d.count),   sparkColor: "#3B82F6" },
        { label: "Clientes nuevos",   value: String(metrics.newClients),                  change: metrics.clientsGrowth,      up: metrics.clientsGrowth >= 0,      icon: Users,        spark: [],                              sparkColor: "#A78BFA" },
        { label: "Tasa completadas",  value: `${metrics.completionRate}%`,                change: 0,                          up: true,                             icon: CheckCircle2, spark: [],                              sparkColor: "#CA8A04" },
      ]
    : [];

  // Onboarding: barbería sin datos
  const isNewBarbershop = !loading && alerts !== null && alerts.servicesCount === 0;
  const hasNoAppointments = !loading && metrics !== null && metrics.totalAppointments === 0 && !isNewBarbershop;

  // Alertas activas
  const activeAlerts = !loading && alerts ? [
    alerts.riskClients > 0 && {
      id: "risk",
      icon: UserX,
      color: "#EF4444",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.15)",
      text: `${alerts.riskClients} cliente${alerts.riskClients !== 1 ? "s" : ""} sin volver hace +30 días`,
      cta: "Activar reenganche",
      href: "/dashboard/automatizaciones",
    },
    alerts.unconfirmedTomorrow > 0 && {
      id: "unconfirmed",
      icon: Bell,
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.15)",
      text: `${alerts.unconfirmedTomorrow} turno${alerts.unconfirmedTomorrow !== 1 ? "s" : ""} de mañana sin confirmar`,
      cta: "Ver agenda",
      href: "/dashboard/agenda",
    },
    alerts.birthdaysThisWeek > 0 && {
      id: "bdays",
      icon: Cake,
      color: "#A78BFA",
      bg: "rgba(167,139,250,0.08)",
      border: "rgba(167,139,250,0.15)",
      text: `${alerts.birthdaysThisWeek} cumpleaño${alerts.birthdaysThisWeek !== 1 ? "s" : ""} esta semana`,
      cta: "Ver clientes",
      href: "/dashboard/clientes",
    },
  ].filter(Boolean) : [];

  return (
    <div className="flex flex-col gap-5">

      {/* ── ONBOARDING: barbería nueva sin servicios ─────────────────── */}
      {isNewBarbershop && (
        <div className="rounded-2xl p-6 flex flex-col gap-4"
          style={{ backgroundColor: "rgba(202,138,4,0.04)", border: "1px solid rgba(202,138,4,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
              <Zap className="w-5 h-5" style={{ color: "#CA8A04" }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-body">¡Bienvenido a mibarberia.site!</h2>
              <p className="text-xs font-body" style={{ color: "#71717A" }}>Completá estos 3 pasos para empezar a recibir turnos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: 1, done: false, label: "Configurá tus servicios", desc: "Precios, duración, categorías", href: "/dashboard/servicios", icon: Scissors },
              { step: 2, done: false, label: "Agregá a tu equipo", desc: "Invitá barberos a la plataforma", href: "/dashboard/barberos", icon: Users },
              { step: 3, done: false, label: "Compartí tu link", desc: "Mandalo por WhatsApp o Instagram", href: `/book/${barbershop?.slug}`, icon: Share2 },
            ].map(({ step, done, label, desc, href, icon: Icon }) => (
              <Link key={step} href={href} target={step === 3 ? "_blank" : undefined}
                className="flex items-center gap-3 p-4 rounded-xl transition-all hover:opacity-90"
                style={{ backgroundColor: done ? "rgba(34,197,94,0.07)" : "#111111", border: `1px solid ${done ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: done ? "#22C55E" : "rgba(202,138,4,0.1)", color: done ? "#fff" : "#CA8A04" }}>
                  {done ? <Check className="w-4 h-4" /> : step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white font-body">{label}</p>
                  <p className="text-xs font-body truncate" style={{ color: "#52525B" }}>{desc}</p>
                </div>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#3F3F46" }} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── ALERTAS ACCIONABLES ───────────────────────────────────────── */}
      {activeAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeAlerts.filter(Boolean).map((alert) => {
            if (!alert) return null;
            const Icon = alert.icon;
            return (
              <div key={alert.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ backgroundColor: alert.bg, border: `1px solid ${alert.border}` }}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: alert.color }} />
                <p className="flex-1 text-xs font-body font-medium text-white">{alert.text}</p>
                <Link href={alert.href}
                  className="flex items-center gap-1 text-xs font-semibold font-body flex-shrink-0 transition-opacity hover:opacity-80"
                  style={{ color: alert.color }}>
                  {alert.cta}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Metrics ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl flex flex-col gap-4" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))
          : metricCards.map((m) => (
              <div key={m.label} className="p-5 rounded-2xl flex flex-col gap-3"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium font-body" style={{ color: "#52525B" }}>{m.label}</p>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
                    <m.icon className="w-4 h-4" style={{ color: "#CA8A04" }} />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-2xl font-bold text-white font-body">{m.value}</p>
                    {m.change !== 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        {m.up
                          ? <TrendingUp  className="w-3 h-3" style={{ color: "#22C55E" }} />
                          : <TrendingDown className="w-3 h-3" style={{ color: "#EF4444" }} />
                        }
                        <span className="text-xs font-medium font-body" style={{ color: m.up ? "#22C55E" : "#EF4444" }}>
                          {m.change >= 0 ? "+" : ""}{m.change}% vs mes ant.
                        </span>
                      </div>
                    )}
                  </div>
                  {m.spark.length > 0 && <Sparkline data={m.spark} color={m.sparkColor} />}
                </div>
              </div>
            ))
        }
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Agenda hoy */}
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white font-body">Agenda de hoy</h2>
              <p className="text-xs mt-0.5 font-body" style={{ color: "#3F3F46" }}>
                {loading ? "Cargando..." : `${today.length} turnos programados`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-body" style={{ color: "#3F3F46" }}>
              <Clock className="w-3.5 h-3.5" />
              Actualizado ahora
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : today.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Calendar className="w-8 h-8" style={{ color: "#27272A" }} />
              <p className="text-sm font-body" style={{ color: "#3F3F46" }}>Sin turnos para hoy</p>
              <Link href="/dashboard/reservas/nueva"
                className="mt-2 text-xs font-semibold font-body px-4 py-2 rounded-xl"
                style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04" }}>
                + Crear reserva manual
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {today.map((a) => {
                const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.PENDING;
                const serviceName = a.services[0]?.service.name ?? "—";
                return (
                  <div key={a.id}
                    className="flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer transition-colors hover:bg-white/[0.02]"
                    style={{ backgroundColor: "#0D0D0D" }}>
                    <span className="text-xs font-mono w-12 flex-shrink-0" style={{ color: "#52525B" }}>
                      {formatTime(a.startsAt)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate font-body">{a.client.name}</p>
                      <p className="text-xs truncate font-body" style={{ color: "#52525B" }}>{serviceName}</p>
                    </div>
                    <span className="text-xs hidden sm:block flex-shrink-0 font-body" style={{ color: "#3F3F46" }}>
                      {a.barber.user.name.split(" ")[0]}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 font-body" style={{ color: s.color, backgroundColor: s.bg }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel derecho: link + acciones + ocupación */}
        <div className="flex flex-col gap-4">

          {/* ── Link público — prominente ── */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ backgroundColor: "rgba(202,138,4,0.05)", border: "1px solid rgba(202,138,4,0.2)" }}>
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4" style={{ color: "#CA8A04" }} />
              <p className="text-xs font-semibold font-body text-white">Tu link de reservas</p>
            </div>
            {loading || !publicUrl ? (
              <Skeleton className="h-9 rounded-xl" />
            ) : (
              <>
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="flex-1 text-xs font-mono truncate min-w-0" style={{ color: "#CA8A04" }}>
                    mibarberia.site/book/{barbershop?.slug}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold font-body transition-all"
                    style={copied
                      ? { backgroundColor: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }
                      : { backgroundColor: "rgba(202,138,4,0.12)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }
                    }>
                    {copied ? <><Check className="w-3.5 h-3.5" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar link</>}
                  </button>
                  <Link href={`/book/${barbershop?.slug}`} target="_blank"
                    className="flex items-center justify-center w-10 rounded-xl transition-all hover:opacity-80"
                    style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)", color: "#52525B" }}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* ── Ocupación de la semana ── */}
          <div className="rounded-2xl p-4 flex flex-col gap-3"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold font-body text-white">Ocupación esta semana</p>
              {loading ? <Skeleton className="h-4 w-8" /> : (
                <span className="text-sm font-bold font-body" style={{ color: alerts?.weekOccupancy && alerts.weekOccupancy > 70 ? "#22C55E" : "#CA8A04" }}>
                  {alerts?.weekOccupancy ?? 0}%
                </span>
              )}
            </div>
            {loading ? <Skeleton className="h-2 rounded-full" /> : (
              <>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${alerts?.weekOccupancy ?? 0}%`,
                      backgroundColor: alerts?.weekOccupancy && alerts.weekOccupancy > 70 ? "#22C55E" : "#CA8A04",
                    }} />
                </div>
                <p className="text-xs font-body" style={{ color: "#3F3F46" }}>
                  {alerts?.weekAppointments ?? 0} turno{alerts?.weekAppointments !== 1 ? "s" : ""} agendado{alerts?.weekAppointments !== 1 ? "s" : ""} esta semana
                </p>
              </>
            )}
          </div>

          {/* ── Acciones rápidas ── */}
          <div className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider font-body mb-1" style={{ color: "#3F3F46" }}>
              Acciones rápidas
            </p>
            {[
              { label: "Nueva reserva",       href: "/dashboard/reservas/nueva", icon: Calendar   },
              { label: "Agregar cliente",      href: "/dashboard/clientes",       icon: Users      },
              { label: "Gestionar servicios",  href: "/dashboard/servicios",      icon: Scissors   },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.03]"
                style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(202,138,4,0.08)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
                </div>
                <span className="text-sm font-body font-medium text-white flex-1">{label}</span>
                <ChevronRight className="w-3.5 h-3.5" style={{ color: "#3F3F46" }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Servicios más vendidos ───────────────────────────────────────── */}
      {(!hasNoAppointments && !isNewBarbershop) && (
        <div className="rounded-2xl p-5" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
              <h2 className="text-sm font-semibold text-white font-body">Servicios más vendidos</h2>
            </div>
            <span className="text-xs font-body" style={{ color: "#3F3F46" }}>Este mes</span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : !metrics?.topServices?.length ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Scissors className="w-7 h-7" style={{ color: "#27272A" }} />
              <p className="text-sm font-body" style={{ color: "#3F3F46" }}>
                Sin datos todavía — aparecerán cuando haya reservas este mes
              </p>
            </div>
          ) : (() => {
            const maxCount = metrics.topServices[0].count;
            return (
              <div className="flex flex-col gap-4">
                {metrics.topServices.map((s, i) => (
                  <div key={s.serviceId} className="flex items-center gap-3">
                    <span className="text-xs font-mono w-4 flex-shrink-0 text-center font-body"
                      style={{ color: i === 0 ? "#CA8A04" : "#3F3F46" }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-white truncate font-body">{s.name}</span>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <span className="text-xs font-body" style={{ color: "#52525B" }}>
                            {s.count} {s.count === 1 ? "vez" : "veces"}
                          </span>
                          <span className="text-xs font-semibold font-body" style={{ color: "#CA8A04" }}>
                            {formatCurrency(s.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.round((s.count / maxCount) * 100)}%`,
                            backgroundColor: i === 0 ? "#CA8A04" : i === 1 ? "#A78BFA" : "#52525B",
                          }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Cierre del día + Día más fuerte ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="p-5 rounded-2xl flex flex-col gap-3" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium font-body" style={{ color: "#52525B" }}>Ingresos hoy</p>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.08)" }}>
              <Receipt className="w-4 h-4" style={{ color: "#22C55E" }} />
            </div>
          </div>
          {loading ? <Skeleton className="h-7 w-28" /> : (
            <p className="text-xl font-bold text-white font-body">{formatCurrency(metrics?.todayRevenue ?? 0)}</p>
          )}
          <p className="text-xs font-body" style={{ color: "#3F3F46" }}>
            {loading ? "—" : `${metrics?.todayCompleted ?? 0} ${metrics?.todayCompleted === 1 ? "cliente atendido" : "clientes atendidos"}`}
          </p>
        </div>

        <div className="p-5 rounded-2xl flex flex-col gap-3" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium font-body" style={{ color: "#52525B" }}>Ticket promedio hoy</p>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(167,139,250,0.08)" }}>
              <DollarSign className="w-4 h-4" style={{ color: "#A78BFA" }} />
            </div>
          </div>
          {loading ? <Skeleton className="h-7 w-24" /> : (
            <p className="text-xl font-bold text-white font-body">
              {metrics?.todayCompleted ? formatCurrency(metrics.todayAvgTicket) : "—"}
            </p>
          )}
          <p className="text-xs font-body" style={{ color: "#3F3F46" }}>Por servicio completado</p>
        </div>

        <div className="p-5 rounded-2xl flex flex-col gap-3" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium font-body" style={{ color: "#52525B" }}>Tu día más fuerte</p>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(202,138,4,0.08)" }}>
              <Flame className="w-4 h-4" style={{ color: "#CA8A04" }} />
            </div>
          </div>
          {loading ? <Skeleton className="h-7 w-24" /> : (
            <p className="text-xl font-bold text-white font-body">
              {metrics?.bestDayOfWeek ?? "Sin datos"}
            </p>
          )}
          <p className="text-xs font-body" style={{ color: "#3F3F46" }}>
            {metrics?.bestDayOfWeek
              ? `Los ${metrics.bestDayOfWeek}s son tu día pico 💪`
              : "Basado en últimos 3 meses"}
          </p>
        </div>

      </div>
    </div>
  );
}
