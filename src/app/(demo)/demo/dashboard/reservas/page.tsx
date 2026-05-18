"use client";

import { useState } from "react";
import { Search, Plus, Filter, MoreHorizontal, Clock } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED:   { label: "Completada", color: "#22C55E", bg: "rgba(34,197,94,0.08)"   },
  IN_PROGRESS: { label: "En curso",   color: "#CA8A04", bg: "rgba(202,138,4,0.08)"   },
  CONFIRMED:   { label: "Confirmada", color: "#A78BFA", bg: "rgba(167,139,250,0.08)" },
  PENDING:     { label: "Pendiente",  color: "#F59E0B", bg: "rgba(245,158,11,0.08)"  },
  CANCELLED:   { label: "Cancelada",  color: "#EF4444", bg: "rgba(239,68,68,0.08)"   },
};

const SOURCE_ICON: Record<string, string> = {
  manual: "✏️", whatsapp: "💬", web: "🌐", api: "🔌",
};

const MOCK_RESERVAS = [
  { id: "a1b2c3", startsAt: "2026-05-13T09:00:00", status: "IN_PROGRESS", source: "manual",   totalPrice: 3500, client: { name: "Lucas Pérez"    }, barber: { user: { name: "Juan Martínez"  } }, services: [{ service: { name: "Corte + Barba"    } }] },
  { id: "d4e5f6", startsAt: "2026-05-13T10:00:00", status: "CONFIRMED",   source: "whatsapp", totalPrice: 2000, client: { name: "Franco Bravo"    }, barber: { user: { name: "Nicolás García" } }, services: [{ service: { name: "Corte clásico"    } }] },
  { id: "g7h8i9", startsAt: "2026-05-12T11:00:00", status: "COMPLETED",   source: "web",      totalPrice: 2500, client: { name: "Rodrigo Silva"   }, barber: { user: { name: "Juan Martínez"  } }, services: [{ service: { name: "Degradé completo" } }] },
  { id: "j1k2l3", startsAt: "2026-05-12T14:00:00", status: "COMPLETED",   source: "manual",   totalPrice: 3500, client: { name: "Diego Torres"    }, barber: { user: { name: "Pedro López"    } }, services: [{ service: { name: "Corte + Barba"    } }] },
  { id: "m4n5o6", startsAt: "2026-05-11T15:30:00", status: "CANCELLED",   source: "whatsapp", totalPrice: 2000, client: { name: "Agustín Ruiz"    }, barber: { user: { name: "Pedro López"    } }, services: [{ service: { name: "Corte clásico"    } }] },
  { id: "p7q8r9", startsAt: "2026-05-13T16:00:00", status: "CONFIRMED",   source: "manual",   totalPrice: 3500, client: { name: "Bruno Molina"    }, barber: { user: { name: "Nicolás García" } }, services: [{ service: { name: "Corte + Barba"    } }] },
  { id: "s1t2u3", startsAt: "2026-05-10T09:30:00", status: "COMPLETED",   source: "web",      totalPrice: 6000, client: { name: "Carlos Ramos"    }, barber: { user: { name: "Carlos Reyes"   } }, services: [{ service: { name: "Peinado de novios"} }] },
  { id: "v4w5x6", startsAt: "2026-05-09T10:00:00", status: "COMPLETED",   source: "manual",   totalPrice: 1500, client: { name: "Matías García"   }, barber: { user: { name: "Juan Martínez"  } }, services: [{ service: { name: "Barba perfilada"  } }] },
  { id: "y7z8a1", startsAt: "2026-05-13T17:00:00", status: "PENDING",     source: "whatsapp", totalPrice: 2000, client: { name: "Tomás Vera"      }, barber: { user: { name: "Nicolás García" } }, services: [{ service: { name: "Corte clásico"    } }] },
];

const FILTERS = ["Todas", "Hoy", "Pendientes", "Confirmadas"];

