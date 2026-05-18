"use client";

import { useState } from "react";
import { Zap, CheckCircle2, XCircle, Clock, RefreshCw, MessageSquare, AlertTriangle, Gift } from "lucide-react";

type Trigger = {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  sent: number;
  failed: number;
};

const INITIAL_TRIGGERS: Trigger[] = [
  { id: "new_appointment", name: "Nueva reserva",         description: "Envía confirmación + detalles al cliente por WhatsApp",          icon: "📅", isActive: true,  sent: 342, failed: 0 },
  { id: "reminder_24h",    name: "Recordatorio 24 hs",    description: "Recuerda al cliente su turno con opción de confirmar o cancelar", icon: "⏰", isActive: true,  sent: 289, failed: 1 },
  { id: "reminder_1h",     name: "Recordatorio 1 hora",   description: "Último recordatorio antes del turno",                            icon: "🔔", isActive: true,  sent: 201, failed: 0 },
  { id: "cancelled",       name: "Cancelación",           description: "Notifica al cliente cuando se cancela su reserva",               icon: "❌", isActive: true,  sent: 48,  failed: 0 },
  { id: "inactive_30d",    name: "Cliente inactivo 30d",  description: "Reenganche automático para clientes que no han vuelto",          icon: "💤", isActive: true,  sent: 124, failed: 0 },
  { id: "birthday",        name: "Cumpleaños",            description: "Felicitación automática con descuento especial",                  icon: "🎂", isActive: false, sent: 0,   failed: 0 },
  { id: "post_service",    name: "Post-servicio (reseña)", description: "Pide una reseña 2 horas después del turno",                    icon: "⭐", isActive: false, sent: 0,   failed: 0 },
  { id: "loyalty_5",      name: "Corte #5 — 1 gratis",   description: "Al completar 5 cortes, avisa al cliente que el próximo es gratis", icon: "🎁", isActive: true,  sent: 37,  failed: 0 },
  { id: "loyalty_10",     name: "Corte #10 — Descuento", description: "Al corte número 10 envía automáticamente un cupón de descuento",   icon: "🏷️", isActive: true,  sent: 18,  failed: 0 },
];

const RECENT_LOGS = [
  { trigger: "Recordatorio 24h",    client: "Rodrigo Silva",  status: "sent",   reason: "",                   time: "hace 2 min"  },
  { trigger: "Nueva reserva",       client: "Diego Torres",   status: "sent",   reason: "",                   time: "hace 15 min" },
  { trigger: "Cliente inactivo 30d",client: "Fernando Mora",  status: "sent",   reason: "",                   time: "hace 1h"     },
  { trigger: "Recordatorio 24h",    client: "Ana Rodríguez",  status: "failed", reason: "Número inválido",    time: "hace 2h"     },
  { trigger: "Nueva reserva",       client: "Carlos Ruiz",    status: "sent",   reason: "",                   time: "hace 3h"     },
];

