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
} from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/utils";

/* ── Tipos ───────────────────────────────────────────────────────────────── */
type TopService = {
  serviceId: string;
  name: string;
  count: number;
  revenue: number;
};

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

export default function DashboardPage() {
  const { barbershop, isBarber } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [metrics, setMetrics]   = useState<Metrics | null>(null);
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
      ])
        .then(([metricsRes, todayRes]) => {
          setMetrics(metricsRes.data ?? null);
          setToday(todayRes.data ?? []);
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

  const metricCards = metrics
    ? [
        { label: "Ingresos del mes",  value: formatCurrency(metrics.totalRevenue),       change: metrics.revenueGrowth,      up: metrics.revenueGrowth >= 0,      icon: DollarSign   },
        { label: "Reservas del mes",  value: String(metrics.totalAppointments),           change: metrics.appointmentsGrowth, up: metrics.appointmentsGrowth >= 0, icon: Calendar     },
        { label: "Clientes nuevos",   value: String(metrics.newClients),                  change: metrics.clientsGrowth,      up: metrics.clientsGrowth >= 0,      icon: Users        },
        { label: "Tasa completadas",  value: `${metrics.completionRate}%`,                change: 0,                          up: true,                             icon: CheckCircle2 },
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">

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
              <div
                key={m.label}
                className="p-5 rounded-2xl flex flex-col gap-4"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium font-body" style={{ color: "#52525B" }}>{m.label}</p>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
                    <m.icon className="w-4 h-4" style={{ color: "#CA8A04" }} />
                  </div>
                </div>
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
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {today.map((a) => {
                const s = STATUS_STYLE[a.status] ?? STATUS_STYLE.PENDING;
                const serviceName = a.services[0]?.service.name ?? "—";
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer transition-colors hover:bg-white/2"
                    style={{ backgroundColor: "#0D0D0D" }}
                  >
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

        {/* Página de reservas + acciones rápidas */}
        <div className="rounded-2xl p-5 flex flex-col gap-5" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>

          {/* URL pública */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider font-body mb-3" style={{ color: "#3F3F46" }}>
              Tu página de reservas
            </p>
            {loading || !publicUrl ? (
              <Skeleton className="h-9 rounded-xl" />
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="flex-1 text-xs font-mono truncate min-w-0" style={{ color: "#71717A" }}>
                  /book/{barbershop?.slug}
                </span>
                <button onClick={copyLink}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold font-body transition-all flex-shrink-0"
                  style={copied
                    ? { backgroundColor: "rgba(34,197,94,0.1)", color: "#22C55E" }
                    : { backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04" }
                  }>
                  {copied ? <><Check className="w-3 h-3" />Copiado</> : <><Copy className="w-3 h-3" />Copiar</>}
                </button>
              </div>
            )}
            {!loading && publicUrl && (
              <Link href={`/book/${barbershop?.slug}`} target="_blank"
                className="flex items-center gap-1.5 mt-2 text-xs font-body hover:opacity-80 transition-opacity"
                style={{ color: "#52525B" }}>
                <ExternalLink className="w-3 h-3" />
                Ver cómo la ven tus clientes
              </Link>
            )}
          </div>

          {/* Divisor */}
          <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />

          {/* Acciones rápidas */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider font-body mb-3" style={{ color: "#3F3F46" }}>
              Acciones rápidas
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Nueva reserva",      href: "/dashboard/reservas/nueva", icon: Calendar   },
                { label: "Agregar cliente",    href: "/dashboard/clientes",       icon: Users      },
                { label: "Gestionar servicios",href: "/dashboard/servicios",      icon: Scissors   },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.03] group"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(202,138,4,0.08)" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
                  </div>
                  <span className="text-sm font-body font-medium text-white">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Servicios más vendidos ───────────────────────────────────────── */}
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
                  {/* Ranking número */}
                  <span className="text-xs font-mono w-4 flex-shrink-0 text-center font-body"
                    style={{ color: i === 0 ? "#CA8A04" : "#3F3F46" }}>
                    {i + 1}
                  </span>

                  {/* Nombre + barra */}
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
                    {/* Barra de progreso */}
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.round((s.count / maxCount) * 100)}%`,
                          backgroundColor: i === 0 ? "#CA8A04" : i === 1 ? "#A78BFA" : "#52525B",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── Cierre del día + Día más fuerte ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Ingresos de hoy */}
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

        {/* Ticket promedio hoy */}
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
          <p className="text-xs font-body" style={{ color: "#3F3F46" }}>
            Por servicio completado
          </p>
        </div>

        {/* Día más fuerte */}
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
