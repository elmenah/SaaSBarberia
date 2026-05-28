"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2, ChevronLeft, Clock, Scissors, User, Phone,
  Calendar, MapPin, Star, Mail, X, Loader2, AlertCircle,
  Instagram, Globe, ChevronDown, ChevronUp,
} from "lucide-react";

/* ─── Tipos ───────────────────────────────────────────────────────────────── */
type DaySchedule = { enabled: boolean; from: string; to: string; hasBreak: boolean; breakFrom: string; breakTo: string };
type WeekSchedule = Record<string, DaySchedule>;

type ReviewItem = { clientName: string; rating: number; comment: string | null; createdAt: string };

type ShopData = {
  id:             string;
  name:           string;
  slug:           string;
  logoUrl:        string | null;
  phone:          string | null;
  address:        string | null;
  city:           string | null;
  email:          string | null;
  whatsappNumber: string | null;
  description:    string | null;
  coverColor:     string | null;
  coverImageUrl:  string | null;
  instagramUrl:   string | null;
  settings:       { schedule?: WeekSchedule } | null;
  services:       ServiceData[];
  barbers:        BarberData[];
  reviews:        { avg: number | null; count: number; list: ReviewItem[] };
};

type ServiceData = {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  durationMins:number;
  category:    string;
};

type Cert = { id: string; name: string; issuer: string; year: string };

