"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, Users, Calendar, DollarSign,
  CheckCircle2, Clock, Scissors, Copy, Check, ExternalLink,
} from "lucide-react";
import { formatCurrency, formatTime } from "@/lib/utils";

/* ── Métricas mock ───────────────────────────────────────────────────────── */
const METRICS = [
  { label: "Ingresos del mes",  value: formatCurrency(1284000), change: "+12.4%",  up: true,  icon: DollarSign   },
  { label: "Reservas del mes",  value: "163",                   change: "+8.1%",   up: true,  icon: Calendar     },
  { label: "Clientes nuevos",   value: "23",                    change: "+4.2%",   up: true,  icon: Users        },
  { label: "Tasa completadas",  value: "87%",                   change: null,      up: true,  icon: CheckCircle2 },
];

/* ── Agenda de hoy mock ──────────────────────────────────────────────────── */
const TODAY = [
  { id: "t1", startsAt: "2026-05-13T09:00:00", client: "Lucas Pérez",    service: "Corte + Barba",    barber: "Juan",    status: "CONFIRMED",   statusLabel: "Confirmada", statusColor: "#A78BFA", statusBg: "rgba(167,139,250,0.08)" },
  { id: "t2", startsAt: "2026-05-13T10:00:00", client: "Franco Bravo",   service: "Corte clásico",    barber: "Nicolás", status: "IN_PROGRESS", statusLabel: "En curso",   statusColor: "#CA8A04", statusBg: "rgba(202,138,4,0.08)"   },
  { id: "t3", startsAt: "2026-05-13T11:00:00", client: "Rodrigo Silva",  service: "Degradé full",     barber: "Juan",    status: "PENDING",     statusLabel: "Pendiente",  statusColor: "#F59E0B", statusBg: "rgba(245,158,11,0.08)"  },
  { id: "t4", startsAt: "2026-05-13T14:00:00", client: "Diego Torres",   service: "Corte + Barba",    barber: "Pedro",   status: "CONFIRMED",   statusLabel: "Confirmada", statusColor: "#A78BFA", statusBg: "rgba(167,139,250,0.08)" },
  { id: "t5", startsAt: "2026-05-13T15:30:00", client: "Matías García",  service: "Corte clásico",    barber: "Pedro",   status: "PENDING",     statusLabel: "Pendiente",  statusColor: "#F59E0B", statusBg: "rgba(245,158,11,0.08)"  },
  { id: "t6", startsAt: "2026-05-13T16:00:00", client: "Bruno Molina",   service: "Corte + Barba",    barber: "Nicolás", status: "CONFIRMED",   statusLabel: "Confirmada", statusColor: "#A78BFA", statusBg: "rgba(167,139,250,0.08)" },
  { id: "t7", startsAt: "2026-05-13T17:00:00", client: "Agustín Ruiz",   service: "Barba perfilada",  barber: "Carlos",  status: "PENDING",     statusLabel: "Pendiente",  statusColor: "#F59E0B", statusBg: "rgba(245,158,11,0.08)"  },
];

const TOP_SERVICES = [
  { name: "Corte clásico",   bookings: 142, pct: 100 },
  { name: "Corte + Barba",   bookings: 98,  pct: 69  },
  { name: "Degradé completo",bookings: 76,  pct: 54  },
  { name: "Barba perfilada", bookings: 54,  pct: 38  },
];

/* ════════════════════════════════════════════════════════════════════════════
   Página
════════════════════════════════════════════════════════════════════════════ */
export default function DemoDashboardPage() {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText("https://barberos.app/book/el-clasico").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Métricas ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {METRICS.map((m) => (
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
              {m.change && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" style={{ color: "#22C55E" }} />
                  <span className="text-xs font-medium font-body" style={{ color: "#22C55E" }}>
                    {m.change} vs mes ant.
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Grid principal ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Agenda de hoy */}
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white font-body">Agenda de hoy</h2>
              <p className="text-xs mt-0.5 font-body" style={{ color: "#3F3F46" }}>
                {TODAY.length} turnos programados
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-body" style={{ color: "#3F3F46" }}>
              <Clock className="w-3.5 h-3.5" />
              Actualizado ahora
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {TODAY.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 px-3 py-3 rounded-xl cursor-pointer transition-colors hover:bg-white/[0.02]"
                style={{ backgroundColor: "#0D0D0D" }}
              >
                <span className="text-xs font-mono w-12 flex-shrink-0" style={{ color: "#52525B" }}>
                  {formatTime(a.startsAt)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate font-body">{a.client}</p>
                  <p className="text-xs truncate font-body" style={{ color: "#52525B" }}>{a.service}</p>
                </div>
                <span className="text-xs hidden sm:block flex-shrink-0 font-body" style={{ color: "#3F3F46" }}>
                  {a.barber}
                </span>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 font-body"
                  style={{ color: a.statusColor, backgroundColor: a.statusBg }}
                >
                  {a.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Página de reservas + acciones rápidas */}
        <div className="rounded-2xl p-5 flex flex-col gap-5" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>

          {/* URL pública */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider font-body mb-3" style={{ color: "#3F3F46" }}>
              Tu página de reservas
            </p>
            <div className="flex items-center gap-2 p-2.5 rounded-xl"
              style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="flex-1 text-xs font-mono truncate min-w-0" style={{ color: "#71717A" }}>
                /book/el-clasico
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
            <Link href="/demo/book/el-clasico"
              className="flex items-center gap-1.5 mt-2 text-xs font-body hover:opacity-80 transition-opacity"
              style={{ color: "#52525B" }}>
              <ExternalLink className="w-3 h-3" />
              Ver cómo la ven tus clientes
            </Link>
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
                { label: "Nueva reserva",       href: "/demo/dashboard/reservas",     icon: Calendar  },
                { label: "Agregar cliente",      href: "/demo/dashboard/clientes",     icon: Users     },
                { label: "Gestionar servicios",  href: "/demo/dashboard/servicios",    icon: Scissors  },
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

      {/* ── Servicios más vendidos ────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
            <h2 className="text-sm font-semibold text-white font-body">Servicios más vendidos</h2>
          </div>
          <span className="text-xs font-body" style={{ color: "#3F3F46" }}>Este mes</span>
        </div>
        <div className="flex flex-col gap-3">
          {TOP_SERVICES.map((s) => (
            <div key={s.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-body text-white">{s.name}</span>
                <span className="text-xs font-body font-semibold" style={{ color: "#71717A" }}>{s.bookings} reservas</span>
              </div>
              <div className="h-1.5 rounded-full w-full overflow-hidden" style={{ backgroundColor: "#1A1A1A" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${s.pct}%`, backgroundColor: "#CA8A04" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
