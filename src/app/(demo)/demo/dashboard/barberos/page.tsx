"use client";

import { useState } from "react";
import {
  Plus, Edit2, Trash2, X, Check,
  Calendar, DollarSign, Scissors, Power, Crown,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type Barber = {
  id: string;
  name: string;
  specialty: string;
  color: string;
  initials: string;
  phone: string;
  active: boolean;
  appointmentsMonth: number;
  revenueMonth: number;
  rating: number;
  joinedAt: string;
  isOwner?: boolean;
};

const INITIAL_BARBERS: Barber[] = [
  { id: "owner", name: "Nicolás García",  specialty: "Corte clásico & Degradé",  color: "#14B8A6", initials: "NG", phone: "+56 9 0000 1111", active: true,  appointmentsMonth: 54, revenueMonth: 864000,  rating: 5.0, joinedAt: "2023-01", isOwner: true },
  { id: "b1",    name: "Juan Martínez",  specialty: "Degradé & Cortes modernos", color: "#F59E0B", initials: "JM", phone: "+56 9 1111 2222", active: true,  appointmentsMonth: 87, revenueMonth: 1218000, rating: 4.9, joinedAt: "2024-03" },
  { id: "b2",    name: "Pedro López",    specialty: "Corte clásico & Barba",     color: "#3B82F6", initials: "PL", phone: "+56 9 3333 4444", active: true,  appointmentsMonth: 72, revenueMonth: 936000,  rating: 4.7, joinedAt: "2024-06" },
  { id: "b3",    name: "Carlos Reyes",   specialty: "Estilismo & Color",          color: "#8B5CF6", initials: "CR", phone: "+56 9 5555 6666", active: false, appointmentsMonth: 0,  revenueMonth: 0,       rating: 4.8, joinedAt: "2025-01" },
];

const COLORS = ["#CA8A04","#3B82F6","#8B5CF6","#22C55E","#EF4444","#F59E0B","#EC4899","#14B8A6"];
const EMPTY_FORM = { name: "", specialty: "", phone: "", color: "#CA8A04" };

export default function DemoBarberosPage() {
  const [barbers, setBarbers]     = useState<Barber[]>(INITIAL_BARBERS);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Barber | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(b: Barber) { setEditing(b); setForm({ name: b.name, specialty: b.specialty, phone: b.phone, color: b.color }); setShowModal(true); }

  function saveBarber() {
    if (!form.name.trim() || !form.specialty.trim()) return;
    if (editing) {
      setBarbers((prev) => prev.map((b) => b.id === editing.id
        ? { ...b, name: form.name, specialty: form.specialty, phone: form.phone, color: form.color, initials: form.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() }
        : b
      ));
    } else {
      setBarbers((prev) => [...prev, {
        id: `b${Date.now()}`, name: form.name, specialty: form.specialty, phone: form.phone,
        color: form.color, initials: form.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase(),
        active: true, appointmentsMonth: 0, revenueMonth: 0, rating: 0, joinedAt: new Date().toISOString().slice(0,7),
      }]);
    }
    setShowModal(false);
  }

  function toggleActive(id: string) { setBarbers((prev) => prev.map((b) => b.id === id ? { ...b, active: !b.active } : b)); }
  function doDelete() { if (deleteId) setBarbers((prev) => prev.filter((b) => b.id !== deleteId)); setDeleteId(null); }

  const activeCount   = barbers.filter((b) => b.active).length;
  const totalRevenue  = barbers.reduce((s, b) => s + b.revenueMonth, 0);
  const totalAppts    = barbers.reduce((s, b) => s + b.appointmentsMonth, 0);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Barberos totales",  value: barbers.length,               icon: Scissors,   color: "#CA8A04" },
          { label: "Activos este mes",  value: activeCount,                  icon: Power,      color: "#22C55E" },
          { label: "Turnos este mes",   value: totalAppts,                   icon: Calendar,   color: "#3B82F6" },
          { label: "Ingresos del mes",  value: formatCurrency(totalRevenue), icon: DollarSign, color: "#8B5CF6" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-2xl flex items-center gap-2 min-w-0"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: s.color + "18" }}>
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white font-body truncate">{s.value}</p>
              <p className="text-xs font-body truncate" style={{ color: "#52525B" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Header + botón ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-body" style={{ color: "#52525B" }}>
          {barbers.length} barbero{barbers.length !== 1 ? "s" : ""} registrado{barbers.length !== 1 ? "s" : ""}
        </p>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body text-black transition-all hover:opacity-90"
          style={{ backgroundColor: "#CA8A04" }}>
          <Plus className="w-4 h-4" />
          Agregar barbero
        </button>
      </div>

      {/* ── Grid de cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {barbers.map((b) => (
          <div
            key={b.id}
            className={cn("relative p-5 rounded-2xl flex flex-col gap-4 transition-all", !b.active && "opacity-60")}
            style={{
              backgroundColor: "#111111",
              border: b.isOwner
                ? "1px solid rgba(202,138,4,0.25)"
                : `1px solid ${b.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}`,
            }}
          >
            {b.isOwner && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-body font-semibold"
                style={{ backgroundColor: "rgba(202,138,4,0.12)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.25)" }}>
                <Crown className="w-3 h-3" /> Dueño
              </div>
            )}
            {!b.active && !b.isOwner && (
              <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-body font-semibold"
                style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                Inactivo
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold font-body flex-shrink-0"
                style={{ backgroundColor: b.color + "22", color: b.color }}>
                {b.initials}
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-white font-body truncate">{b.name}</p>
                <p className="text-xs font-body truncate" style={{ color: "#71717A" }}>{b.specialty}</p>
                {b.phone && <p className="text-xs font-body mt-0.5" style={{ color: "#3F3F46" }}>{b.phone}</p>}
              </div>
            </div>

            {b.active && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Turnos",   value: b.appointmentsMonth },
                  { label: "Ingresos", value: formatCurrency(b.revenueMonth) },
                  { label: "Rating",   value: b.rating > 0 ? `★ ${b.rating}` : "—" },
                ].map((st) => (
                  <div key={st.label} className="p-2 rounded-xl text-center" style={{ backgroundColor: "#0D0D0D" }}>
                    <p className="text-sm font-bold text-white font-body">{st.value}</p>
                    <p className="text-xs font-body" style={{ color: "#3F3F46" }}>{st.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {!b.isOwner && (
                <button
                  onClick={() => toggleActive(b.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-all flex-1 justify-center"
                  style={b.active
                    ? { backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }
                    : { backgroundColor: "rgba(34,197,94,0.08)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.15)" }
                  }
                >
                  <Power className="w-3.5 h-3.5" />
                  {b.active ? "Desactivar" : "Activar"}
                </button>
              )}
              {b.isOwner ? (
                <button
                  onClick={() => openEdit(b)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-all flex-1 justify-center hover:opacity-80"
                  style={{ backgroundColor: "rgba(202,138,4,0.08)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar mi perfil
                </button>
              ) : (
                <>
                  <button onClick={() => openEdit(b)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                    style={{ color: "#71717A", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(b.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                    style={{ color: "#3F3F46", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        <button onClick={openAdd}
          className="p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:border-yellow-600/20 min-h-[180px]"
          style={{ backgroundColor: "#0D0D0D", border: "2px dashed rgba(255,255,255,0.06)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.15)" }}>
            <Plus className="w-5 h-5" style={{ color: "#CA8A04" }} />
          </div>
          <p className="text-sm font-semibold font-body" style={{ color: "#52525B" }}>Agregar barbero</p>
        </button>
      </div>

      {/* ── Modal agregar/editar ───────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-5" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-medium text-white">{editing ? "Editar barbero" : "Agregar barbero"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5" style={{ color: "#52525B" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold font-body flex-shrink-0"
                style={{ backgroundColor: form.color + "22", color: form.color }}>
                {form.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "??"}
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-body">{form.name || "Nombre del barbero"}</p>
                <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>{form.specialty || "Especialidad"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { key: "name",      label: "Nombre completo",    placeholder: "Ej: Juan Martínez",            type: "text" },
                { key: "specialty", label: "Especialidad",        placeholder: "Ej: Degradé & Cortes modernos", type: "text" },
                { key: "phone",     label: "Teléfono (WhatsApp)", placeholder: "+56 9 XXXX XXXX",              type: "tel"  },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>{label}</label>
                  <input type={type} value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder} className="input-dark" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-2" style={{ color: "#52525B" }}>Color del avatar</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-8 h-8 rounded-lg transition-all flex items-center justify-center"
                      style={{ backgroundColor: c, outline: form.color === c ? `2px solid ${c}` : "none", outlineOffset: "2px", transform: form.color === c ? "scale(1.15)" : "scale(1)" }}>
                      {form.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
              <button onClick={saveBarber} disabled={!form.name.trim() || !form.specialty.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90 disabled:opacity-30"
                style={{ backgroundColor: "#CA8A04" }}>
                {editing ? "Guardar cambios" : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar ───────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4" style={{ backgroundColor: "#111111", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(239,68,68,0.08)" }}>
              <Trash2 className="w-5 h-5" style={{ color: "#EF4444" }} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-white font-body mb-1">¿Eliminar barbero?</h3>
              <p className="text-sm font-body" style={{ color: "#71717A" }}>Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
              <button onClick={doDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-white hover:opacity-90" style={{ backgroundColor: "#EF4444" }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
