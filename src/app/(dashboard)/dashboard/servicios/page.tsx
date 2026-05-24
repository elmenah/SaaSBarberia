"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useOwnerOnly } from "@/hooks/useOwnerOnly";
import { Plus, Edit2, Scissors, Clock, DollarSign, MoreHorizontal, X, Check, Trash2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMins: number;
  category: string;
  isActive: boolean;
  sortOrder: number;
};

type ServiceForm = {
  name: string;
  description: string;
  price: string;
  durationMins: string;
  category: string;
};

const CATEGORIES_LIST = ["Cortes", "Barba", "Combos", "Especiales", "Otros"];
const ALL_CATEGORIES  = ["Todos", ...CATEGORIES_LIST];

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  Cortes:    { color: "#A78BFA", bg: "rgba(167,139,250,0.08)" },
  Combos:    { color: "#CA8A04", bg: "rgba(202,138,4,0.08)"   },
  Barba:     { color: "#3B82F6", bg: "rgba(59,130,246,0.08)"  },
  Especiales:{ color: "#22C55E", bg: "rgba(34,197,94,0.08)"   },
  Otros:     { color: "#71717A", bg: "rgba(113,113,122,0.08)" },
  general:   { color: "#71717A", bg: "rgba(113,113,122,0.08)" },
};

const EMPTY_FORM: ServiceForm = { name: "", description: "", price: "", durationMins: "", category: "Cortes" };

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />;
}

