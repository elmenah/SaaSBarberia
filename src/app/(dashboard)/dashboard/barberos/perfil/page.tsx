"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Check, Plus, Trash2, Edit2, X,
  Phone, Scissors, BookOpen, Calendar, ArrowLeft, Tag,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

/* ── Tipos ─────────────────────────────────────────────────────────────────── */
type ServiceBasic = {
  id:          string;
  name:        string;
  price:       number | string;
  durationMins:number;
  category:    string;
};

type BarberMe = {
  id:             string;
  colorTag:       string;
  specialties:    string[];
  bio:            string | null;
  isActive:       boolean;
  createdAt:      string;
  user:           { name: string; phone: string | null; email: string };
  turnosMes:      number;
  services:       ServiceBasic[];
  certifications: Cert[];
};

type Cert = { id: string; name: string; issuer: string; year: string };

const COLORS = ["#CA8A04","#3B82F6","#8B5CF6","#22C55E","#EF4444","#F59E0B","#EC4899","#14B8A6"];
const EMPTY_CERT = { name: "", issuer: "", year: new Date().getFullYear().toString() };
const TABS = ["Mi información", "Mis servicios", "Certificaciones", "Mi horario"] as const;
type Tab = typeof TABS[number];

/* ── Horario ─────────────────────────────────────────────────────────────── */
type DaySchedule = { enabled: boolean; from: string; to: string; breakFrom: string; breakTo: string; hasBreak: boolean };
type WeekSchedule = Record<string, DaySchedule>;
const DAYS = [
  { key: "lunes",     label: "Lunes"     },
  { key: "martes",    label: "Martes"    },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves",    label: "Jueves"    },
  { key: "viernes",   label: "Viernes"   },
  { key: "sabado",    label: "Sábado"    },
  { key: "domingo",   label: "Domingo"   },
];
const DEFAULT_SCHEDULE: WeekSchedule = {
  lunes:     { enabled: true,  from: "09:00", to: "19:00", breakFrom: "13:00", breakTo: "14:00", hasBreak: true  },
  martes:    { enabled: true,  from: "09:00", to: "19:00", breakFrom: "13:00", breakTo: "14:00", hasBreak: true  },
  miercoles: { enabled: true,  from: "09:00", to: "19:00", breakFrom: "13:00", breakTo: "14:00", hasBreak: true  },
  jueves:    { enabled: true,  from: "09:00", to: "19:00", breakFrom: "13:00", breakTo: "14:00", hasBreak: true  },
  viernes:   { enabled: true,  from: "09:00", to: "20:00", breakFrom: "13:00", breakTo: "14:00", hasBreak: true  },
  sabado:    { enabled: true,  from: "09:00", to: "15:00", breakFrom: "",      breakTo: "",      hasBreak: false },
  domingo:   { enabled: false, from: "09:00", to: "14:00", breakFrom: "",      breakTo: "",      hasBreak: false },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl animate-pulse ${className}`} style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />;
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function BarberPerfilPage() {
  /* ── Datos del barbero ─────────────────────────────────────────────────── */
  const [barber,  setBarber]  = useState<BarberMe | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Campos editables ──────────────────────────────────────────────────── */
  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio,       setBio]       = useState("");
  const [colorTag,  setColorTag]  = useState("#CA8A04");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  /* ── Servicios ─────────────────────────────────────────────────────────── */
  const [allServices,      setAllServices]      = useState<ServiceBasic[]>([]);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [savingServices,   setSavingServices]   = useState(false);
  const [savedServices,    setSavedServices]    = useState(false);

  /* ── Certificaciones ───────────────────────────────────────────────────── */
  const [certs,     setCerts]     = useState<Cert[]>([]);
  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [certForm,  setCertForm]  = useState(EMPTY_CERT);

  /* ── Horario ────────────────────────────────────────────────────────────── */
  const [schedule,     setSchedule]     = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [savingSchd,   setSavingSchd]   = useState(false);
  const [savedSchd,    setSavedSchd]    = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("Mi información");

  /* ── Fetch perfil ──────────────────────────────────────────────────────── */
  const fetchMe = useCallback(() => {
    setLoading(true);
    fetch("/api/barbers/me")
      .then((r) => r.json())
      .then(({ data }: { data: BarberMe | null }) => {
        if (!data) return;
        setBarber(data);
        setName(data.user.name);
        setPhone(data.user.phone ?? "");
        setSpecialty(data.specialties[0] ?? "");
        setBio(data.bio ?? "");
        setColorTag(data.colorTag ?? "#CA8A04");
        setSelectedServices(new Set(data.services.map((s) => s.id)));
        setCerts(Array.isArray(data.certifications) ? data.certifications : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Fetch horario del barbero ─────────────────────────────────────────── */
  useEffect(() => {
    fetch("/api/barbers/me/schedule")
      .then((r) => r.json())
      .then(({ data }: { data: WeekSchedule | null }) => {
        if (data && Object.keys(data).length > 0) setSchedule(data);
      })
      .catch(console.error);
  }, []);

  /* ── Guardar horario ────────────────────────────────────────────────────── */
  async function guardarHorario() {
    setSavingSchd(true);
    setSavedSchd(false);
    try {
      const res = await fetch("/api/barbers/me/schedule", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(schedule),
      });
      if (!res.ok) return;
      setSavedSchd(true);
      setTimeout(() => setSavedSchd(false), 2500);
    } catch { /* silencioso */ }
    finally { setSavingSchd(false); }
  }

  /* ── Fetch todos los servicios de la barbería ──────────────────────────── */
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then(({ data }: { data: ServiceBasic[] }) => {
        if (Array.isArray(data)) setAllServices(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  /* ── Guardar info ──────────────────────────────────────────────────────── */
  async function guardar() {
    if (!barber) return;
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/barbers/${barber.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      name.trim(),
          specialty: specialty.trim(),
          phone:     phone.trim() || undefined,
          bio:       bio.trim(),
          colorTag,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Error al guardar");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      fetchMe();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  /* ── Guardar servicios ─────────────────────────────────────────────────── */
  async function guardarServicios() {
    setSavingServices(true);
    setSavedServices(false);
    try {
      const res = await fetch("/api/barbers/me/services", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceIds: Array.from(selectedServices) }),
      });
      if (!res.ok) return;
      setSavedServices(true);
      setTimeout(() => setSavedServices(false), 2500);
    } catch {
      // silencioso
    } finally {
      setSavingServices(false);
    }
  }

  function toggleService(id: string) {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /* ── Certificaciones ───────────────────────────────────────────────────── */
  function openAddCert() { setEditingId(null); setCertForm(EMPTY_CERT); setShowForm(true); }
  function openEditCert(c: Cert) { setEditingId(c.id); setCertForm({ name: c.name, issuer: c.issuer, year: c.year }); setShowForm(true); }
  function saveCert() {
    if (!certForm.name.trim() || !certForm.issuer.trim()) return;
    let newCerts: Cert[];
    if (editingId) {
      newCerts = certs.map((c) => c.id === editingId ? { ...c, ...certForm } : c);
    } else {
      newCerts = [...certs, { id: `c${Date.now()}`, ...certForm }];
    }
    setCerts(newCerts);
    setShowForm(false);
    // Persistir en la DB
    if (barber) {
      fetch(`/api/barbers/${barber.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certifications: newCerts }),
      }).catch(console.error);
    }
  }

  function deleteCert(id: string) {
    const newCerts = certs.filter((c) => c.id !== id);
    setCerts(newCerts);
    if (barber) {
      fetch(`/api/barbers/${barber.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certifications: newCerts }),
      }).catch(console.error);
    }
  }

  /* ── Agrupar servicios por categoría ───────────────────────────────────── */
  const servicesByCategory = allServices.reduce<Record<string, ServiceBasic[]>>((acc, s) => {
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  /* ── Loading ───────────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="flex flex-col gap-6 max-w-2xl animate-pulse">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-28" />
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64" />
    </div>
  );

  /* ── Sin perfil de barbero ─────────────────────────────────────────────── */
  if (!barber) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 max-w-md mx-auto text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "rgba(202,138,4,0.08)" }}>
        <Scissors className="w-6 h-6" style={{ color: "#CA8A04" }} />
      </div>
      <p className="text-white font-semibold font-body text-lg">No tienes perfil de barbero</p>
      <p className="text-sm font-body" style={{ color: "#52525B" }}>
        Tu cuenta de propietario todavía no tiene un perfil de barbero asociado. Créalo desde la sección Mibarberia.
      </p>
      <Link href="/dashboard/barberos"
        className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold font-body text-black"
        style={{ backgroundColor: "#CA8A04" }}>
        Ir a Mibarberia
      </Link>
    </div>
  );

  const joinedYear = new Date(barber.createdAt).getFullYear();

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/barberos"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
          style={{ border: "1px solid rgba(255,255,255,0.07)", color: "#71717A" }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-display font-medium text-white">Mi perfil de barbero</h1>
          <p className="text-sm font-body" style={{ color: "#52525B" }}>
            Así te ven los clientes en la página de reservas
          </p>
        </div>
      </div>

      {/* Preview card */}
      <div className="flex items-center gap-4 p-5 rounded-2xl"
        style={{ backgroundColor: "#111111", border: `1px solid ${colorTag}33` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold font-body flex-shrink-0"
          style={{ backgroundColor: colorTag + "22", color: colorTag }}>
          {getInitials(name) || "??"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-white font-body truncate">{name || "Tu nombre"}</p>
          <p className="text-sm font-body mt-0.5" style={{ color: "#71717A" }}>
            {specialty || "Tu especialidad"}
          </p>
          {bio && <p className="text-xs font-body mt-1 line-clamp-2" style={{ color: "#52525B" }}>{bio}</p>}
          {selectedServices.size > 0 && (
            <p className="text-xs font-body mt-1" style={{ color: "#3F3F46" }}>
              {selectedServices.size} servicio{selectedServices.size !== 1 ? "s" : ""} asignado{selectedServices.size !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {/* Stats */}
        <div className="hidden sm:flex gap-3 flex-shrink-0">
          <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "#0D0D0D", minWidth: 72 }}>
            <Calendar className="w-4 h-4 mx-auto mb-1" style={{ color: "#3B82F6" }} />
            <p className="text-sm font-bold text-white font-body">{barber.turnosMes}</p>
            <p className="text-xs font-body" style={{ color: "#3F3F46" }}>Turnos</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "#0D0D0D", minWidth: 72 }}>
            <p className="text-xs font-body mb-1" style={{ color: "#52525B" }}>Desde</p>
            <p className="text-sm font-bold text-white font-body">{joinedYear}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl p-0.5 gap-0.5 self-start"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-semibold font-body transition-all whitespace-nowrap"
            style={activeTab === tab ? { backgroundColor: "#CA8A04", color: "#000" } : { color: "#52525B" }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── TAB: MI INFORMACIÓN ─────────────────────────────────────────────── */}
      {activeTab === "Mi información" && (
        <div className="flex flex-col gap-4 p-6 rounded-2xl"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>

          {[
            { label: "Nombre completo",     value: name,      setter: setName,      placeholder: "Tu nombre completo",            type: "text" },
            { label: "Teléfono (WhatsApp)", value: phone,     setter: setPhone,     placeholder: "+54 9 11 XXXX XXXX",            type: "tel"  },
            { label: "Especialidad",        value: specialty, setter: setSpecialty, placeholder: "Ej: Degradé & Cortes modernos", type: "text" },
          ].map(({ label, value, setter, placeholder, type }) => (
            <div key={label}>
              <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                {label}
              </label>
              <input type={type} value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="input-dark w-full" />
            </div>
          ))}

          {/* Bio */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
              Bio <span style={{ color: "#3F3F46" }}>(visible para los clientes al agendar)</span>
            </label>
            <textarea value={bio} rows={3}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntales algo a tus clientes: experiencia, estilo, lo que te diferencia..."
              className="input-dark w-full resize-none" />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-2" style={{ color: "#52525B" }}>
              Color del avatar
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColorTag(c)}
                  className="w-8 h-8 rounded-lg transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: c,
                    outline: colorTag === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                    transform: colorTag === c ? "scale(1.15)" : "scale(1)",
                  }}>
                  {colorTag === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm font-body" style={{ color: "#EF4444" }}>{error}</p>}

          <button onClick={guardar} disabled={saving || !name.trim()}
            className="self-start flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: saved ? "#22C55E" : "#CA8A04" }}>
            {saved ? <><Check className="w-4 h-4" /> Guardado</> : saving ? "Guardando..." : <><Check className="w-4 h-4" /> Guardar cambios</>}
          </button>
        </div>
      )}

      {/* ── TAB: MIS SERVICIOS ──────────────────────────────────────────────── */}
      {activeTab === "Mis servicios" && (
        <div className="flex flex-col gap-4">

          {/* Aviso informativo */}
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.15)" }}>
            <Tag className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#CA8A04" }} />
            <p className="text-xs font-body leading-relaxed" style={{ color: "#71717A" }}>
              Marca los servicios que tú realizas. Los clientes solo verán estos servicios cuando te elijan al agendar.
            </p>
          </div>

          {/* Lista de servicios */}
          {allServices.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3"
              style={{ border: "2px dashed rgba(255,255,255,0.06)", borderRadius: "16px" }}>
              <Scissors className="w-8 h-8" style={{ color: "#3F3F46" }} />
              <p className="text-sm font-body text-center" style={{ color: "#3F3F46" }}>
                No hay servicios cargados en la barbería.<br />
                <Link href="/dashboard/servicios" className="underline" style={{ color: "#CA8A04" }}>
                  Ir a Servicios
                </Link>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(servicesByCategory).map(([category, services]) => (
                <div key={category} className="flex flex-col gap-2 p-5 rounded-2xl"
                  style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Categoría header */}
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1 font-body" style={{ color: "#52525B" }}>
                    {category}
                  </p>

                  {services.map((svc) => {
                    const selected = selectedServices.has(svc.id);
                    return (
                      <button
                        key={svc.id}
                        onClick={() => toggleService(svc.id)}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all text-left w-full"
                        style={{
                          backgroundColor: selected ? `${colorTag}12` : "rgba(255,255,255,0.02)",
                          border: `1px solid ${selected ? colorTag + "40" : "rgba(255,255,255,0.06)"}`,
                        }}>
                        {/* Checkbox visual */}
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{
                            backgroundColor: selected ? colorTag : "transparent",
                            border: `2px solid ${selected ? colorTag : "rgba(255,255,255,0.15)"}`,
                          }}>
                          {selected && <Check className="w-3 h-3 text-black" />}
                        </div>

                        {/* Info servicio */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold font-body text-white truncate">{svc.name}</p>
                          <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>
                            {svc.durationMins} min · {formatCurrency(Number(svc.price))}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Botón guardar servicios */}
          {allServices.length > 0 && (
            <div className="flex items-center gap-4">
              <button onClick={guardarServicios} disabled={savingServices}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: savedServices ? "#22C55E" : "#CA8A04" }}>
                {savedServices
                  ? <><Check className="w-4 h-4" /> Guardado</>
                  : savingServices
                    ? "Guardando..."
                    : <><Check className="w-4 h-4" /> Guardar servicios</>}
              </button>
              <p className="text-xs font-body" style={{ color: "#3F3F46" }}>
                {selectedServices.size} de {allServices.length} seleccionado{allServices.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CERTIFICACIONES ────────────────────────────────────────────── */}
      {activeTab === "Certificaciones" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.15)" }}>
            <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#CA8A04" }} />
            <p className="text-xs font-body leading-relaxed" style={{ color: "#71717A" }}>
              Tus cursos y certificaciones aparecen en tu perfil cuando los clientes te eligen al agendar. Generan más confianza.
            </p>
          </div>

          {certs.map((c) => (
            <div key={c.id} className="flex items-start gap-4 p-4 rounded-xl"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
                <span className="text-base">🎓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white font-body">{c.name}</p>
                <p className="text-xs font-body mt-0.5" style={{ color: "#71717A" }}>{c.issuer}</p>
                <p className="text-xs font-body" style={{ color: "#3F3F46" }}>{c.year}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => openEditCert(c)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                  style={{ color: "#71717A", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteCert(c.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                  style={{ color: "#3F3F46", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {certs.length === 0 && !showForm && (
            <div className="py-12 flex flex-col items-center gap-3"
              style={{ border: "2px dashed rgba(255,255,255,0.06)", borderRadius: "16px" }}>
              <span className="text-4xl">🎓</span>
              <p className="text-sm font-body text-center" style={{ color: "#3F3F46" }}>
                Todavía no cargaste ninguna certificación.<br />¡Agrega la primera!
              </p>
            </div>
          )}

          {showForm && (
            <div className="flex flex-col gap-4 p-5 rounded-2xl"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white font-body">
                  {editingId ? "Editar certificación" : "Nueva certificación"}
                </p>
                <button onClick={() => setShowForm(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5"
                  style={{ color: "#52525B" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {[
                { key: "name",   label: "Nombre del curso / certificación", placeholder: "Ej: Técnicas de Fade Avanzado" },
                { key: "issuer", label: "Institución",                       placeholder: "Ej: BarberPro Academy"         },
                { key: "year",   label: "Año",                               placeholder: "2024"                          },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>{label}</label>
                  <input type={key === "year" ? "number" : "text"} placeholder={placeholder}
                    value={certForm[key as keyof typeof certForm]}
                    onChange={(e) => setCertForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="input-dark w-full" />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
                <button onClick={saveCert} disabled={!certForm.name.trim() || !certForm.issuer.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-black hover:opacity-90 disabled:opacity-30"
                  style={{ backgroundColor: "#CA8A04" }}>
                  {editingId ? "Guardar" : "Agregar"}
                </button>
              </div>
            </div>
          )}

          {!showForm && (
            <button onClick={openAddCert}
              className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-body text-black hover:opacity-90"
              style={{ backgroundColor: "#CA8A04" }}>
              <Plus className="w-4 h-4" /> Agregar certificación
            </button>
          )}
        </div>
      )}

      {/* ── TAB: MI HORARIO ─────────────────────────────────────────────────── */}
      {activeTab === "Mi horario" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.15)" }}>
            <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#CA8A04" }} />
            <p className="text-xs font-body leading-relaxed" style={{ color: "#71717A" }}>
              Configura los días y horarios en que trabajas. Esto reemplaza el horario general de la barbería para tus turnos.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {DAYS.map(({ key, label }) => {
              const day = schedule[key] ?? DEFAULT_SCHEDULE[key];
              return (
                <div key={key} className="p-4 rounded-xl transition-all"
                  style={{
                    backgroundColor: "#111111",
                    border: `1px solid ${day.enabled ? "rgba(202,138,4,0.2)" : "rgba(255,255,255,0.06)"}`,
                    opacity: day.enabled ? 1 : 0.5,
                  }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-white font-body">{label}</p>
                    {/* Toggle día */}
                    <button
                      onClick={() => setSchedule((s) => ({ ...s, [key]: { ...day, enabled: !day.enabled } }))}
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{ backgroundColor: day.enabled ? "#CA8A04" : "#1A1A1A" }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                        style={{ transform: day.enabled ? "translateX(21px)" : "translateX(2px)" }} />
                    </button>
                  </div>

                  {day.enabled && (
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-body" style={{ color: "#52525B" }}>Desde</label>
                        <input type="time" value={day.from}
                          onChange={(e) => setSchedule((s) => ({ ...s, [key]: { ...day, from: e.target.value } }))}
                          className="input-dark text-sm py-1.5 px-3 w-28" />
                        <label className="text-xs font-body" style={{ color: "#52525B" }}>Hasta</label>
                        <input type="time" value={day.to}
                          onChange={(e) => setSchedule((s) => ({ ...s, [key]: { ...day, to: e.target.value } }))}
                          className="input-dark text-sm py-1.5 px-3 w-28" />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          onClick={() => setSchedule((s) => ({ ...s, [key]: { ...day, hasBreak: !day.hasBreak } }))}
                          className="w-4 h-4 rounded flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: day.hasBreak ? "#CA8A04" : "transparent",
                            border: `2px solid ${day.hasBreak ? "#CA8A04" : "rgba(255,255,255,0.15)"}`,
                          }}>
                          {day.hasBreak && <Check className="w-2.5 h-2.5 text-black" />}
                        </div>
                        <span className="text-xs font-body" style={{ color: "#71717A" }}>Descanso</span>
                      </label>

                      {day.hasBreak && (
                        <div className="flex items-center gap-2">
                          <input type="time" value={day.breakFrom}
                            onChange={(e) => setSchedule((s) => ({ ...s, [key]: { ...day, breakFrom: e.target.value } }))}
                            className="input-dark text-sm py-1.5 px-3 w-28" />
                          <span className="text-xs font-body" style={{ color: "#3F3F46" }}>—</span>
                          <input type="time" value={day.breakTo}
                            onChange={(e) => setSchedule((s) => ({ ...s, [key]: { ...day, breakTo: e.target.value } }))}
                            className="input-dark text-sm py-1.5 px-3 w-28" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={guardarHorario} disabled={savingSchd}
            className="self-start flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold font-body text-black hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: savedSchd ? "#22C55E" : "#CA8A04" }}>
            {savedSchd
              ? <><Check className="w-4 h-4" /> Guardado</>
              : savingSchd ? "Guardando..." : <><Check className="w-4 h-4" /> Guardar horario</>
            }
          </button>
        </div>
      )}
    </div>
  );
}
