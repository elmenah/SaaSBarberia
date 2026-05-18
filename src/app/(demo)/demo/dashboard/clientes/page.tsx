"use client";

import { useState } from "react";
import { Search, Plus, Filter, Star, Phone, Mail, Calendar, MoreHorizontal, TrendingUp, Zap, Hash, Gift } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const CLIENTS = [
  { id: "1", name: "Lucas Pérez",   phone: "+56 9 1234 5678", email: "lucas@email.com",  rut: "12.345.678-9", totalVisits: 24, totalSpent: 480000, lastVisitAt: "2026-05-10", isVip: true,  tags: ["Regular", "Puntual"],  daysAgo: 3  },
  { id: "2", name: "Matías García", phone: "+56 9 8765 4321", email: "mati@email.com",   rut: null,           totalVisits: 12, totalSpent: 228000, lastVisitAt: "2026-05-08", isVip: false, tags: ["Nuevo"],               daysAgo: 5  },
  { id: "3", name: "Rodrigo Silva", phone: "+56 9 5555 9999", email: null,               rut: "9.876.543-2",  totalVisits: 8,  totalSpent: 152000, lastVisitAt: "2026-04-28", isVip: false, tags: ["Degradé"],             daysAgo: 15 },
  { id: "4", name: "Diego Torres",  phone: "+56 9 4444 8888", email: "diego@email.com",  rut: "15.432.109-K", totalVisits: 31, totalSpent: 682000, lastVisitAt: "2026-05-12", isVip: true,  tags: ["VIP", "Referidor"],    daysAgo: 1  },
  { id: "5", name: "Agustín Ruiz",  phone: "+56 9 3333 7777", email: null,               rut: null,           totalVisits: 5,  totalSpent: 85000,  lastVisitAt: "2026-03-20", isVip: false, tags: ["Inactivo"],            daysAgo: 54 },
  { id: "6", name: "Bruno Molina",  phone: "+56 9 2222 5555", email: "bruno@email.com",  rut: null,           totalVisits: 18, totalSpent: 342000, lastVisitAt: "2026-05-13", isVip: false, tags: ["Regular"],             daysAgo: 0  },
];

const AVATAR_COLORS = ["#CA8A04","#3B82F6","#8B5CF6","#22C55E","#EF4444","#14B8A6"];

const LOYALTY_GOAL = 5;
function getPunchCard(visits: number) {
  const progress   = visits % LOYALTY_GOAL;
  const justEarned = progress === 0 && visits > 0;
  const discount10 = visits > 0 && visits % 10 === 0;
  return { progress, justEarned, discount10 };
}

