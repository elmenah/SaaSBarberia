"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, ChevronLeft, Clock, Scissors, User, Phone,
  Calendar, MapPin, Star, Mail, Loader2,
  ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import Link from "next/link";

/* ─── Mock data ───────────────────────────────────────────────────────────── */
const MOCK_SHOP = {
  name:        "El Clásico",
  slug:        "el-clasico",
  address:     "Av. Providencia 1234",
  city:        "Santiago",
  phone:       "+56 9 8765 4321",
  description: "La barbería de barrio con acabado premium. Más de 10 años de tradición y técnica de primer nivel.",
  coverColor:  "#CA8A04",
  reviews:     { avg: 4.9, count: 124 },
};

const MOCK_SERVICES = [
  { id: "s1", name: "Corte clásico",    price: 8990,  durationMins: 30, description: "Corte tradicional con acabado prolijo" },
  { id: "s2", name: "Corte + barba",    price: 14990, durationMins: 50, description: "Corte completo más perfilado de barba" },
  { id: "s3", name: "Degradado",        price: 11990, durationMins: 40, description: "Fade bajo, medio o alto a elección"  },
  { id: "s4", name: "Arreglo de barba", price: 6990,  durationMins: 20, description: "Perfilado, delineado y acondicionado" },
];

const MOCK_BARBERS = [
  { id: "b1", name: "Miguel R.",    specialties: ["Degradado", "Fade"],          colorTag: "#CA8A04" },
  { id: "b2", name: "Sebastián M.", specialties: ["Corte clásico", "Colorimetría"], colorTag: "#3B82F6" },
  { id: "b3", name: "Tomás V.",     specialties: ["Barba", "Navaja"],            colorTag: "#22C55E" },
];

const MOCK_SCHEDULE: Record<string, { enabled: boolean; from: string; to: string }> = {
  lunes:     { enabled: true,  from: "09:00", to: "19:00" },
  martes:    { enabled: true,  from: "09:00", to: "19:00" },
  miercoles: { enabled: true,  from: "09:00", to: "19:00" },
  jueves:    { enabled: true,  from: "09:00", to: "19:00" },
  viernes:   { enabled: true,  from: "09:00", to: "20:00" },
  sabado:    { enabled: true,  from: "10:00", to: "18:00" },
  domingo:   { enabled: false, from: "",      to: ""      },
};

const ALL_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00",
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const DAY_KEYS = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
const DAY_LABELS: Record<string, string> = {
  domingo: "Dom", lunes: "Lun", martes: "Mar", miercoles: "Mié",
  jueves: "Jue", viernes: "Vie", sabado: "Sáb",
};

function fmt(n: number) {
  return "$" + n.toLocaleString("es-419");
}

function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getDays(count = 14) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayKey = DAY_KEYS[d.getDay()];
    const isOpen = MOCK_SCHEDULE[dayKey]?.enabled ?? false;
    return {
      date: d,
      dateStr: toDateString(d),
      dayName: d.toLocaleDateString("es-419", { weekday: "short" }).replace(".", ""),
      label: d.toLocaleDateString("es-419", { day: "numeric", month: "short" }),
      isToday: i === 0,
      isOpen,
      dayKey,
    };
  });
}

