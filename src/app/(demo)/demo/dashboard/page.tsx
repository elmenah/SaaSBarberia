"use client";

import {
  TrendingUp, Users, Calendar, DollarSign,
  CheckCircle2, Clock, Scissors, Zap,
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

        {/* Estado del sistema */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4" style={{ color: "#CA8A04" }} />
            <h2 className="text-sm font-semibold text-white font-body">Estado del sistema</h2>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Base de datos",       status: "ok",      desc: "Conectada a Supabase"     },
              { label: "Autenticación",        status: "ok",      desc: "Supabase Auth activo"      },
              { label: "WhatsApp (n8n)",       status: "ok",      desc: "Evolution API conectado"   },
              { label: "Pagos (MercadoPago)",  status: "ok",      desc: "Plan Profesional activo"   },
            ].map((item, i, arr) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium font-body" style={{ color: "#A1A1AA" }}>{item.label}</p>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full font-body"
                    style={{ color: "#22C55E", backgroundColor: "rgba(34,197,94,0.08)" }}
                  >
                    ✓ OK
                  </span>
                </div>
                <p className="text-xs font-body" style={{ color: "#52525B" }}>{item.desc}</p>
                {i < arr.length - 1 && <div className="mt-2 h-px" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />}
              </div>
            ))}
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