export default function DemoReservasPage() {
  const [activeFilter, setActiveFilter] = useState("Todas");

  const filtered = MOCK_RESERVAS.filter((r) => {
    const today = new Date().toISOString().split("T")[0];
    const rDate = r.startsAt.split("T")[0];
    if (activeFilter === "Hoy")        return rDate === "2026-05-13";
    if (activeFilter === "Pendientes") return r.status === "PENDING";
    if (activeFilter === "Confirmadas") return r.status === "CONFIRMED";
    return true;
  });

  return (
    <div className="flex flex-col gap-5">

      {/* ── Barra de acciones ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[200px] max-w-xs" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#3F3F46" }} />
          <input placeholder="Buscar reserva..." className="bg-transparent text-white placeholder:text-zinc-600 text-sm outline-none w-full font-body" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium font-body transition-all"
              style={activeFilter === f
                ? { backgroundColor: "#CA8A04", color: "#000" }
                : { backgroundColor: "#111111", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }
              }
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)", color: "#52525B" }}>
            <Filter className="w-4 h-4" />
          </button>
          <Link href="/register" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body text-black transition-all hover:opacity-90" style={{ backgroundColor: "#CA8A04" }}>
            <Plus className="w-4 h-4" />
            Nueva reserva
          </Link>
        </div>
      </div>

      {/* ── Mobile cards ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:hidden rounded-2xl overflow-hidden" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        {filtered.length === 0
          ? <p className="text-center py-10 text-sm font-body" style={{ color: "#3F3F46" }}>Sin reservas</p>
          : filtered.map((r, idx) => {
              const st = STATUS_MAP[r.status] ?? STATUS_MAP.PENDING;
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ borderBottom: idx < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-body flex-shrink-0" style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04" }}>
                    {r.client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate font-body">{r.client.name}</p>
                    <p className="text-xs font-body" style={{ color: "#52525B" }}>
                      {r.barber.user.name.split(" ")[0]} · {formatTime(r.startsAt)} · {formatCurrency(r.totalPrice)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 font-body" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ color: "#3F3F46" }}>
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
        }
      </div>

      {/* ── Desktop tabla ─────────────────────────────────────────────── */}
      <div className="hidden sm:block rounded-2xl overflow-hidden" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider font-body" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#3F3F46" }}>
          <div className="col-span-1">ID</div>
          <div className="col-span-3">Cliente</div>
          <div className="col-span-2 hidden md:block">Barbero</div>
          <div className="col-span-2 hidden lg:block">Servicios</div>
          <div className="col-span-2">Horario</div>
          <div className="col-span-1 hidden sm:block">Total</div>
          <div className="col-span-1">Estado</div>
        </div>
        {filtered.length === 0
          ? <p className="text-center py-16 text-sm font-body" style={{ color: "#3F3F46" }}>Sin reservas para este filtro</p>
          : filtered.map((r, idx) => {
              const st = STATUS_MAP[r.status] ?? STATUS_MAP.PENDING;
              const shortId = r.id.slice(0, 6).toUpperCase();
              return (
                <div key={r.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ borderBottom: idx < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="col-span-1">
                    <span className="text-xs font-mono" style={{ color: "#3F3F46" }}>{shortId}</span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-body flex-shrink-0" style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04" }}>
                      {r.client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate font-body">{r.client.name}</p>
                      <p className="text-xs font-body" style={{ color: "#3F3F46" }}>{SOURCE_ICON[r.source] ?? "✏️"} {r.source}</p>
                    </div>
                  </div>
                  <div className="col-span-2 hidden md:flex items-center gap-1.5 min-w-0">
                    <span className="text-sm truncate font-body" style={{ color: "#71717A" }}>{r.barber.user.name.split(" ")[0]}</span>
                  </div>
                  <div className="col-span-2 hidden lg:flex flex-wrap gap-1">
                    {r.services.slice(0, 2).map(({ service }) => (
                      <span key={service.name} className="text-xs px-2 py-0.5 rounded font-body truncate" style={{ backgroundColor: "#1A1A1A", color: "#52525B" }}>{service.name}</span>
                    ))}
                  </div>
                  <div className="col-span-2 flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-sm font-body" style={{ color: "#A1A1AA" }}>
                      <Clock className="w-3 h-3" style={{ color: "#3F3F46" }} />
                      {formatTime(r.startsAt)}
                    </div>
                    <span className="text-xs font-body" style={{ color: "#3F3F46" }}>{formatDate(r.startsAt)}</span>
                  </div>
                  <div className="col-span-1 hidden sm:block">
                    <span className="text-sm font-semibold text-white font-body">{formatCurrency(r.totalPrice)}</span>
                  </div>
                  <div className="col-span-1 flex items-center gap-2">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full font-body whitespace-nowrap" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5 ml-auto" style={{ color: "#3F3F46" }}>
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}