export default function DemoClientesPage() {
  const [activeTab, setActiveTab] = useState<"todos" | "vip" | "inactivos">("todos");

  const filtered = CLIENTS.filter((c) => {
    if (activeTab === "vip")       return c.isVip;
    if (activeTab === "inactivos") return c.daysAgo >= 21;
    return true;
  });

  const stats = [
    { label: "Total clientes",   value: CLIENTS.length,                             icon: "👥", color: "#CA8A04" },
    { label: "Clientes VIP",     value: CLIENTS.filter((c) => c.isVip).length,      icon: "⭐", color: "#F59E0B" },
    { label: "Nuevos este mes",  value: 3,                                           icon: "✨", color: "#22C55E" },
    { label: "Inactivos +21d",   value: CLIENTS.filter((c) => c.daysAgo >= 21).length, icon: "⚠️", color: "#EF4444" },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-xl flex items-center gap-3"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xl font-bold text-white font-body">{s.value}</p>
              <p className="text-xs font-body" style={{ color: "#52525B" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barra de acciones ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl overflow-hidden p-0.5 gap-0.5"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          {([["todos","Todos"],["vip","VIP ⭐"],["inactivos","Inactivos ⚠️"]] as const).map(([val, label]) => (
            <button key={val} onClick={() => setActiveTab(val)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold font-body transition-all"
              style={activeTab === val ? { backgroundColor: "#CA8A04", color: "#000" } : { color: "#52525B" }}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[180px] max-w-xs"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#3F3F46" }} />
          <input placeholder="Buscar cliente..." className="bg-transparent text-white placeholder:text-zinc-600 text-sm outline-none w-full font-body" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)", color: "#52525B" }}>
            <Filter className="w-4 h-4" />
          </button>
          {activeTab === "inactivos" && (
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body transition-all hover:opacity-90"
              style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.25)" }}>
              <Zap className="w-4 h-4" />
              Enviar promo
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body text-black transition-all hover:opacity-90"
            style={{ backgroundColor: "#CA8A04" }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo cliente</span>
          </button>
        </div>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider font-body"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#3F3F46" }}>
          <div className="col-span-3">Cliente</div>
          <div className="col-span-2 hidden md:block">Contacto</div>
          <div className="col-span-2 hidden lg:block">Visitas</div>
          <div className="col-span-2 hidden lg:block">Total gastado</div>
          <div className="col-span-2 hidden md:block">Última visita</div>
          <div className="col-span-9 md:col-span-1" />
        </div>

        {filtered.map((c, idx) => (
          <div
            key={c.id}
            className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
            style={{
              borderBottom: idx < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              opacity: c.daysAgo >= 21 && activeTab !== "vip" ? 0.7 : 1,
            }}
          >
            {/* Avatar + nombre */}
            <div className="col-span-3 flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-body flex-shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] + "22", color: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                {c.name.split(" ").map(n => n[0]).join("").slice(0,2)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate font-body">{c.name}</p>
                  {c.isVip && <Star className="w-3 h-3 flex-shrink-0" style={{ color: "#F59E0B" }} fill="#F59E0B" />}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {c.tags.slice(0,2).map((tag) => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded font-body"
                      style={{ backgroundColor: "#1A1A1A", color: "#52525B" }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="col-span-2 hidden md:flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-body" style={{ color: "#71717A" }}>
                <Phone className="w-3 h-3 flex-shrink-0" style={{ color: "#3F3F46" }} />
                <span className="truncate">{c.phone}</span>
              </div>
              {c.email && (
                <div className="flex items-center gap-1.5 text-xs font-body" style={{ color: "#52525B" }}>
                  <Mail className="w-3 h-3 flex-shrink-0" style={{ color: "#3F3F46" }} />
                  <span className="truncate">{c.email}</span>
                </div>
              )}
              {c.rut && (
                <div className="flex items-center gap-1.5 text-xs font-body" style={{ color: "#3F3F46" }}>
                  <Hash className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{c.rut}</span>
                </div>
              )}
            </div>

            {/* Visitas + Punch card */}
            <div className="col-span-2 hidden lg:flex flex-col gap-1.5">
              {(() => {
                const { progress, justEarned, discount10 } = getPunchCard(c.totalVisits);
                return (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: LOYALTY_GOAL }).map((_, i) => (
                          <div key={i} className="w-3 h-3 rounded-full transition-all"
                            style={{
                              backgroundColor: i < progress || justEarned ? "#CA8A04" : "rgba(255,255,255,0.08)",
                              transform: i < progress ? "scale(1)" : "scale(0.85)",
                            }} />
                        ))}
                      </div>
                      <span className="text-xs font-body font-semibold text-white">{c.totalVisits}</span>
                    </div>
                    {justEarned && (
                      <span className="flex items-center gap-1 text-[10px] font-body font-semibold" style={{ color: "#22C55E" }}>
                        <Gift className="w-3 h-3" /> ¡Gratis enviado!
                      </span>
                    )}
                    {discount10 && !justEarned && (
                      <span className="flex items-center gap-1 text-[10px] font-body font-semibold" style={{ color: "#CA8A04" }}>
                        <Gift className="w-3 h-3" /> Descuento #10
                      </span>
                    )}
                    {!justEarned && !discount10 && (
                      <span className="text-[10px] font-body" style={{ color: "#3F3F46" }}>
                        {LOYALTY_GOAL - progress} para gratis
                      </span>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Gastado */}
            <div className="col-span-2 hidden lg:flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" style={{ color: "#22C55E" }} />
              <span className="text-sm font-semibold text-white font-body">{formatCurrency(c.totalSpent)}</span>
            </div>

            {/* Última visita */}
            <div className="col-span-2 hidden md:flex items-center gap-1.5 text-sm font-body"
              style={{ color: c.daysAgo >= 21 ? "#EF4444" : "#71717A" }}>
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.daysAgo >= 21 ? "#EF4444" : "#3F3F46" }} />
              <span>{formatDate(c.lastVisitAt)}</span>
              {c.daysAgo >= 21 && (
                <span className="text-xs px-1.5 py-0.5 rounded font-body"
                  style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444" }}>{c.daysAgo}d</span>
              )}
            </div>

            {/* Acciones */}
            <div className="col-span-9 md:col-span-1 flex justify-end">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                style={{ color: "#3F3F46" }}>
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