/* ─── Step indicator ──────────────────────────────────────────────────────── */
const STEPS = ["Servicio", "Barbero", "Fecha", "Datos", "Confirmación"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: done ? "#CA8A04" : active ? "#1A1000" : "#111111",
                  border: done || active ? "1.5px solid #CA8A04" : "1.5px solid rgba(255,255,255,0.08)",
                  color: done ? "#000" : active ? "#CA8A04" : "#52525B",
                }}
              >
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="text-[10px] font-body hidden sm:block" style={{ color: active ? "#CA8A04" : done ? "#CA8A04" : "#3F3F46" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 sm:w-12 h-px mx-1 mb-4" style={{ backgroundColor: i < current ? "#CA8A04" : "rgba(255,255,255,0.06)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Schedule preview ────────────────────────────────────────────────────── */
function SchedulePreview() {
  const [expanded, setExpanded] = useState(false);
  const today = DAY_KEYS[new Date().getDay()];
  const isOpenToday = MOCK_SCHEDULE[today]?.enabled ?? false;
  const days = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"];

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl cursor-pointer"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: "#CA8A04" }} />
          <span className="text-sm font-semibold font-body text-white">Horarios</span>
          <span
            className="text-xs font-body px-2 py-0.5 rounded-full font-semibold ml-1"
            style={{
              backgroundColor: isOpenToday ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              color: isOpenToday ? "#22C55E" : "#EF4444",
            }}
          >
            {isOpenToday ? "Abierto hoy" : "Cerrado hoy"}
          </span>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4" style={{ color: "#52525B" }} />
          : <ChevronDown className="w-4 h-4" style={{ color: "#52525B" }} />
        }
      </button>
      {expanded && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          {days.map((key) => {
            const d = MOCK_SCHEDULE[key];
            const isToday = key === today;
            return (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  backgroundColor: isToday ? "rgba(202,138,4,0.04)" : "#111111",
                }}
              >
                <span className="text-sm font-body capitalize" style={{ color: isToday ? "#CA8A04" : "#A1A1AA", fontWeight: isToday ? 600 : 400 }}>
                  {DAY_LABELS[key]}
                </span>
                <span className="text-sm font-body" style={{ color: d?.enabled ? (isToday ? "#CA8A04" : "#71717A") : "#3F3F46" }}>
                  {d?.enabled ? `${d.from} – ${d.to}` : "Cerrado"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════════════════════ */
type Service = typeof MOCK_SERVICES[number];
type Barber  = typeof MOCK_BARBERS[number];

export default function DemoBookPage() {
  const [showLanding,      setShowLanding]      = useState(true);
  const [step,             setStep]             = useState(0);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedBarber,   setSelectedBarber]   = useState<Barber | null>(null);
  const [selectedDate,     setSelectedDate]     = useState("");
  const [selectedTime,     setSelectedTime]     = useState("");
  const [slots,            setSlots]            = useState<string[]>([]);
  const [slotsLoading,     setSlotsLoading]     = useState(false);
  const [form,             setForm]             = useState({ name: "", phone: "", email: "" });
  const [submitting,       setSubmitting]       = useState(false);
  const [confirmed,        setConfirmed]        = useState(false);

  const days = getDays();
  const totalPrice    = selectedServices.reduce((s, sv) => s + sv.price, 0);
  const totalDuration = selectedServices.reduce((s, sv) => s + sv.durationMins, 0);

  // Simula carga de slots
  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedTime("");
    const timer = setTimeout(() => {
      // Simula algunos slots ocupados
      const taken = new Set(["10:00", "14:30"]);
      setSlotsLoading(false);
      setSlots(ALL_SLOTS.filter((s) => !taken.has(s)));
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedDate, selectedBarber]);

  // Simula confirmación
  async function confirmar() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setConfirmed(true);
    setStep(4);
  }

  function reset() {
    setShowLanding(true); setStep(0);
    setSelectedServices([]); setSelectedBarber(null);
    setSelectedDate(""); setSelectedTime(""); setSlots([]);
    setForm({ name: "", phone: "", email: "" });
    setConfirmed(false);
  }

  const dayObj   = days.find((d) => d.dateStr === selectedDate);
  const dayLabel = dayObj ? `${dayObj.dayName} ${dayObj.label}` : selectedDate;

  /* ── Demo badge persistente ──────────────────────────────────────────────── */
  const DemoBadge = (
    <div
      className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-body"
      style={{ backgroundColor: "rgba(202,138,4,0.15)", border: "1px solid rgba(202,138,4,0.4)", color: "#CA8A04" }}
    >
      <Zap className="w-3 h-3" />
      Demo
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     LANDING
  ══════════════════════════════════════════════════════════════════════════ */
  if (showLanding) {
    return (
      <div className="min-h-screen font-body" style={{ backgroundColor: "#080808" }}>
        {DemoBadge}

        {/* Cover */}
        <div
          className="relative h-32 sm:h-40 w-full"
          style={{ background: "linear-gradient(135deg, #0A0A0A 0%, rgba(202,138,4,0.3) 100%)" }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(#CA8A04 1px, transparent 1px)", backgroundSize: "24px 24px" }}
          />
        </div>

        {/* Info */}
        <div className="max-w-lg mx-auto px-5">
          <div className="flex items-end gap-4 mb-5" style={{ marginTop: "-40px" }}>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 border-4"
              style={{ backgroundColor: "rgba(202,138,4,0.15)", color: "#CA8A04", borderColor: "#080808", zIndex: 10, position: "relative" }}
            >
              EC
            </div>
            <div className="pb-1 flex-1 min-w-0" style={{ zIndex: 10, position: "relative" }}>
              <h1 className="text-xl font-bold text-white font-body leading-tight">{MOCK_SHOP.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Star className="w-3.5 h-3.5 flex-shrink-0 fill-current" style={{ color: "#CA8A04" }} />
                <span className="text-sm font-semibold font-body" style={{ color: "#CA8A04" }}>
                  {MOCK_SHOP.reviews.avg}
                </span>
                <span className="text-xs font-body" style={{ color: "#52525B" }}>({MOCK_SHOP.reviews.count})</span>
              </div>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#71717A" }}>
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {MOCK_SHOP.address}, {MOCK_SHOP.city}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#71717A" }}>
              <Phone className="w-3 h-3 flex-shrink-0" />
              {MOCK_SHOP.phone}
            </div>
          </div>

          <p className="text-sm font-body leading-relaxed mb-6" style={{ color: "#A1A1AA" }}>
            {MOCK_SHOP.description}
          </p>

          {/* Servicios */}
          <section className="mb-8">
            <h2 className="text-base font-bold text-white font-body mb-4">Servicios</h2>
            <div className="flex flex-col gap-1.5">
              {MOCK_SERVICES.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div>
                    <p className="text-sm font-semibold text-white font-body">{s.name}</p>
                    <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {s.durationMins} min
                    </p>
                  </div>
                  <span className="text-sm font-bold font-body" style={{ color: "#CA8A04" }}>{fmt(s.price)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Barberos */}
          <section className="mb-8">
            <h2 className="text-base font-bold text-white font-body mb-4">El equipo</h2>
            <div className="flex flex-col gap-1.5">
              {MOCK_BARBERS.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: b.colorTag + "22", color: b.colorTag }}
                  >
                    {getInitials(b.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white font-body">{b.name}</p>
                    <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>{b.specialties.join(" · ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Horario */}
          <section className="mb-8">
            <h2 className="text-base font-bold text-white font-body mb-4">Horario</h2>
            <SchedulePreview />
          </section>

          <button
            onClick={() => setShowLanding(false)}
            className="w-full py-4 rounded-2xl text-base font-bold font-body text-white mb-12 transition-all hover:opacity-90 active:scale-95 cursor-pointer"
            style={{ backgroundColor: "#CA8A04" }}
          >
            Quiero reservar
          </button>
        </div>

        <footer className="text-center py-6">
          <p className="text-xs font-body" style={{ color: "#71717A" }}>
            Powered by <span style={{ color: "#CA8A04", fontWeight: 600 }}>Mibarberia</span>
          </p>
        </footer>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BOOKING FLOW
  ══════════════════════════════════════════════════════════════════════════ */

  /* Step 0 — Servicios */
  const Step0 = (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-white font-body mb-0.5">¿Qué servicio necesitas?</h2>
        <p className="text-xs font-body" style={{ color: "#52525B" }}>Puedes elegir más de uno</p>
      </div>
      {MOCK_SERVICES.map((s) => {
        const sel = selectedServices.some((sv) => sv.id === s.id);
        return (
          <button
            key={s.id}
            onClick={() => setSelectedServices((prev) => sel ? prev.filter((sv) => sv.id !== s.id) : [...prev, s])}
            className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all cursor-pointer"
            style={{
              backgroundColor: sel ? "rgba(202,138,4,0.08)" : "#111111",
              border: sel ? "1.5px solid #CA8A04" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white font-body">{s.name}</p>
              <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>{s.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-body flex items-center gap-1" style={{ color: "#52525B" }}>
                  <Clock className="w-3 h-3" /> {s.durationMins} min
                </span>
                <span className="text-xs font-semibold font-body" style={{ color: "#CA8A04" }}>{fmt(s.price)}</span>
              </div>
            </div>
            {sel && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#CA8A04" }} />}
          </button>
        );
      })}
      {selectedServices.length > 0 && (
        <div
          className="rounded-xl p-3 flex items-center justify-between"
          style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.15)" }}
        >
          <span className="text-xs font-body" style={{ color: "#CA8A04" }}>
            {selectedServices.length} servicio{selectedServices.length > 1 ? "s" : ""} · {totalDuration} min
          </span>
          <span className="text-sm font-bold font-body" style={{ color: "#CA8A04" }}>{fmt(totalPrice)}</span>
        </div>
      )}
      <button
        disabled={selectedServices.length === 0}
        onClick={() => setStep(1)}
        className="mt-1 w-full py-3 rounded-2xl font-semibold text-sm font-body transition-all cursor-pointer"
        style={{
          backgroundColor: selectedServices.length ? "#CA8A04" : "#1A1A1A",
          color: selectedServices.length ? "#000" : "#3F3F46",
          cursor: selectedServices.length ? "pointer" : "not-allowed",
        }}
      >
        Continuar
      </button>
    </div>
  );

  /* Step 1 — Barberos */
  const Step1 = (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-white font-body mb-1">Elige tu barbero</h2>
      {MOCK_BARBERS.map((b) => {
        const isSel = selectedBarber?.id === b.id;
        return (
          <button
            key={b.id}
            className="flex items-center gap-4 p-4 w-full text-left rounded-2xl transition-all cursor-pointer"
            style={{
              backgroundColor: isSel ? "rgba(202,138,4,0.06)" : "#111111",
              border: isSel ? "1.5px solid #CA8A04" : "1px solid rgba(255,255,255,0.06)",
            }}
            onClick={() => setSelectedBarber(b)}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: b.colorTag + "22", color: b.colorTag }}
            >
              {getInitials(b.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white font-body">{b.name}</p>
                {isSel && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#CA8A04" }} />}
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {b.specialties.map((sp) => (
                  <span
                    key={sp}
                    className="text-[10px] font-body px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: b.colorTag + "18", color: b.colorTag, border: `1px solid ${b.colorTag}30` }}
                  >
                    {sp}
                  </span>
                ))}
              </div>
            </div>
          </button>
        );
      })}
      {/* Sin preferencia */}
      <button
        onClick={() => setSelectedBarber({ id: "any", name: "Sin preferencia", specialties: [], colorTag: "#52525B" })}
        className="flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer"
        style={{
          backgroundColor: selectedBarber?.id === "any" ? "rgba(202,138,4,0.08)" : "#0D0D0D",
          border: selectedBarber?.id === "any" ? "1.5px solid #CA8A04" : "1px dashed rgba(255,255,255,0.08)",
        }}
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#52525B" }}>✦</div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-white font-body">Sin preferencia</p>
          <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>El primero disponible en tu horario</p>
        </div>
        {selectedBarber?.id === "any" && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#CA8A04" }} />}
      </button>

      <div className="flex gap-3 mt-1">
        <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body cursor-pointer" style={{ backgroundColor: "#111111", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.06)" }}>
          Volver
        </button>
        <button
          disabled={!selectedBarber}
          onClick={() => setStep(2)}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body transition-all cursor-pointer"
          style={{
            backgroundColor: selectedBarber ? "#CA8A04" : "#1A1A1A",
            color: selectedBarber ? "#000" : "#3F3F46",
            cursor: selectedBarber ? "pointer" : "not-allowed",
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );

  /* Step 2 — Fecha y hora */
  const Step2 = (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white font-body">Elige fecha y hora</h2>
      <div>
        <p className="text-xs font-body mb-2" style={{ color: "#52525B" }}>Fecha</p>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {days.map((d) => (
            <button
              key={d.dateStr}
              onClick={() => { if (d.isOpen) setSelectedDate(d.dateStr); }}
              disabled={!d.isOpen}
              className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl flex-shrink-0 transition-all cursor-pointer"
              style={{
                minWidth: "52px",
                backgroundColor: selectedDate === d.dateStr ? "rgba(202,138,4,0.1)" : d.isOpen ? "#111111" : "#0A0A0A",
                border: selectedDate === d.dateStr ? "1.5px solid #CA8A04" : d.isOpen ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.03)",
                opacity: d.isOpen ? 1 : 0.35,
                cursor: d.isOpen ? "pointer" : "not-allowed",
              }}
            >
              <span className="text-[10px] uppercase font-body" style={{ color: selectedDate === d.dateStr ? "#CA8A04" : "#52525B" }}>{d.dayName}</span>
              <span className="text-base font-bold font-body" style={{ color: selectedDate === d.dateStr ? "#CA8A04" : d.isOpen ? "#A1A1AA" : "#3F3F46" }}>{d.date.getDate()}</span>
              {d.isToday && <span className="text-[9px] font-body font-semibold" style={{ color: selectedDate === d.dateStr ? "#CA8A04" : "#3F3F46" }}>Hoy</span>}
              {!d.isOpen && <span className="text-[8px] font-body" style={{ color: "#3F3F46" }}>Cerrado</span>}
            </button>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div>
          <p className="text-xs font-body mb-2" style={{ color: "#52525B" }}>Hora disponible</p>
          {slotsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#CA8A04" }} />
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className="py-2 rounded-xl text-xs font-body font-semibold transition-all cursor-pointer"
                  style={{
                    backgroundColor: selectedTime === t ? "#CA8A04" : "#111111",
                    color: selectedTime === t ? "#000" : "#A1A1AA",
                    border: selectedTime === t ? "1.5px solid #CA8A04" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-1">
        <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body cursor-pointer" style={{ backgroundColor: "#111111", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.06)" }}>
          Volver
        </button>
        <button
          disabled={!selectedDate || !selectedTime}
          onClick={() => setStep(3)}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body transition-all cursor-pointer"
          style={{
            backgroundColor: (selectedDate && selectedTime) ? "#CA8A04" : "#1A1A1A",
            color: (selectedDate && selectedTime) ? "#000" : "#3F3F46",
            cursor: (selectedDate && selectedTime) ? "pointer" : "not-allowed",
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  );

  /* Step 3 — Datos de contacto */
  const Step3 = (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white font-body">Tus datos de contacto</h2>
      <p className="text-xs font-body -mt-2" style={{ color: "#52525B" }}>
        Te enviaremos la confirmación y recordatorios por WhatsApp.
      </p>

      {/* Resumen */}
      <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.15)" }}>
        <p className="text-xs font-body font-semibold" style={{ color: "#CA8A04" }}>Tu reserva</p>
        {[
          { icon: Scissors, text: selectedServices.map((s) => s.name).join(" + ") },
          { icon: User,     text: selectedBarber?.id === "any" ? "Sin preferencia" : selectedBarber?.name },
          { icon: Calendar, text: dayLabel },
          { icon: Clock,    text: `${selectedTime} · ${totalDuration} min · ${fmt(totalPrice)}` },
        ].map(({ icon: Icon, text }) => text ? (
          <div key={text} className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#CA8A04" }} />
            <span className="text-xs font-body text-white">{text}</span>
          </div>
        ) : null)}
      </div>

      <div className="flex flex-col gap-3">
        {[
          { label: "Nombre completo",         placeholder: "Ej. Rodrigo Silva",    type: "text",  key: "name"  as const },
          { label: "Teléfono (WhatsApp)",      placeholder: "+56 9 1234 5678",      type: "tel",   key: "phone" as const },
          { label: "Correo (opcional)",        placeholder: "tu@email.com",         type: "email", key: "email" as const },
        ].map(({ label, placeholder, type, key }) => (
          <div key={key}>
            <label className="text-xs font-body font-medium mb-1.5 block" style={{ color: "#A1A1AA" }}>{label}</label>
            <input
              type={type}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm font-body text-white outline-none transition-all"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
        ))}
      </div>

      <p className="text-[11px] font-body leading-relaxed" style={{ color: "#3F3F46" }}>
        Al confirmar, aceptas recibir recordatorios por WhatsApp. No compartimos tus datos con terceros.
      </p>

      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body cursor-pointer" style={{ backgroundColor: "#111111", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.06)" }}>
          Volver
        </button>
        <button
          disabled={submitting || !form.name.trim() || form.phone.trim().length < 6}
          onClick={confirmar}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body transition-all flex items-center justify-center gap-2 cursor-pointer"
          style={{
            backgroundColor: (form.name.trim() && form.phone.trim().length >= 6) ? "#CA8A04" : "#1A1A1A",
            color: (form.name.trim() && form.phone.trim().length >= 6) ? "#000" : "#3F3F46",
            cursor: (form.name.trim() && form.phone.trim().length >= 6 && !submitting) ? "pointer" : "not-allowed",
          }}
        >
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</>
            : "Confirmar turno"
          }
        </button>
      </div>
    </div>
  );

  /* Step 4 — Confirmado */
  const Step4 = (
    <div className="flex flex-col items-center gap-6 text-center pt-4">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(202,138,4,0.12)", border: "2px solid #CA8A04" }}
      >
        <CheckCircle2 className="w-10 h-10" style={{ color: "#CA8A04" }} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white font-body mb-1">¡Turno confirmado!</h2>
        <p className="text-sm font-body" style={{ color: "#71717A" }}>
          Te enviamos los detalles por WhatsApp al <span className="text-white">{form.phone}</span>
        </p>
      </div>

      <div className="w-full rounded-2xl p-5 text-left flex flex-col gap-3" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-body font-semibold uppercase tracking-widest mb-1" style={{ color: "#52525B" }}>Detalle del turno</p>
        {[
          { icon: User,     label: "Cliente",  value: form.name },
          { icon: Scissors, label: "Servicio", value: selectedServices.map((s) => s.name).join(" + ") },
          { icon: User,     label: "Barbero",  value: selectedBarber?.id === "any" ? "Sin preferencia" : selectedBarber?.name },
          { icon: Calendar, label: "Fecha",    value: dayLabel },
          { icon: Clock,    label: "Hora",     value: `${selectedTime} · ${totalDuration} min` },
          { icon: Phone,    label: "WhatsApp", value: form.phone },
          ...(form.email ? [{ icon: Mail, label: "Correo", value: form.email }] : []),
        ].map(({ icon: Icon, label, value }) => value ? (
          <div key={label} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(202,138,4,0.08)" }}>
              <Icon className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
            </div>
            <div>
              <p className="text-[11px] font-body" style={{ color: "#52525B" }}>{label}</p>
              <p className="text-sm font-body font-medium text-white">{value}</p>
            </div>
          </div>
        ) : null)}
      </div>

      <div className="w-full rounded-xl p-4 text-left" style={{ backgroundColor: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
        <p className="text-xs font-body font-semibold mb-1" style={{ color: "#22C55E" }}>Recordatorios automáticos</p>
        <p className="text-xs font-body leading-relaxed" style={{ color: "#71717A" }}>
          Recibirás un recordatorio 24 h antes y 1 h antes de tu turno. Para cancelar, responde el mensaje de WhatsApp.
        </p>
      </div>

      <button
        onClick={reset}
        className="text-sm font-body font-semibold px-6 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95 cursor-pointer"
        style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        Reservar otro turno
      </button>

      <Link
        href="/register"
        className="text-sm font-body font-semibold px-6 py-3 rounded-xl transition-all hover:opacity-90 cursor-pointer w-full text-center"
        style={{ backgroundColor: "#CA8A04", color: "#000" }}
      >
        Crear mi barbería en Mibarberia →
      </Link>
    </div>
  );

  const STEP_CONTENT = [Step0, Step1, Step2, Step3, Step4];

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: "#080808" }}>
      {DemoBadge}

      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4"
        style={{ backgroundColor: "rgba(8,8,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
      >
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5 cursor-pointer"
          style={{ color: "#52525B" }}
          onClick={() => { if (step === 0) setShowLanding(true); else setStep((s) => s - 1); }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-white font-body">{MOCK_SHOP.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "#52525B" }} />
            <p className="text-xs font-body" style={{ color: "#52525B" }}>{MOCK_SHOP.address}</p>
          </div>
        </div>
        <span
          className="text-xs font-body px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: "rgba(202,138,4,0.08)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}
        >
          {step < 4 ? `${step + 1}/4` : "✓"}
        </span>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        <StepBar current={step} />
        {STEP_CONTENT[step]}
      </main>

      <footer className="text-center py-8 mt-4">
        <p className="text-xs font-body" style={{ color: "#71717A" }}>
          Powered by <span style={{ color: "#CA8A04", fontWeight: 600 }}>Mibarberia</span>
        </p>
      </footer>
    </div>
  );
}
