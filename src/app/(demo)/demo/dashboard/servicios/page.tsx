"use client";

import { useState } from "react";
import { Plus, Edit2, Scissors, Clock, DollarSign, MoreHorizontal, X, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const MOCK_SERVICES = [
  { id: "1", name: "Corte clásico",    category: "Cortes",    price: 2000, durationMins: 30, isActive: true,  bookings: 142 },
  { id: "2", name: "Corte + Barba",    category: "Combos",    price: 3500, durationMins: 60, isActive: true,  bookings: 98  },
  { id: "3", name: "Degradé completo", category: "Cortes",    price: 2500, durationMins: 45, isActive: true,  bookings: 76  },
  { id: "4", name: "Barba perfilada",  category: "Barba",     price: 1500, durationMins: 30, isActive: true,  bookings: 54  },
  { id: "5", name: "Barba completa",   category: "Barba",     price: 2000, durationMins: 40, isActive: true,  bookings: 31  },
  { id: "6", name: "Peinado de novios",category: "Especiales",price: 6000, durationMins: 90, isActive: false, bookings: 12  },
];

const CATEGORIES = ["Todos", "Cortes", "Barba", "Combos", "Especiales"];

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  Cortes:    { color: "#A78BFA", bg: "rgba(167,139,250,0.08)" },
  Combos:    { color: "#CA8A04", bg: "rgba(202,138,4,0.08)"   },
  Barba:     { color: "#3B82F6", bg: "rgba(59,130,246,0.08)"  },
  Especiales:{ color: "#22C55E", bg: "rgba(34,197,94,0.08)"   },
  general:   { color: "#71717A", bg: "rgba(113,113,122,0.08)" },
};

export default function DemoServiciosPage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [showModal, setShowModal]           = useState(false);

  const filtered = MOCK_SERVICES.filter(
    (s) => activeCategory === "Todos" || s.category === activeCategory
  );

  const totalRevenue = MOCK_SERVICES.reduce((sum, s) => sum + s.bookings * s.price, 0);
  const activeCount  = MOCK_SERVICES.filter((s) => s.isActive).length;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Servicios activos",   value: activeCount,                icon: Scissors,   color: "#CA8A04" },
          { label: "Reservas totales",    value: MOCK_SERVICES.reduce((s,x) => s + x.bookings, 0), icon: Clock, color: "#3B82F6" },
          { label: "Servicio más pedido", value: "Corte clásico",           icon: null,        color: "#22C55E" },
          { label: "Ingresos totales",    value: formatCurrency(totalRevenue), icon: DollarSign, color: "#8B5CF6" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl flex items-center gap-3"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            {s.icon && (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: s.color + "18" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-white font-body truncate">{s.value}</p>
              <p className="text-xs font-body truncate" style={{ color: "#52525B" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barra de categorías ───────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium font-body transition-all"
              style={
                activeCategory === cat
                  ? { backgroundColor: "#CA8A04", color: "#000" }
                  : { backgroundColor: "#111111", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body text-black transition-all hover:opacity-90"
          style={{ backgroundColor: "#CA8A04" }}
        >
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {/* ── Grid de cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((service) => {
          const cat = CATEGORY_COLORS[service.category] ?? CATEGORY_COLORS.general;
          return (
            <div
              key={service.id}
              className={cn(
                "p-5 rounded-2xl flex flex-col gap-4 transition-all group hover:border-white/10",
                !service.isActive && "opacity-60"
              )}
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-white font-body">{service.name}</p>
                    {!service.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-body font-semibold"
                        style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
                        Inactivo
                      </span>
                    )}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-body font-semibold"
                    style={{ backgroundColor: cat.bg, color: cat.color }}>
                    {service.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                    style={{ color: "#52525B" }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                    style={{ color: "#52525B" }}>
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
                  <span className="text-lg font-bold text-white font-body">{formatCurrency(service.price)}</span>
                </div>
                <div className="flex items-center gap-1.5" style={{ color: "#52525B" }}>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm font-body">{service.durationMins} min</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-xs font-body" style={{ color: "#3F3F46" }}>
                  {service.bookings} reservas totales
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", service.isActive ? "" : "")}
                    style={{ backgroundColor: service.isActive ? "#22C55E" : "#3F3F46" }} />
                  <span className="text-xs font-body" style={{ color: service.isActive ? "#22C55E" : "#3F3F46" }}>
                    {service.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Card agregar */}
        <button
          onClick={() => setShowModal(true)}
          className="p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:border-yellow-600/20 min-h-[160px]"
          style={{ backgroundColor: "#0D0D0D", border: "2px dashed rgba(255,255,255,0.06)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.15)" }}>
            <Plus className="w-5 h-5" style={{ color: "#CA8A04" }} />
          </div>
          <span className="text-sm font-body font-semibold" style={{ color: "#52525B" }}>
            Agregar servicio
          </span>
        </button>
      </div>

      {/* ── Modal demo (no guarda nada) ───────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowModal(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-medium text-white">Nuevo servicio</h2>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
                style={{ color: "#52525B" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 rounded-xl text-center"
              style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.15)" }}>
              <p className="text-sm font-body font-semibold text-white mb-1">Estás en modo demo</p>
              <p className="text-xs font-body" style={{ color: "#71717A" }}>
                Creá tu cuenta gratuita para agregar tus servicios reales y que tus clientes puedan agendarlos online.
              </p>
            </div>
            <a
              href="/register"
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold font-body text-black hover:opacity-90 transition-all"
              style={{ backgroundColor: "#CA8A04" }}
            >
              <Check className="w-4 h-4" />
              Crear mi cuenta gratis
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