export default function ServiciosPage() {
  useOwnerOnly();
  const { barbershop }   = useAuth();
  const [services,        setServices]       = useState<Service[]>([]);
  const [topServiceName,  setTopServiceName] = useState<string | null>(null);
  const [loading,         setLoading]        = useState(true);
  const [activeCategory,  setActiveCategory] = useState("Todos");
  const [showModal,       setShowModal]      = useState(false);
  const [editing,         setEditing]        = useState<Service | null>(null);
  const [form,            setForm]           = useState<ServiceForm>(EMPTY_FORM);
  const [saving,          setSaving]         = useState(false);
  const [deleteId,        setDeleteId]       = useState<string | null>(null);
  const [error,           setError]          = useState("");

  const fetchServices = useCallback(() => {
    if (!barbershop?.id) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetch("/api/services").then((r) => r.json()),
      fetch(`/api/dashboard/metrics?barbershopId=${barbershop.id}`).then((r) => r.json()),
    ])
      .then(([svcs, metrics]) => {
        setServices(svcs.data ?? []);
        setTopServiceName(metrics.data?.topServices?.[0]?.name ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [barbershop?.id]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filtered = services.filter(
    (s) => activeCategory === "Todos" || s.category === activeCategory
  );

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setError(""); setShowModal(true); }
  function openEdit(s: Service) {
    setEditing(s);
    setForm({ name: s.name, description: s.description ?? "", price: String(s.price), durationMins: String(s.durationMins), category: s.category });
    setError("");
    setShowModal(true);
  }

  async function saveService() {
    setError("");
    const price = parseFloat(form.price);
    const dur   = parseInt(form.durationMins);
    if (!form.name.trim())     return setError("El nombre es obligatorio");
    if (isNaN(price) || price <= 0) return setError("El precio debe ser mayor a 0");
    if (isNaN(dur)   || dur   <= 0) return setError("La duración debe ser mayor a 0");

    setSaving(true);
    try {
      const url    = editing ? `/api/services/${editing.id}` : "/api/services";
      const method = editing ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), description: form.description || undefined, price, durationMins: dur, category: form.category }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error al guardar"); return; }
      setShowModal(false);
      fetchServices();
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await fetch(`/api/services/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchServices();
  }

  const totalRevenue = services.reduce((sum, s) => sum + Number(s.price) * 0, 0); // placeholder
  const activeCount  = services.filter((s) => s.isActive).length;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-2xl" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Skeleton className="h-5 w-16 mb-2" /><Skeleton className="h-3 w-24" />
              </div>
            ))
          : [
              { label: "Servicios activos",   value: activeCount,                                       icon: Scissors,   color: "#CA8A04" },
              { label: "Total servicios",     value: services.length,                                   icon: Clock,      color: "#3B82F6" },
              { label: "Categorías",          value: new Set(services.map(s => s.category)).size,       icon: null,       color: "#22C55E" },
              { label: "Más pedido (mes)",    value: topServiceName ?? "—",                             icon: DollarSign, color: "#8B5CF6" },
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
            ))
        }
      </div>

      {/* ── Barra de categorías + acción ──────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {ALL_CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium font-body transition-all"
              style={activeCategory === cat
                ? { backgroundColor: "#CA8A04", color: "#000" }
                : { backgroundColor: "#111111", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }}>
              {cat}
            </button>
          ))}
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body text-black transition-all hover:opacity-90"
          style={{ backgroundColor: "#CA8A04" }}>
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {/* ── Grid de cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl flex flex-col gap-4"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))
          : filtered.length === 0 && !loading
            ? null
            : filtered.map((service) => {
                const cat = CATEGORY_COLORS[service.category] ?? CATEGORY_COLORS.general;
                return (
                  <div key={service.id}
                    className={cn("p-5 rounded-2xl flex flex-col gap-4 transition-all group hover:border-white/10", !service.isActive && "opacity-60")}
                    style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <p className="text-sm font-semibold text-white font-body">{service.name}</p>
                          {!service.isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-body font-semibold"
                              style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444" }}>Inactivo</span>
                          )}
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full font-body font-semibold"
                          style={{ backgroundColor: cat.bg, color: cat.color }}>{service.category}</span>
                        {service.description && (
                          <p className="text-xs font-body mt-2 line-clamp-2" style={{ color: "#52525B" }}>{service.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button onClick={() => openEdit(service)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                          style={{ color: "#52525B" }}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(service.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                          style={{ color: "#52525B" }}>
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
                        <span className="text-lg font-bold text-white font-body">{formatCurrency(Number(service.price))}</span>
                      </div>
                      <div className="flex items-center gap-1.5" style={{ color: "#52525B" }}>
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-sm font-body">{service.durationMins} min</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <span className="text-xs font-body" style={{ color: "#3F3F46" }}>#{service.sortOrder}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: service.isActive ? "#22C55E" : "#3F3F46" }} />
                        <span className="text-xs font-body" style={{ color: service.isActive ? "#22C55E" : "#3F3F46" }}>
                          {service.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
        }

        {/* Card vacío — agregar */}
        {!loading && (
          <button onClick={openAdd}
            className="p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:border-yellow-600/20 min-h-[160px]"
            style={{ backgroundColor: "#0D0D0D", border: "2px dashed rgba(255,255,255,0.06)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.15)" }}>
              <Plus className="w-5 h-5" style={{ color: "#CA8A04" }} />
            </div>
            <span className="text-sm font-body font-semibold" style={{ color: "#52525B" }}>Agregar servicio</span>
          </button>
        )}
      </div>

      {filtered.length === 0 && !loading && (
        <p className="text-center py-10 text-sm font-body" style={{ color: "#3F3F46" }}>
          {services.length === 0
            ? 'Sin servicios aún — agregá el primero con "Nuevo servicio"'
            : "Sin servicios en esta categoría"}
        </p>
      )}

      {/* ── Modal crear/editar ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-medium text-white">{editing ? "Editar servicio" : "Nuevo servicio"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5" style={{ color: "#52525B" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Nombre */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>Nombre</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Corte clásico" className="input-dark" />
              </div>
              {/* Descripción */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>Descripción <span style={{ color: "#3F3F46" }}>(opcional)</span></label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Breve descripción del servicio" className="input-dark" />
              </div>
              {/* Precio + Duración */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>Precio ($)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="2000" className="input-dark" min="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>Duración (min)</label>
                  <input type="number" value={form.durationMins} onChange={(e) => setForm((f) => ({ ...f, durationMins: e.target.value }))}
                    placeholder="30" className="input-dark" min="5" />
                </div>
              </div>
              {/* Categoría */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-2" style={{ color: "#52525B" }}>Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES_LIST.map((cat) => (
                    <button key={cat} onClick={() => setForm((f) => ({ ...f, category: cat }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-all"
                      style={form.category === cat
                        ? { backgroundColor: "#CA8A04", color: "#000" }
                        : { backgroundColor: "#1A1A1A", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="text-xs font-body text-center" style={{ color: "#EF4444" }}>{error}</p>}

            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
              <button onClick={saveService} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#CA8A04" }}>
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear servicio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar ───────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(239,68,68,0.08)" }}>
              <Trash2 className="w-5 h-5" style={{ color: "#EF4444" }} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-white font-body mb-1">¿Desactivar servicio?</h3>
              <p className="text-sm font-body" style={{ color: "#71717A" }}>El servicio quedará inactivo y no aparecerá para nuevas reservas. El historial se conserva.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-white hover:opacity-90"
                style={{ backgroundColor: "#EF4444" }}>Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