export default function AutomatizacionesPage() {
  const [triggers, setTriggers] = useState<Trigger[]>(INITIAL_TRIGGERS);

  function toggleTrigger(id: string) {
    setTriggers((prev) => prev.map((t) => t.id === id ? { ...t, isActive: !t.isActive } : t));
  }

  const totalSent   = triggers.reduce((s, t) => s + t.sent, 0);
  const totalFailed = triggers.reduce((s, t) => s + t.failed, 0);
  const activeCount = triggers.filter((t) => t.isActive).length;
  const successRate = Math.round((totalSent / Math.max(totalSent + totalFailed, 1)) * 100);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Activas",           value: `${activeCount}/${triggers.length}`, icon: Zap,          color: "#CA8A04" },
          { label: "Mensajes enviados", value: totalSent.toLocaleString(),          icon: MessageSquare, color: "#22C55E" },
          { label: "Con errores",       value: totalFailed,                          icon: XCircle,       color: "#EF4444" },
          { label: "Tasa de éxito",     value: `${successRate}%`,                  icon: CheckCircle2,  color: "#3B82F6" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl flex items-center gap-3"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: s.color + "18" }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-lg font-bold text-white font-body">{s.value}</p>
              <p className="text-xs font-body" style={{ color: "#52525B" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Workflows ─────────────────────────────────────────────── */}
        <div className="xl:col-span-2 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white font-body mb-1">Workflows configurados</h2>

          {triggers.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-4 p-4 rounded-xl transition-all"
              style={{
                backgroundColor: "#111111",
                border: t.failed > 0 && t.isActive
                  ? "1px solid rgba(239,68,68,0.2)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-2xl flex-shrink-0">{t.icon}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-semibold text-white font-body">{t.name}</p>
                  {t.isActive && t.failed > 0 && (
                    <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-body font-medium"
                      style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
                      <AlertTriangle className="w-3 h-3" />
                      {t.failed} error{t.failed !== 1 ? "es" : ""}
                    </span>
                  )}
                </div>
                <p className="text-xs font-body truncate" style={{ color: "#52525B" }}>{t.description}</p>
                {t.isActive && t.sent > 0 && (
                  <p className="text-xs font-body mt-1.5 flex items-center gap-1" style={{ color: "#22C55E" }}>
                    <CheckCircle2 className="w-3 h-3" />
                    {t.sent} enviados
                  </p>
                )}
              </div>

              {/* Toggle dorado */}
              <button
                onClick={() => toggleTrigger(t.id)}
                className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors"
                style={{ backgroundColor: t.isActive ? "#CA8A04" : "#1A1A1A" }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: t.isActive ? "translateX(21px)" : "translateX(2px)" }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* ── Panel Loyalty ─────────────────────────────────────────── */}
        <div className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ backgroundColor: "rgba(202,138,4,0.05)", border: "1px solid rgba(202,138,4,0.15)" }}>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" style={{ color: "#CA8A04" }} />
            <p className="text-sm font-semibold text-white font-body">Sistema de fidelización</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🎁", title: "Cada 5 cortes",  desc: "El cliente recibe un WhatsApp avisando que el siguiente corte es gratis." },
              { icon: "🏷️", title: "Corte número 10", desc: "Se envía automáticamente un cupón de descuento especial al cliente." },
            ].map((item) => (
              <div key={item.title} className="p-3 rounded-xl flex flex-col gap-1.5"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-xl">{item.icon}</span>
                <p className="text-xs font-semibold text-white font-body">{item.title}</p>
                <p className="text-xs font-body leading-relaxed" style={{ color: "#52525B" }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs font-body" style={{ color: "#3F3F46" }}>
            El progreso de cada cliente se puede ver en la sección <span style={{ color: "#CA8A04" }}>Clientes</span>.
          </p>
        </div>

        {/* ── Actividad reciente ─────────────────────────────────────── */}
        <div className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white font-body">Actividad reciente</h2>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
              style={{ color: "#3F3F46" }}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {RECENT_LOGS.map((log, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {log.status === "sent"
                      ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#22C55E" }} />
                      : <XCircle     className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#EF4444" }} />
                    }
                    <p className="text-xs font-medium font-body" style={{ color: "#A1A1AA" }}>{log.trigger}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" style={{ color: "#3F3F46" }}>
                    <Clock className="w-3 h-3" />
                    <span className="text-xs font-body">{log.time}</span>
                  </div>
                </div>
                <p className="text-xs font-body ml-5" style={{ color: "#52525B" }}>{log.client}</p>
                {log.status === "failed" && log.reason && (
                  <p className="text-xs font-body ml-5 font-medium" style={{ color: "#EF4444" }}>↳ {log.reason}</p>
                )}
                {i < RECENT_LOGS.length - 1 && (
                  <div className="mt-2 h-px" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Explicación de errores */}
          <div className="rounded-xl p-3 mt-1" style={{ backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p className="text-xs font-semibold font-body mb-1" style={{ color: "#EF4444" }}>¿Qué son los errores?</p>
            <p className="text-xs font-body leading-relaxed" style={{ color: "#71717A" }}>
              Ocurren cuando WhatsApp no pudo entregar el mensaje: número inválido, cuenta bloqueada o falla temporal de red. Puedes revisarlos en el historial de logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