type BarberData = {
  id:             string;
  colorTag:       string | null;
  specialties:    string[];
  bio:            string | null;
  user:           { name: string };
  certifications: Cert[];
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const DAY_KEYS = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
const DAY_LABELS_FULL: Record<string, string> = {
  domingo: "Dom", lunes: "Lun", martes: "Mar", miercoles: "Mié",
  jueves: "Jue", viernes: "Vie", sabado: "Sáb",
};

function fmt(n: number | string) {
  return "$" + Number(n).toLocaleString("es-419");
}

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDays(schedule: WeekSchedule | undefined, count = 21) {
  const days: { date: Date; dateStr: string; dayName: string; label: string; isToday: boolean; isOpen: boolean; dayKey: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayKey = DAY_KEYS[d.getDay()];
    const isOpen = schedule?.[dayKey]?.enabled ?? true;
    const dayName = d.toLocaleDateString("es-419", { weekday: "short" }).replace(".", "");
    const label   = d.toLocaleDateString("es-419", { day: "numeric", month: "short" });
    days.push({ date: d, dateStr: toDateString(d), dayName, label, isToday: i === 0, isOpen, dayKey });
  }
  return days;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

/* ─── Star rating component ───────────────────────────────────────────────── */
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110">
          <Star
            className="w-9 h-9"
            fill={(hovered || value) >= n ? "#CA8A04" : "transparent"}
            style={{ color: (hovered || value) >= n ? "#CA8A04" : "#3F3F46" }}
          />
        </button>
      ))}
    </div>
  );
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
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: done ? "#CA8A04" : active ? "#1A1000" : "#111111",
                  border: done || active ? "1.5px solid #CA8A04" : "1.5px solid rgba(255,255,255,0.08)",
                  color: done ? "#000" : active ? "#CA8A04" : "#52525B",
                }}>
                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="text-[10px] font-body hidden sm:block"
                style={{ color: active ? "#CA8A04" : done ? "#CA8A04" : "#3F3F46" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 sm:w-12 h-px mx-1 mb-4"
                style={{ backgroundColor: i < current ? "#CA8A04" : "rgba(255,255,255,0.06)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Landing: horario ────────────────────────────────────────────────────── */
function SchedulePreview({ schedule }: { schedule: WeekSchedule | undefined }) {
  const [expanded, setExpanded] = useState(false);
  const days = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const today = DAY_KEYS[new Date().getDay()];
  const todayData = schedule?.[today];
  const isOpenToday = todayData?.enabled ?? false;

  return (
    <div className="flex flex-col gap-2">
      <button onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: "#CA8A04" }} />
          <span className="text-sm font-semibold font-body text-white">Horarios</span>
          <span className="text-xs font-body px-2 py-0.5 rounded-full font-semibold ml-1"
            style={{
              backgroundColor: isOpenToday ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              color: isOpenToday ? "#22C55E" : "#EF4444",
            }}>
            {isOpenToday ? "Abierto hoy" : "Cerrado hoy"}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" style={{ color: "#52525B" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "#52525B" }} />}
      </button>
      {expanded && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          {days.map((key) => {
            const d = schedule?.[key];
            const isToday = key === today;
            return (
              <div key={key} className="flex items-center justify-between px-4 py-2.5"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  backgroundColor: isToday ? "rgba(202,138,4,0.04)" : "#111111",
                }}>
                <span className="text-sm font-body capitalize"
                  style={{ color: isToday ? "#CA8A04" : "#A1A1AA", fontWeight: isToday ? 600 : 400 }}>
                  {DAY_LABELS_FULL[key]}
                </span>
                <span className="text-sm font-body"
                  style={{ color: d?.enabled ? (isToday ? "#CA8A04" : "#71717A") : "#3F3F46" }}>
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

/* ─── Landing: reseñas ────────────────────────────────────────────────────── */
function ReviewsList({ reviews }: { reviews: ShopData["reviews"] }) {
  if (reviews.count === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4" fill="#CA8A04" style={{ color: "#CA8A04" }} />
        <span className="text-sm font-bold text-white font-body">
          {reviews.avg?.toFixed(1)} <span className="font-normal" style={{ color: "#52525B" }}>· {reviews.count} reseñas</span>
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {reviews.list.slice(0, 3).map((r, i) => (
          <div key={i} className="p-4 rounded-xl"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white font-body">{r.clientName}</span>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} className="w-3 h-3"
                    fill={r.rating >= n ? "#CA8A04" : "transparent"}
                    style={{ color: r.rating >= n ? "#CA8A04" : "#3F3F46" }} />
                ))}
              </div>
            </div>
            {r.comment && <p className="text-xs font-body leading-relaxed" style={{ color: "#71717A" }}>{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function BookPage() {
  const params = useParams<{ slug: string }>();
  const slug   = params.slug;

  // Datos de la barbería
  const [shop,     setShop]     = useState<ShopData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Estado del booking
  const [showLanding,      setShowLanding]      = useState(true);
  const [step,             setStep]             = useState(0);
  const [selectedServices, setSelectedServices] = useState<ServiceData[]>([]);
  const [selectedBarber,   setSelectedBarber]   = useState<BarberData | null>(null);
  const [selectedDate,     setSelectedDate]     = useState<string>("");
  const [selectedTime,     setSelectedTime]     = useState<string>("");
  const [form,             setForm]             = useState({ name: "", phone: "", email: "", birthdate: "" });

  // Flujo multi-servicio
  type SeparateBooking = {
    service: ServiceData;
    barberId: string; barberName: string; barberColorTag: string;
    date: string; time: string;
  };
  const [bookingMode,      setBookingMode]      = useState<"consecutive" | "separate" | null>(null);
  const [showModeSelect,   setShowModeSelect]   = useState(false);
  const [separateBookings, setSeparateBookings] = useState<SeparateBooking[]>([]);
  const [currentSepIdx,    setCurrentSepIdx]    = useState(0);

  // Slots
  const [slots,        setSlots]        = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dayClosed,    setDayClosed]    = useState(false);
  const [slotBarberMap, setSlotBarberMap] = useState<Record<string, string>>({});

  // Envío
  const [submitting, setSubmitting] = useState(false);
  const [submitError,setSubmitError]= useState("");
  const [confirmed,  setConfirmed]  = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<string[]>([]);

  // Reseña post-turno
  const [reviewRating,  setReviewRating]  = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSent,    setReviewSent]    = useState(false);
  const [reviewSending, setReviewSending] = useState(false);

  // Modal perfil barbero
  const [previewBarber, setPreviewBarber] = useState<BarberData | null>(null);

  /* ── Carga inicial ─────────────────────────────────────────────────────── */
  useEffect(() => {
    fetch(`/api/book/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((json) => { if (json) setShop(json.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  /* ── Slots ─────────────────────────────────────────────────────────────── */
  const fetchSlots = useCallback(() => {
    if (!selectedBarber || !selectedDate || !shop) return;
    const totalDuration = bookingMode === "separate"
      ? Math.max(15, separateBookings[currentSepIdx]?.service.durationMins ?? 15)
      : Math.max(15, selectedServices.reduce((s, sv) => s + sv.durationMins, 0));

    setSlotsLoading(true); setSlots([]); setSelectedTime(""); setSlotBarberMap({});

    if (selectedBarber.id === "any") {
      const barbers = shop.barbers;
      if (barbers.length === 0) { setSlotsLoading(false); return; }
      Promise.all(
        barbers.map((b) =>
          fetch(`/api/book/${slug}/slots?barberId=${b.id}&date=${selectedDate}&totalDuration=${totalDuration}`)
            .then((r) => r.json())
            .then(({ data }) => ({ barberId: b.id, slots: (data?.slots ?? []) as string[], closed: data?.closed ?? false }))
            .catch(() => ({ barberId: b.id, slots: [] as string[], closed: false }))
        )
      ).then((results) => {
        const map: Record<string, string> = {};
        for (const { barberId, slots: s } of results) {
          for (const slot of s) { if (!map[slot]) map[slot] = barberId; }
        }
        const mergedSlots = Object.keys(map).sort();
        const closed = results.every((r) => r.closed);
        setSlots(mergedSlots); setDayClosed(closed); setSlotBarberMap(map);
      }).finally(() => setSlotsLoading(false));
    } else {
      fetch(`/api/book/${slug}/slots?barberId=${selectedBarber.id}&date=${selectedDate}&totalDuration=${totalDuration}`)
        .then((r) => r.json())
        .then(({ data }) => { setSlots(data.slots ?? []); setDayClosed(data.closed ?? false); })
        .catch(console.error)
        .finally(() => setSlotsLoading(false));
    }
  }, [selectedBarber, selectedDate, selectedServices, shop, slug, bookingMode, separateBookings, currentSepIdx]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  /* ── Confirmar reserva ─────────────────────────────────────────────────── */
  async function confirmar() {
    setSubmitError(""); setSubmitting(true);
    try {
      if (bookingMode === "separate") {
        const results = await Promise.all(
          separateBookings.map((sb) =>
            fetch(`/api/book/${slug}/appointments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                barberId:        sb.barberId,
                serviceIds:      [sb.service.id],
                startsAt:        new Date(`${sb.date}T${sb.time}:00`).toISOString(),
                clientName:      form.name.trim(),
                clientPhone:     form.phone.trim(),
                clientEmail:     form.email.trim() || null,
                clientBirthdate: form.birthdate || null,
              }),
            })
          )
        );
        const failed = results.find((r) => !r.ok);
        if (failed) {
          const err = await failed.json().catch(() => ({}));
          setSubmitError(err.error ?? "Error al confirmar uno de los turnos."); return;
        }
        const ids = await Promise.all(results.map(async (r) => {
          const json = await r.json().catch(() => ({}));
          return json.data?.id as string | undefined;
        }));
        setConfirmedIds(ids.filter(Boolean) as string[]);
      } else {
        if (!selectedBarber || !selectedDate || !selectedTime || selectedServices.length === 0) return;
        const barberId = selectedBarber.id === "any"
          ? slotBarberMap[selectedTime] ?? shop!.barbers[0]?.id
          : selectedBarber.id;
        if (!barberId) return;
        const res = await fetch(`/api/book/${slug}/appointments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            barberId,
            serviceIds:      selectedServices.map((s) => s.id),
            startsAt:        new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
            clientName:      form.name.trim(),
            clientPhone:     form.phone.trim(),
            clientEmail:     form.email.trim() || null,
            clientBirthdate: form.birthdate || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setSubmitError(err.error ?? "Error al confirmar. Intenta de nuevo."); return;
        }
        const json = await res.json().catch(() => ({}));
        setConfirmedIds(json.data?.id ? [json.data.id] : []);
      }
      setConfirmed(true); setStep(4);
    } catch {
      setSubmitError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Enviar reseña ─────────────────────────────────────────────────────── */
  async function enviarResena() {
    if (!reviewRating || !shop) return;
    setReviewSending(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barbershopId:  shop.id,
          appointmentId: confirmedIds[0] ?? null,
          clientName:    form.name.trim() || "Cliente",
          clientPhone:   form.phone.trim() || null,
          rating:        reviewRating,
          comment:       reviewComment.trim() || null,
        }),
      });
      setReviewSent(true);
    } catch { /* no bloquear */ }
    finally { setReviewSending(false); }
  }

  function resetBooking() {
    setStep(0); setSelectedServices([]); setSelectedBarber(null);
    setSelectedDate(""); setSelectedTime(""); setSlots([]);
    setForm({ name: "", phone: "", email: "", birthdate: "" }); setConfirmed(false);
    setSubmitError(""); setBookingMode(null); setShowModeSelect(false);
    setSeparateBookings([]); setCurrentSepIdx(0);
    setReviewRating(0); setReviewComment(""); setReviewSent(false);
    setShowLanding(true);
  }

  const totalPrice    = selectedServices.reduce((s, sv) => s + Number(sv.price), 0);
  const totalDuration = selectedServices.reduce((s, sv) => s + Number(sv.durationMins), 0);
  const schedule      = shop?.settings?.schedule;
  const days          = getDays(schedule);
  const coverColor    = shop?.coverColor    ?? "#CA8A04";
  const coverImageUrl = shop?.coverImageUrl ?? null;

  /* ── Loading / NotFound ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#080808" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#CA8A04" }} />
      </div>
    );
  }
  if (notFound || !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-5" style={{ backgroundColor: "#080808" }}>
        <AlertCircle className="w-12 h-12" style={{ color: "#EF4444" }} />
        <h1 className="text-xl font-bold text-white font-body">Barbería no encontrada</h1>
        <p className="text-sm font-body text-center" style={{ color: "#52525B" }}>
          El enlace puede estar incorrecto o la barbería ya no está disponible.
        </p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     LANDING PAGE
  ══════════════════════════════════════════════════════════════════════════ */
  if (showLanding) {
    const grouped = shop.services.reduce<Record<string, ServiceData[]>>((acc, s) => {
      const cat = s.category || "general";
      acc[cat] = acc[cat] ? [...acc[cat], s] : [s];
      return acc;
    }, {});

    return (
      <div className="min-h-screen font-body" style={{ backgroundColor: "#080808" }}>

        {/* ── Portada hero ─────────────────────────────────────────────── */}
        <div className="relative h-32 sm:h-40 w-full overflow-hidden"
          style={
            coverImageUrl
              ? { backgroundImage: `url(${coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: `linear-gradient(135deg, #0A0A0A 0%, ${coverColor}44 100%)` }
          }>
          {/* Patrón sutil (solo cuando no hay foto) */}
          {!coverImageUrl && (
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: `radial-gradient(${coverColor} 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
          )}
          {/* Overlay oscuro cuando hay foto para que el logo se vea bien */}
          {coverImageUrl && (
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.4))" }} />
          )}
        </div>

        {/* ── Info principal ───────────────────────────────────────────── */}
        <div className="max-w-lg mx-auto px-5">
          {/* Logo + nombre: el logo sale del cover con z-index explícito */}
          <div className="flex items-end gap-4 mb-5" style={{ marginTop: "-40px" }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 border-4 overflow-hidden flex-shrink-0"
              style={{
                backgroundColor: shop.logoUrl ? "transparent" : coverColor + "22",
                color: coverColor,
                borderColor: "#080808",
                zIndex: 10,
                position: "relative",
              }}>
              {shop.logoUrl
                ? <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                : shop.name[0].toUpperCase()
              }
            </div>
            <div className="pb-1 flex-1 min-w-0" style={{ zIndex: 10, position: "relative" }}>
              <h1 className="text-xl font-bold text-white font-body leading-tight">{shop.name}</h1>
              {shop.reviews.avg && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="w-3.5 h-3.5 flex-shrink-0" fill="#CA8A04" style={{ color: "#CA8A04" }} />
                  <span className="text-sm font-semibold font-body" style={{ color: "#CA8A04" }}>
                    {shop.reviews.avg.toFixed(1)}
                  </span>
                  <span className="text-xs font-body" style={{ color: "#52525B" }}>({shop.reviews.count})</span>
                </div>
              )}
            </div>
          </div>

          {/* Chips de info */}
          <div className="flex flex-wrap gap-2 mb-6">
            {shop.address && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#71717A" }}>
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {shop.address}{shop.city ? `, ${shop.city}` : ""}
              </div>
            )}
            {shop.phone && (
              <a href={`tel:${shop.phone}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body transition-colors hover:text-white"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#71717A" }}>
                <Phone className="w-3 h-3 flex-shrink-0" />
                {shop.phone}
              </a>
            )}
            {shop.instagramUrl && (
              <a href={shop.instagramUrl} target="_blank"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body transition-colors hover:text-white"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#71717A" }}>
                <Instagram className="w-3 h-3 flex-shrink-0" />
                Instagram
              </a>
            )}
          </div>

          {/* Descripción */}
          {shop.description && (
            <p className="text-sm font-body leading-relaxed mb-6" style={{ color: "#A1A1AA" }}>
              {shop.description}
            </p>
          )}

          {/* ── Servicios ──────────────────────────────────────────────── */}
          {shop.services.length > 0 && (
            <section className="mb-8">
              <h2 className="text-base font-bold text-white font-body mb-4">Servicios</h2>
              <div className="flex flex-col gap-2">
                {Object.entries(grouped).map(([cat, svcs]) => (
                  <div key={cat}>
                    {Object.keys(grouped).length > 1 && (
                      <p className="text-xs font-semibold uppercase tracking-wider font-body mb-2 capitalize"
                        style={{ color: "#52525B" }}>{cat}</p>
                    )}
                    {svcs.map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-xl mb-1.5"
                        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white font-body">{s.name}</p>
                          <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {s.durationMins} min
                          </p>
                        </div>
                        <span className="text-sm font-bold font-body ml-4 flex-shrink-0" style={{ color: coverColor }}>
                          {fmt(s.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Barberos ───────────────────────────────────────────────── */}
          {shop.barbers.length > 0 && (
            <section className="mb-8">
              <h2 className="text-base font-bold text-white font-body mb-4">El equipo</h2>
              <div className="flex flex-col gap-2">
                {shop.barbers.map((b) => {
                  const color = b.colorTag ?? coverColor;
                  return (
                    <div key={b.id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: color + "22", color }}>
                        {getInitials(b.user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white font-body">{b.user.name}</p>
                        {b.specialties.length > 0 && (
                          <p className="text-xs font-body truncate mt-0.5" style={{ color: "#52525B" }}>
                            {b.specialties.join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Horario ────────────────────────────────────────────────── */}
          <section className="mb-8">
            <h2 className="text-base font-bold text-white font-body mb-4">Horario</h2>
            <SchedulePreview schedule={schedule} />
          </section>

          {/* ── Reseñas ────────────────────────────────────────────────── */}
          {shop.reviews.count > 0 && (
            <section className="mb-8">
              <h2 className="text-base font-bold text-white font-body mb-4">Reseñas</h2>
              <ReviewsList reviews={shop.reviews} />
            </section>
          )}

          {/* Botón principal */}
          <button
            onClick={() => setShowLanding(false)}
            className="w-full py-4 rounded-2xl text-base font-bold font-body text-white mb-12 transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: coverColor }}>
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

  /* Pantalla de selección de modo */
  const ModeSelectStep = (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-white font-body mb-0.5">¿Cómo quieres agendar?</h2>
        <p className="text-xs font-body" style={{ color: "#52525B" }}>Elegiste {selectedServices.length} servicios</p>
      </div>
      {[
        {
          mode: "consecutive" as const,
          title: "Uno tras otro",
          desc: "Todos los servicios el mismo día, seguidos y con el mismo barbero.",
          detail: `${totalDuration} min en total · ${fmt(totalPrice)}`,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2">
              <rect x="2" y="3" width="8" height="18" rx="2"/><rect x="14" y="3" width="8" height="18" rx="2"/>
            </svg>
          ),
        },
        {
          mode: "separate" as const,
          title: "Por separado",
          desc: "Elige barbero, fecha y hora distinta para cada servicio.",
          detail: `${selectedServices.length} turnos independientes`,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2">
              <rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/>
            </svg>
          ),
        },
      ].map(({ mode, title, desc, detail, icon }) => (
        <button key={mode}
          onClick={() => {
            setBookingMode(mode);
            setShowModeSelect(false);
            if (mode === "separate") {
              setSeparateBookings(selectedServices.map((s) => ({
                service: s, barberId: "", barberName: "", barberColorTag: "", date: "", time: "",
              })));
              setCurrentSepIdx(0);
            }
            setSelectedBarber(null); setSelectedDate(""); setSelectedTime("");
            setStep(1);
          }}
          className="flex items-start gap-4 p-5 rounded-2xl text-left transition-all hover:border-yellow-600/40"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.15)" }}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white font-body">{title}</p>
            <p className="text-xs font-body mt-1 leading-relaxed" style={{ color: "#71717A" }}>{desc}</p>
            <p className="text-xs font-semibold font-body mt-2" style={{ color: "#CA8A04" }}>{detail}</p>
          </div>
        </button>
      ))}
      <button onClick={() => setShowModeSelect(false)}
        className="w-full py-3 rounded-2xl text-sm font-semibold font-body"
        style={{ backgroundColor: "#111111", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }}>
        Volver
      </button>
    </div>
  );

  /* Step 0 */
  const Step0 = (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-white font-body mb-0.5">¿Qué servicio necesitas?</h2>
        <p className="text-xs font-body" style={{ color: "#52525B" }}>Puedes elegir más de uno</p>
      </div>
      {shop.services.length === 0 ? (
        <div className="py-12 text-center">
          <Scissors className="w-8 h-8 mx-auto mb-3" style={{ color: "#27272A" }} />
          <p className="text-sm font-body" style={{ color: "#3F3F46" }}>Esta barbería aún no tiene servicios publicados.</p>
        </div>
      ) : (
        shop.services.map((s) => {
          const selected = selectedServices.some((sv) => sv.id === s.id);
          return (
            <button key={s.id}
              onClick={() => setSelectedServices((prev) =>
                selected ? prev.filter((sv) => sv.id !== s.id) : [...prev, s]
              )}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
              style={{
                backgroundColor: selected ? "rgba(202,138,4,0.08)" : "#111111",
                border: selected ? "1.5px solid #CA8A04" : "1px solid rgba(255,255,255,0.06)",
              }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white font-body">{s.name}</p>
                {s.description && (
                  <p className="text-xs font-body mt-0.5 line-clamp-1" style={{ color: "#52525B" }}>{s.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-body flex items-center gap-1" style={{ color: "#52525B" }}>
                    <Clock className="w-3 h-3" /> {s.durationMins} min
                  </span>
                  <span className="text-xs font-semibold font-body" style={{ color: "#CA8A04" }}>{fmt(s.price)}</span>
                </div>
              </div>
              {selected && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#CA8A04" }} />}
            </button>
          );
        })
      )}
      {selectedServices.length > 0 && (
        <div className="rounded-xl p-3 flex items-center justify-between"
          style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.15)" }}>
          <span className="text-xs font-body" style={{ color: "#CA8A04" }}>
            {selectedServices.length} servicio{selectedServices.length > 1 ? "s" : ""} · {totalDuration} min
          </span>
          <span className="text-sm font-bold font-body" style={{ color: "#CA8A04" }}>{fmt(totalPrice)}</span>
        </div>
      )}
      <button disabled={selectedServices.length === 0}
        onClick={() => {
          if (selectedServices.length > 1) { setShowModeSelect(true); }
          else { setBookingMode("consecutive"); setStep(1); }
        }}
        className="mt-1 w-full py-3 rounded-2xl font-semibold text-sm font-body transition-all"
        style={{
          backgroundColor: selectedServices.length ? "#CA8A04" : "#1A1A1A",
          color: selectedServices.length ? "#000" : "#3F3F46",
          cursor: selectedServices.length ? "pointer" : "not-allowed",
        }}>
        Continuar
      </button>
    </div>
  );

  /* Step 1 */
  const sepSvc1 = bookingMode === "separate" ? separateBookings[currentSepIdx]?.service : null;
  const Step1 = (
    <div className="flex flex-col gap-3">
      {sepSvc1 ? (
        <div>
          <p className="text-xs font-body mb-0.5" style={{ color: "#CA8A04" }}>
            Servicio {currentSepIdx + 1} de {separateBookings.length}: <span className="font-semibold">{sepSvc1.name}</span>
          </p>
          <h2 className="text-lg font-semibold text-white font-body">Elige tu barbero</h2>
        </div>
      ) : (
        <h2 className="text-lg font-semibold text-white font-body mb-1">Elige tu barbero</h2>
      )}
      {shop.barbers.length === 0 ? (
        <p className="text-sm font-body py-8 text-center" style={{ color: "#3F3F46" }}>
          No hay barberos disponibles en este momento.
        </p>
      ) : (
        <>
          {shop.barbers.map((b) => {
            const color = b.colorTag ?? "#CA8A04";
            const isSelected = selectedBarber?.id === b.id;
            // Servicios relevantes: los seleccionados en step 0, o todos si no hay selección
            const relevantServices = selectedServices.length > 0 ? selectedServices : shop.services;
            return (
              <button key={b.id}
                className="flex items-start gap-4 p-4 w-full text-left rounded-2xl transition-all"
                style={{
                  backgroundColor: isSelected ? "rgba(202,138,4,0.06)" : "#111111",
                  border: isSelected ? "1.5px solid #CA8A04" : "1px solid rgba(255,255,255,0.06)",
                }}
                onClick={() => setSelectedBarber(b)}>
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: color + "22", color }}>
                  {getInitials(b.user.name)}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  {/* Nombre + check */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white font-body">{b.user.name}</p>
                    {isSelected && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#CA8A04" }} />}
                  </div>

                  {/* Especialidades */}
                  {b.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {b.specialties.map((s, i) => (
                        <span key={i} className="text-[10px] font-body px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: color + "18", color, border: `1px solid ${color}30` }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Certificaciones */}
                  {b.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {b.certifications.slice(0, 3).map((c) => (
                        <span key={c.id} className="text-[10px] font-body px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#71717A", border: "1px solid rgba(255,255,255,0.07)" }}>
                          🎓 {c.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Servicios */}
                  {relevantServices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {relevantServices.slice(0, 4).map((s) => (
                        <span key={s.id} className="text-[10px] font-body px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {s.name}
                        </span>
                      ))}
                      {relevantServices.length > 4 && (
                        <span className="text-[10px] font-body px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#3F3F46" }}>
                          +{relevantServices.length - 4} más
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          <button
            onClick={() => setSelectedBarber({ id: "any", colorTag: "#52525B", specialties: [], bio: null, certifications: [], user: { name: "Sin preferencia" } })}
            className="flex items-center gap-4 p-4 rounded-2xl transition-all"
            style={{
              backgroundColor: selectedBarber?.id === "any" ? "rgba(202,138,4,0.08)" : "#0D0D0D",
              border: selectedBarber?.id === "any" ? "1.5px solid #CA8A04" : "1px dashed rgba(255,255,255,0.08)",
            }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#52525B" }}>✦</div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-white font-body">Sin preferencia</p>
              <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>El primero disponible en tu horario</p>
            </div>
            {selectedBarber?.id === "any" && <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#CA8A04" }} />}
          </button>
        </>
      )}
      <div className="flex gap-3 mt-1">
        <button
          onClick={() => {
            if (bookingMode === "separate" && currentSepIdx > 0) {
              setCurrentSepIdx((i) => i - 1); setSelectedBarber(null); setSelectedDate(""); setSelectedTime("");
            } else if (bookingMode === "separate") {
              setShowModeSelect(true); setStep(0);
            } else {
              setShowModeSelect(selectedServices.length > 1); setStep(0);
            }
          }}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body"
          style={{ backgroundColor: "#111111", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.06)" }}>
          Volver
        </button>
        <button disabled={!selectedBarber} onClick={() => setStep(2)}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body transition-all"
          style={{
            backgroundColor: selectedBarber ? "#CA8A04" : "#1A1A1A",
            color: selectedBarber ? "#000" : "#3F3F46",
            cursor: selectedBarber ? "pointer" : "not-allowed",
          }}>
          Continuar
        </button>
      </div>
    </div>
  );

  /* Step 2 */
  const sepSvc2 = bookingMode === "separate" ? separateBookings[currentSepIdx]?.service : null;
  const Step2 = (
    <div className="flex flex-col gap-4">
      {sepSvc2 ? (
        <div>
          <p className="text-xs font-body mb-0.5" style={{ color: "#CA8A04" }}>
            Servicio {currentSepIdx + 1} de {separateBookings.length}: <span className="font-semibold">{sepSvc2.name}</span>
          </p>
          <h2 className="text-lg font-semibold text-white font-body">Elige fecha y hora</h2>
        </div>
      ) : (
        <h2 className="text-lg font-semibold text-white font-body">Elige fecha y hora</h2>
      )}
      <div>
        <p className="text-xs font-body mb-2" style={{ color: "#52525B" }}>Fecha</p>
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {days.map((d) => (
            <button key={d.dateStr}
              onClick={() => { if (d.isOpen) setSelectedDate(d.dateStr); }}
              disabled={!d.isOpen}
              className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl flex-shrink-0 transition-all"
              style={{
                minWidth: "52px",
                backgroundColor: selectedDate === d.dateStr ? "rgba(202,138,4,0.1)" : d.isOpen ? "#111111" : "#0A0A0A",
                border: selectedDate === d.dateStr ? "1.5px solid #CA8A04" : d.isOpen ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.03)",
                opacity: d.isOpen ? 1 : 0.35, cursor: d.isOpen ? "pointer" : "not-allowed",
              }}>
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
          ) : dayClosed ? (
            <p className="text-sm font-body py-4 text-center" style={{ color: "#3F3F46" }}>La barbería está cerrada ese día.</p>
          ) : slots.length === 0 ? (
            <p className="text-sm font-body py-4 text-center" style={{ color: "#3F3F46" }}>Sin horarios disponibles. Prueba con otro día.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((t) => (
                <button key={t} onClick={() => setSelectedTime(t)}
                  className="py-2 rounded-xl text-xs font-body font-semibold transition-all"
                  style={{
                    backgroundColor: selectedTime === t ? "#CA8A04" : "#111111",
                    color: selectedTime === t ? "#000" : "#A1A1AA",
                    border: selectedTime === t ? "1.5px solid #CA8A04" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex gap-3 mt-1">
        <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body"
          style={{ backgroundColor: "#111111", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.06)" }}>
          Volver
        </button>
        <button disabled={!selectedDate || !selectedTime}
          onClick={() => {
            if (bookingMode === "separate") {
              const barber = selectedBarber!;
              setSeparateBookings((prev) => {
                const next = [...prev];
                next[currentSepIdx] = {
                  ...next[currentSepIdx],
                  barberId:      barber.id === "any" ? (slotBarberMap[selectedTime] ?? shop!.barbers[0]?.id ?? "") : barber.id,
                  barberName:    barber.id === "any" ? "Sin preferencia" : barber.user.name,
                  barberColorTag: barber.colorTag ?? "#CA8A04",
                  date:          selectedDate, time: selectedTime,
                };
                return next;
              });
              if (currentSepIdx < separateBookings.length - 1) {
                setCurrentSepIdx((i) => i + 1); setSelectedBarber(null); setSelectedDate(""); setSelectedTime(""); setStep(1);
              } else { setStep(3); }
            } else { setStep(3); }
          }}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body transition-all"
          style={{
            backgroundColor: (selectedDate && selectedTime) ? "#CA8A04" : "#1A1A1A",
            color: (selectedDate && selectedTime) ? "#000" : "#3F3F46",
            cursor: (selectedDate && selectedTime) ? "pointer" : "not-allowed",
          }}>
          {bookingMode === "separate" && currentSepIdx < separateBookings.length - 1
            ? `Siguiente (${currentSepIdx + 2}/${separateBookings.length})`
            : "Continuar"}
        </button>
      </div>
    </div>
  );

  /* Step 3 */
  const dayObj   = days.find((d) => d.dateStr === selectedDate);
  const dayLabel = dayObj ? `${dayObj.dayName} ${dayObj.label}` : selectedDate;
  const Step3 = (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-white font-body">Tus datos de contacto</h2>
      <p className="text-xs font-body -mt-2" style={{ color: "#52525B" }}>
        Te enviaremos la confirmación y recordatorios por WhatsApp.
      </p>
      <div className="rounded-2xl p-4 flex flex-col gap-2"
        style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.15)" }}>
        <p className="text-xs font-body font-semibold" style={{ color: "#CA8A04" }}>Tu reserva</p>
        {bookingMode === "separate" ? (
          separateBookings.map((sb, i) => (
            <div key={i} className="flex flex-col gap-0.5 pt-2 first:pt-0"
              style={{ borderTop: i > 0 ? "1px solid rgba(202,138,4,0.1)" : "none" }}>
              <p className="text-xs font-bold text-white font-body">{sb.service.name}</p>
              <p className="text-xs font-body" style={{ color: "#71717A" }}>
                {sb.barberName} · {sb.date} {sb.time} · {fmt(sb.service.price)}
              </p>
            </div>
          ))
        ) : (
          [
            { icon: Scissors, text: selectedServices.map(s => s.name).join(" + ") },
            { icon: User,     text: selectedBarber?.id === "any" ? "Sin preferencia" : selectedBarber?.user.name },
            { icon: Calendar, text: dayLabel },
            { icon: Clock,    text: `${selectedTime} · ${totalDuration} min · ${fmt(totalPrice)}` },
          ].map(({ icon: Icon, text }) => text ? (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#CA8A04" }} />
              <span className="text-xs font-body text-white">{text}</span>
            </div>
          ) : null)
        )}
      </div>
      <div className="flex flex-col gap-3">
        {[
          { label: "Nombre completo", placeholder: "Ej. Rodrigo Silva", type: "text", key: "name" as const },
          { label: "Teléfono (WhatsApp)", placeholder: "+54 9 11 1234 5678", type: "tel", key: "phone" as const },
          { label: "Correo electrónico (opcional)", placeholder: "tu@email.com", type: "email", key: "email" as const },
        ].map(({ label, placeholder, type, key }) => (
          <div key={key}>
            <label className="text-xs font-body font-medium mb-1.5 block" style={{ color: "#A1A1AA" }}>{label}</label>
            <input type={type} placeholder={placeholder}
              value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm font-body text-white outline-none transition-all"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
        ))}

        {/* Fecha de nacimiento — opcional, para cumpleaños */}
        <div>
          <label className="text-xs font-body font-medium mb-1.5 flex items-center gap-1.5 block" style={{ color: "#A1A1AA" }}>
            Fecha de nacimiento
            <span className="text-[10px] px-1.5 py-0.5 rounded font-body" style={{ backgroundColor: "rgba(202,138,4,0.08)", color: "#CA8A04" }}>
              Opcional · para enviarte saludos 🎂
            </span>
          </label>
          <input
            type="date"
            value={form.birthdate}
            onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value }))}
            max={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-3 rounded-xl text-sm font-body text-white outline-none transition-all"
            style={{
              backgroundColor: "#111111",
              border: "1px solid rgba(255,255,255,0.08)",
              colorScheme: "dark",
            }}
          />
        </div>
      </div>
      {submitError && (
        <div className="flex items-start gap-2 p-3 rounded-xl"
          style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
          <p className="text-xs font-body" style={{ color: "#EF4444" }}>{submitError}</p>
        </div>
      )}
      <p className="text-[11px] font-body leading-relaxed" style={{ color: "#3F3F46" }}>
        Al confirmar, aceptas recibir recordatorios por WhatsApp. No compartimos tus datos con terceros.
      </p>
      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body"
          style={{ backgroundColor: "#111111", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.06)" }}>
          Volver
        </button>
        <button
          disabled={submitting || !form.name.trim() || form.phone.trim().length < 6}
          onClick={confirmar}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm font-body transition-all flex items-center justify-center gap-2"
          style={{
            backgroundColor: (form.name.trim() && form.phone.trim().length >= 6) ? "#CA8A04" : "#1A1A1A",
            color: (form.name.trim() && form.phone.trim().length >= 6) ? "#000" : "#3F3F46",
            cursor: (form.name.trim() && form.phone.trim().length >= 6 && !submitting) ? "pointer" : "not-allowed",
          }}>
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</> : "Confirmar turno"}
        </button>
      </div>
    </div>
  );

  /* Step 4 — confirmación + reseña */
  const Step4 = (
    <div className="flex flex-col items-center gap-6 text-center pt-4">
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "rgba(202,138,4,0.12)", border: "2px solid #CA8A04" }}>
        <CheckCircle2 className="w-10 h-10" style={{ color: "#CA8A04" }} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white font-body mb-1">¡Turno confirmado!</h2>
        <p className="text-sm font-body" style={{ color: "#71717A" }}>
          Te enviamos los detalles por WhatsApp al <span className="text-white">{form.phone}</span>
        </p>
      </div>

      <div className="w-full rounded-2xl p-5 text-left flex flex-col gap-3"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-body font-semibold uppercase tracking-widest mb-1" style={{ color: "#52525B" }}>
          Detalle del turno
        </p>

        {/* Modo separado: listar cada turno */}
        {bookingMode === "separate" ? (
          <div className="flex flex-col gap-3">
            {separateBookings.map((sb, i) => (
              <div key={i} className="flex flex-col gap-1.5 p-3 rounded-xl"
                style={{ backgroundColor: "#0D0D0D", border: i > 0 ? "none" : undefined }}>
                <p className="text-xs font-bold font-body" style={{ color: "#CA8A04" }}>
                  Turno {i + 1}: {sb.service.name}
                </p>
                {[
                  { icon: User,     text: sb.barberName },
                  { icon: Calendar, text: new Date(sb.date + "T12:00:00").toLocaleDateString("es-419", { weekday: "short", day: "numeric", month: "short" }) },
                  { icon: Clock,    text: `${sb.time} · ${sb.service.durationMins} min · $${Number(sb.service.price).toLocaleString("es-419")}` },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon className="w-3 h-3 flex-shrink-0" style={{ color: "#CA8A04" }} />
                    <span className="text-xs font-body text-white">{text}</span>
                  </div>
                ))}
              </div>
            ))}
            {/* Datos cliente */}
            {[
              { icon: User,  label: "Cliente",  value: form.name },
              { icon: Phone, label: "WhatsApp", value: form.phone },
              ...(form.email ? [{ icon: Mail, label: "Correo", value: form.email }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(202,138,4,0.08)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-body" style={{ color: "#52525B" }}>{label}</p>
                  <p className="text-sm font-body font-medium text-white truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Modo consecutivo */
          [
            { icon: User,     label: "Cliente",  value: form.name },
            { icon: Scissors, label: "Servicio", value: selectedServices.map(s => s.name).join(" + ") },
            { icon: User,     label: "Barbero",  value: selectedBarber?.id === "any" ? "Sin preferencia" : selectedBarber?.user.name },
            { icon: Calendar, label: "Fecha",    value: dayLabel },
            { icon: Clock,    label: "Duración", value: `${totalDuration} min` },
            { icon: Clock,    label: "Hora",     value: selectedTime },
            { icon: Phone,    label: "WhatsApp", value: form.phone },
            ...(form.email ? [{ icon: Mail, label: "Correo", value: form.email }] : []),
          ].map(({ icon: Icon, label, value }) => value ? (
            <div key={label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(202,138,4,0.08)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-body" style={{ color: "#52525B" }}>{label}</p>
                <p className="text-sm font-body font-medium text-white truncate">{value}</p>
              </div>
            </div>
          ) : null)
        )}
      </div>

      {/* ── Sección de reseña ───────────────────────────────────────── */}
      {!reviewSent ? (
        <div className="w-full rounded-2xl p-5 text-left flex flex-col gap-4"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-sm font-bold text-white font-body">¿Cómo fue tu experiencia?</p>
            <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>
              Tu opinión ayuda a mejorar el servicio (opcional)
            </p>
          </div>
          <div className="flex justify-center">
            <StarRating value={reviewRating} onChange={setReviewRating} />
          </div>
          {reviewRating > 0 && (
            <>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Cuenta cómo fue (opcional)..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl text-sm font-body text-white outline-none resize-none"
                style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              <button onClick={enviarResena} disabled={reviewSending}
                className="w-full py-3 rounded-xl text-sm font-bold font-body transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}>
                {reviewSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar reseña"}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="w-full rounded-2xl p-5 flex flex-col items-center gap-2"
          style={{ backgroundColor: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <CheckCircle2 className="w-8 h-8" style={{ color: "#22C55E" }} />
          <p className="text-sm font-bold text-white font-body">¡Gracias por tu reseña!</p>
          <p className="text-xs font-body" style={{ color: "#71717A" }}>Tu opinión ya fue registrada.</p>
        </div>
      )}

      <div className="w-full rounded-xl p-4 text-left"
        style={{ backgroundColor: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
        <p className="text-xs font-body font-semibold mb-1" style={{ color: "#22C55E" }}>Recordatorios automáticos</p>
        <p className="text-xs font-body leading-relaxed" style={{ color: "#71717A" }}>
          Recibirás un recordatorio 24 hs antes y 1 hora antes de tu turno. Para cancelar, respondé el mensaje de WhatsApp.
        </p>
      </div>

      <button
        onClick={resetBooking}
        className="text-sm font-body font-semibold px-6 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
        style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        Reservar otro turno
      </button>
    </div>
  );

  const STEP_CONTENT = [Step0, Step1, Step2, Step3, Step4];

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: "#080808" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4"
        style={{ backgroundColor: "rgba(8,8,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}>
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
          style={{ color: "#52525B" }}
          onClick={() => {
            if (step === 0) setShowLanding(true);
            else if (showModeSelect) setShowModeSelect(false);
            else if (step > 0) setStep((s) => s - 1);
          }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-white font-body truncate">{shop.name}</p>
          {shop.address && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "#52525B" }} />
              <p className="text-xs font-body truncate max-w-[180px]" style={{ color: "#52525B" }}>{shop.address}</p>
            </div>
          )}
        </div>
        <span className="text-xs font-body px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: "rgba(202,138,4,0.08)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}>
          {step < 4 ? `${step + 1}/4` : "✓"}
        </span>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8">
        <StepBar current={showModeSelect ? 0 : step} />
        {showModeSelect ? ModeSelectStep : STEP_CONTENT[step]}
      </main>

      {/* Modal perfil de barbero */}
      {previewBarber && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
          <div className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={() => setPreviewBarber(null)} />
          <div className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "90vh" }}>
            <div className="h-14 w-full flex-shrink-0" style={{ backgroundColor: (previewBarber.colorTag ?? "#CA8A04") + "18" }} />
            <div className="px-5 pb-6 overflow-y-auto">
              <div className="flex items-end justify-between -mt-7 mb-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold font-body"
                  style={{ backgroundColor: (previewBarber.colorTag ?? "#CA8A04") + "22", color: previewBarber.colorTag ?? "#CA8A04", border: "3px solid #111111" }}>
                  {getInitials(previewBarber.user.name)}
                </div>
                <button onClick={() => setPreviewBarber(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 hover:bg-white/5"
                  style={{ color: "#52525B" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-white font-body">{previewBarber.user.name}</h3>

              {/* Especialidades como chips */}
              {previewBarber.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 mb-3">
                  {previewBarber.specialties.map((s, i) => (
                    <span key={i} className="text-xs font-body px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: (previewBarber.colorTag ?? "#CA8A04") + "18", color: previewBarber.colorTag ?? "#CA8A04", border: `1px solid ${(previewBarber.colorTag ?? "#CA8A04")}30` }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio */}
              {previewBarber.bio && (
                <p className="text-sm font-body leading-relaxed mb-3" style={{ color: "#A1A1AA" }}>{previewBarber.bio}</p>
              )}

              {/* Cursos y certificaciones */}
              {previewBarber.certifications.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider font-body mb-2" style={{ color: "#52525B" }}>Cursos y certificaciones</p>
                  <div className="flex flex-col gap-1.5">
                    {previewBarber.certifications.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                        style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <span className="text-base flex-shrink-0">🎓</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white font-body truncate">{c.name}</p>
                          <p className="text-xs font-body truncate" style={{ color: "#52525B" }}>{c.issuer} · {c.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Servicios */}
              {shop.services.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider font-body mb-2" style={{ color: "#52525B" }}>Servicios</p>
                  <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                    {shop.services.map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                        style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <span className="text-sm font-body text-white">{s.name}</span>
                        <div className="flex items-center gap-2 text-xs font-body" style={{ color: "#52525B" }}>
                          <span>{s.durationMins} min</span>
                          <span style={{ color: previewBarber.colorTag ?? "#CA8A04" }}>{fmt(s.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => { setSelectedBarber(previewBarber); setPreviewBarber(null); }}
                className="w-full py-3 rounded-2xl font-semibold text-sm font-body transition-all hover:opacity-90"
                style={{
                  backgroundColor: selectedBarber?.id === previewBarber.id ? "#1A1A1A" : "#CA8A04",
                  color: selectedBarber?.id === previewBarber.id ? "#52525B" : "#000",
                  border: selectedBarber?.id === previewBarber.id ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                {selectedBarber?.id === previewBarber.id ? "Ya seleccionado ✓" : `Elegir a ${previewBarber.user.name.split(" ")[0]}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center py-8 mt-4">
        <p className="text-xs font-body" style={{ color: "#71717A" }}>
          Powered by <span style={{ color: "#CA8A04", fontWeight: 600 }}>Mibarberia</span>
        </p>
      </footer>
    </div>
  );
}
