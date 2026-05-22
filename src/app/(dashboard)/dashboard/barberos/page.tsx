"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Plus, Edit2, Trash2, X, Check,
  Calendar, DollarSign, Scissors, Power, Crown,
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";

type BarberFromAPI = {
  id: string;
  userId: string;
  colorTag: string | null;
  specialties: string[];
  bio: string | null;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string; phone: string | null; email: string };
  stats?: { turnosMes: number; ingresosMes: number };
};

type BarberForm = { name: string; specialty: string; phone: string; color: string; email: string };

const COLORS = ["#CA8A04","#3B82F6","#8B5CF6","#22C55E","#EF4444","#F59E0B","#EC4899","#14B8A6"];
const EMPTY_FORM: BarberForm = { name: "", specialty: "", phone: "", color: "#CA8A04", email: "" };

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function MibarberiaPage() {
  const { barbershop, user } = useAuth();
  const [barbers,    setBarbers]    = useState<BarberFromAPI[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState<BarberFromAPI | null>(null);
  const [form,       setForm]       = useState<BarberForm>(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [error,      setError]      = useState("");

  // Estado para crear perfil propio del dueño
  const [ownerHasProfile, setOwnerHasProfile] = useState<boolean | null>(null);
  const [creatingProfile,  setCreatingProfile]  = useState(false);
  const [showCreateMe,     setShowCreateMe]     = useState(false);
  const [meForm,           setMeForm]           = useState({ specialty: "", colorTag: "#CA8A04", phone: "" });

  const fetchBarbers = useCallback(() => {
    if (!barbershop?.id) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetch("/api/barbers?includeStats=true").then((r) => r.json()),
      fetch("/api/barbers/me").then((r) => r.json()),
    ])
      .then(([{ data: barberList }, { data: me }]) => {
        setBarbers(barberList ?? []);
        setOwnerHasProfile(!!me);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [barbershop?.id]);

  useEffect(() => { fetchBarbers(); }, [fetchBarbers]);

  async function crearPerfilPropio() {
    if (!meForm.specialty.trim()) return;
    setCreatingProfile(true);
    try {
      const res = await fetch("/api/barbers/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty: meForm.specialty, colorTag: meForm.colorTag, phone: meForm.phone || undefined }),
      });
      if (res.ok) { setShowCreateMe(false); fetchBarbers(); }
    } finally { setCreatingProfile(false); }
  }

  // Detectar si un barbero es el dueño (su userId coincide con el del barbershop)
  // Como el barbershop no devuelve ownerId, usamos el email del user autenticado
  function isOwner(b: BarberFromAPI) {
    return b.user.email === user?.email;
  }

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setError(""); setShowModal(true); }
  function openEdit(b: BarberFromAPI) {
    setEditing(b);
    setForm({
      name: b.user.name,
      specialty: b.specialties[0] ?? "",
      phone: b.user.phone ?? "",
      color: b.colorTag ?? "#CA8A04",
      email: b.user.email,
    });
    setError("");
    setShowModal(true);
  }

  async function saveBarber() {
    setError("");
    if (!form.name.trim())     return setError("El nombre es obligatorio");
    if (!form.specialty.trim()) return setError("La especialidad es obligatoria");

    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/barbers/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), specialty: form.specialty.trim(), phone: form.phone || undefined, colorTag: form.color }),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error al guardar"); return; }
      } else {
        const res = await fetch("/api/barbers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), specialty: form.specialty.trim(), phone: form.phone || undefined, colorTag: form.color, email: form.email || undefined }),
        });
        if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error al guardar"); return; }
      }
      setShowModal(false);
      fetchBarbers();
    } catch { setError("Error de conexión"); }
    finally { setSaving(false); }
  }

  async function toggleActive(b: BarberFromAPI) {
    await fetch(`/api/barbers/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    fetchBarbers();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await fetch(`/api/barbers/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    fetchBarbers();
  }

  const activeCount  = barbers.filter((b) => b.isActive).length;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-3 rounded-2xl" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Skeleton className="h-5 w-12 mb-2" /><Skeleton className="h-3 w-20" />
              </div>
            ))
          : (() => {
              const totalTurnos   = barbers.reduce((sum, b) => sum + (b.stats?.turnosMes   ?? 0), 0);
              const totalIngresos = barbers.reduce((sum, b) => sum + (b.stats?.ingresosMes ?? 0), 0);
              return [
                { label: "Mibarberia totales", value: barbers.length,              icon: Scissors,   color: "#CA8A04" },
                { label: "Activos",          value: activeCount,                 icon: Power,      color: "#22C55E" },
                { label: "Turnos este mes",  value: totalTurnos,                 icon: Calendar,   color: "#3B82F6" },
                { label: "Ingresos del mes", value: formatCurrency(totalIngresos), icon: DollarSign, color: "#8B5CF6" },
              ];
            })().map((s) => (
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
            ))
        }
      </div>

      {/* ── Header + botón ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-body" style={{ color: "#52525B" }}>
          {loading ? "Cargando..." : `${barbers.length} barbero${barbers.length !== 1 ? "s" : ""} registrado${barbers.length !== 1 ? "s" : ""}`}
        </p>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body text-black transition-all hover:opacity-90"
          style={{ backgroundColor: "#CA8A04" }}>
          <Plus className="w-4 h-4" />
          Agregar barbero
        </button>
      </div>

      {/* ── Banner: el dueño no tiene perfil de barbero ──────────────── */}
      {!loading && ownerHasProfile === false && !showCreateMe && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl"
          style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.2)" }}>
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 flex-shrink-0" style={{ color: "#CA8A04" }} />
            <div>
              <p className="text-sm font-semibold text-white font-body">Vos también sos barbero</p>
              <p className="text-xs font-body mt-0.5" style={{ color: "#71717A" }}>
                Creá tu perfil para aparecer en la agenda y en la página de reservas.
              </p>
            </div>
          </div>
          <button onClick={() => setShowCreateMe(true)}
            className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold font-body text-black hover:opacity-90 transition-all"
            style={{ backgroundColor: "#CA8A04" }}>
            Crear mi perfil
          </button>
        </div>
      )}

      {/* ── Form crear perfil propio ──────────────────────────────────── */}
      {showCreateMe && (
        <div className="flex flex-col gap-4 p-5 rounded-2xl"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(202,138,4,0.2)" }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white font-body">Crear mi perfil de barbero</p>
            <button onClick={() => setShowCreateMe(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5"
              style={{ color: "#52525B" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>Especialidad</label>
              <input type="text" value={meForm.specialty}
                onChange={(e) => setMeForm((f) => ({ ...f, specialty: e.target.value }))}
                placeholder="Ej: Degradé & Cortes modernos"
                className="input-dark w-full" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>Teléfono (opcional)</label>
              <input type="tel" value={meForm.phone}
                onChange={(e) => setMeForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+56 9 XXXX XXXX"
                className="input-dark w-full" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-2" style={{ color: "#52525B" }}>Color del avatar</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setMeForm((f) => ({ ...f, colorTag: c }))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: c, outline: meForm.colorTag === c ? `2px solid ${c}` : "none", outlineOffset: "2px", transform: meForm.colorTag === c ? "scale(1.15)" : "scale(1)" }}>
                  {meForm.colorTag === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreateMe(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body"
              style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
            <button onClick={crearPerfilPropio}
              disabled={creatingProfile || !meForm.specialty.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-black hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: "#CA8A04" }}>
              {creatingProfile ? "Creando..." : "Crear perfil"}
            </button>
          </div>
        </div>
      )}

      {/* ── Grid de cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl flex flex-col gap-4"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
                  <div className="flex flex-col gap-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
                </div>
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-9 rounded-xl" />
              </div>
            ))
          : barbers.map((b) => {
              const color   = b.colorTag ?? "#CA8A04";
              const owner   = isOwner(b);
              return (
                <div
                  key={b.id}
                  className={cn("relative p-5 rounded-2xl flex flex-col gap-4 transition-all", !b.isActive && "opacity-60")}
                  style={{
                    backgroundColor: "#111111",
                    border: owner
                      ? "1px solid rgba(202,138,4,0.25)"
                      : `1px solid ${b.isActive ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  {owner && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-body font-semibold"
                      style={{ backgroundColor: "rgba(202,138,4,0.12)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.25)" }}>
                      <Crown className="w-3 h-3" /> Dueño
                    </div>
                  )}
                  {!b.isActive && !owner && (
                    <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-body font-semibold"
                      style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#EF4444" }}>Inactivo</div>
                  )}

                  {/* Cabecera */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold font-body flex-shrink-0"
                      style={{ backgroundColor: color + "22", color }}>
                      {getInitials(b.user.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-white font-body truncate">{b.user.name}</p>
                      <p className="text-xs font-body truncate" style={{ color: "#71717A" }}>
                        {b.specialties[0] ?? "Sin especialidad"}
                      </p>
                      {b.user.phone && (
                        <p className="text-xs font-body mt-0.5" style={{ color: "#3F3F46" }}>{b.user.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats del mes */}
                  {b.isActive && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Turnos",   value: String(b.stats?.turnosMes ?? 0) },
                        { label: "Ingresos", value: formatCurrency(b.stats?.ingresosMes ?? 0) },
                      ].map((st) => (
                        <div key={st.label} className="p-2 rounded-xl text-center" style={{ backgroundColor: "#0D0D0D" }}>
                          <p className="text-sm font-bold text-white font-body">{st.value}</p>
                          <p className="text-xs font-body" style={{ color: "#3F3F46" }}>{st.label} (mes)</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center gap-2 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    {!owner && (
                      <button onClick={() => toggleActive(b)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-all flex-1 justify-center"
                        style={b.isActive
                          ? { backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }
                          : { backgroundColor: "rgba(34,197,94,0.08)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.15)" }}>
                        <Power className="w-3.5 h-3.5" />
                        {b.isActive ? "Desactivar" : "Activar"}
                      </button>
                    )}
                    {owner ? (
                      <Link
                        href="/dashboard/barberos/perfil"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-all flex-1 justify-center hover:opacity-80"
                        style={{ backgroundColor: "rgba(202,138,4,0.08)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}>
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar mi perfil
                      </Link>
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
              );
            })
        }

        {/* Card vacío */}
        {!loading && (
          <button onClick={openAdd}
            className="p-5 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:border-yellow-600/20 min-h-[180px]"
            style={{ backgroundColor: "#0D0D0D", border: "2px dashed rgba(255,255,255,0.06)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.15)" }}>
              <Plus className="w-5 h-5" style={{ color: "#CA8A04" }} />
            </div>
            <p className="text-sm font-semibold font-body" style={{ color: "#52525B" }}>Agregar barbero</p>
          </button>
        )}
      </div>

      {/* ── Modal agregar/editar ───────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-medium text-white">{editing ? "Editar barbero" : "Agregar barbero"}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5" style={{ color: "#52525B" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold font-body flex-shrink-0"
                style={{ backgroundColor: form.color + "22", color: form.color }}>
                {getInitials(form.name) || "??"}
              </div>
              <div>
                <p className="text-sm font-semibold text-white font-body">{form.name || "Nombre del barbero"}</p>
                <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>{form.specialty || "Especialidad"}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { key: "name",      label: "Nombre completo",     placeholder: "Ej: Juan Martínez",            type: "text" },
                { key: "specialty", label: "Especialidad",         placeholder: "Ej: Degradé & Cortes modernos", type: "text" },
                { key: "phone",     label: "Teléfono (WhatsApp)",  placeholder: "+56 9 XXXX XXXX",              type: "tel"  },
                ...(!editing ? [{ key: "email", label: "Email (para invitación)", placeholder: "juan@email.com", type: "email" }] : []),
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>{label}</label>
                  <input type={type} value={form[key as keyof BarberForm]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder} className="input-dark" />
                </div>
              ))}

              {/* Color picker */}
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

            {error && <p className="text-xs font-body text-center" style={{ color: "#EF4444" }}>{error}</p>}

            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
              <button onClick={saveBarber} disabled={saving || !form.name.trim() || !form.specialty.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90 disabled:opacity-30"
                style={{ backgroundColor: "#CA8A04" }}>
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Agregar"}
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
              <h3 className="text-base font-semibold text-white font-body mb-1">¿Eliminar barbero?</h3>
              <p className="text-sm font-body" style={{ color: "#71717A" }}>Se eliminarán sus datos. Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-white hover:opacity-90"
                style={{ backgroundColor: "#EF4444" }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
