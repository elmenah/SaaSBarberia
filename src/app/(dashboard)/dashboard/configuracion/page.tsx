"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Check, Copy, ExternalLink, Clock, Globe, CheckCircle2, Plus, Trash2, Ban, Image as ImageIcon, Instagram, Upload, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

/* ── Tipos ───────────────────────────────────────────────────────────────── */
type DaySchedule = {
  enabled: boolean;
  from: string;
  to: string;
  breakFrom: string;
  breakTo:   string;
  hasBreak:  boolean;
};

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

/* ── Bloqueos ─────────────────────────────────────────────────────────────── */
type Block = {
  id: string;
  reason: string;
  dateFrom: string;
  dateTo:   string;
  timeFrom: string;
  timeTo:   string;
  allDay:   boolean;
};

const BLOCK_REASONS = ["Feriado", "Vacaciones", "Capacitación", "Mantenimiento", "Turno médico", "Otro"];

const TABS = ["Horarios", "Bloqueos", "Enlace público", "Perfil de barbería"] as const;
type Tab = typeof TABS[number];

/* ── Perfil type ─────────────────────────────────────────────────────────── */
type FullBarbershop = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  whatsappNumber: string | null;
  settings: Record<string, unknown>;
};

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENTE
════════════════════════════════════════════════════════════════════════════ */
export default function ConfiguracionPage() {
  const { barbershop: authBarbershop, refreshBarbershop } = useAuth();

  const [activeTab,  setActiveTab]  = useState<Tab>("Horarios");
  const [schedule,   setSchedule]   = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [savedSch,   setSavedSch]   = useState(false);
  const [savingSch,  setSavingSch]  = useState(false);
  const [copied,     setCopied]     = useState(false);

  // Bloqueos (locales por ahora — se guardan en settings.blocks via PATCH)
  const [blocks,     setBlocks]     = useState<Block[]>([]);
  const [showForm,   setShowForm]   = useState(false);
  const [newBlock,   setNewBlock]   = useState<Omit<Block,"id">>({
    reason: "Feriado", dateFrom: "", dateTo: "", timeFrom: "09:00", timeTo: "20:00", allDay: true,
  });

  // Datos completos de la barbería (más campos que auth-context)
  const [full,       setFull]       = useState<FullBarbershop | null>(null);
  const [loadingFull, setLoadingFull] = useState(true);

  // Perfil form state
  const [profileName,      setProfileName]      = useState("");
  const [profileSlug,      setProfileSlug]      = useState("");
  const [profileAddress,   setProfileAddress]   = useState("");
  const [profileCity,      setProfileCity]      = useState("");
  const [profilePhone,     setProfilePhone]     = useState("");
  const [profileEmail,     setProfileEmail]     = useState("");
  const [profileDesc,      setProfileDesc]      = useState("");
  const [profileLogoUrl,   setProfileLogoUrl]   = useState("");
  const [profileCoverColor,setProfileCoverColor]= useState("#CA8A04");
  const [profileInstagram, setProfileInstagram] = useState("");

  const [profileCoverImageUrl, setProfileCoverImageUrl] = useState("");
  const [coverPreview,    setCoverPreview]    = useState<string>("");
  const [uploadingCover,  setUploadingCover]  = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [savedProfile,    setSavedProfile]    = useState(false);
  const [savingProfile,   setSavingProfile]   = useState(false);
  const [profileError,    setProfileError]    = useState("");
  const [uploadingLogo,   setUploadingLogo]   = useState(false);
  const [logoPreview,     setLogoPreview]     = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Fetch datos completos ───────────────────────────────────────────── */
  const fetchFull = useCallback(() => {
    setLoadingFull(true);
    fetch("/api/barbershop")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ barbershop }) => {
        if (!barbershop) return;
        setFull(barbershop);

        // Poblar form de perfil
        setProfileName(barbershop.name ?? "");
        setProfileSlug(barbershop.slug ?? "");
        setProfileAddress(barbershop.address ?? "");
        setProfileCity(barbershop.city ?? "");
        setProfilePhone(barbershop.phone ?? "");
        setProfileEmail(barbershop.email ?? "");
        setProfileLogoUrl(barbershop.logoUrl ?? "");
        const s = barbershop.settings as Record<string, string> | null ?? {};
        setProfileDesc(s?.description ?? "");
        setProfileCoverColor(s?.coverColor ?? "#CA8A04");
        setProfileCoverImageUrl(s?.coverImageUrl ?? "");
        setProfileInstagram(s?.instagramUrl ?? "");

        // Cargar horarios desde settings.schedule (si existe)
        const savedSchedule = (barbershop.settings as Record<string, WeekSchedule>)?.schedule;
        if (savedSchedule) setSchedule(savedSchedule);

        // Cargar bloqueos desde settings.blocks (si existe)
        const savedBlocks = (barbershop.settings as Record<string, Block[]>)?.blocks;
        if (savedBlocks) setBlocks(savedBlocks);
      })
      .catch((err: Error) => {
        // En desarrollo, no usar console.error para evitar el overlay de Next.js
        // El componente queda con los valores por defecto (DEFAULT_SCHEDULE)
        if (process.env.NODE_ENV === "development") {
          console.warn("[configuracion] fetchFull:", err.message);
        }
      })
      .finally(() => setLoadingFull(false));
  }, []);

  useEffect(() => { fetchFull(); }, [fetchFull]);

  /* ── Helpers URL ─────────────────────────────────────────────────────── */
  const slug       = authBarbershop?.slug ?? profileSlug ?? "mi-barberia";
  const PUBLIC_URL = `${typeof window !== "undefined" ? window.location.origin : "https://Mibarberia.app"}/book/${slug}`;

  /* ── Horarios ────────────────────────────────────────────────────────── */
  function updateDay(day: string, field: keyof DaySchedule, value: string | boolean) {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  async function saveSchedule() {
    setSavingSch(true);
    try {
      await fetch("/api/barbershop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...(full?.settings ?? {}),
            schedule,
            blocks,
          },
        }),
      });
      setSavedSch(true);
      setTimeout(() => setSavedSch(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSch(false);
    }
  }

  /* ── Bloqueos ────────────────────────────────────────────────────────── */
  function addBlock() {
    if (!newBlock.dateFrom) return;
    const dateTo = newBlock.dateTo || newBlock.dateFrom;
    const updated = [...blocks, { ...newBlock, dateTo, id: `b${Date.now()}` }];
    setBlocks(updated);
    setShowForm(false);
    setNewBlock({ reason: "Feriado", dateFrom: "", dateTo: "", timeFrom: "09:00", timeTo: "20:00", allDay: true });
    // Guardar automáticamente
    fetch("/api/barbershop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { ...(full?.settings ?? {}), schedule, blocks: updated } }),
    }).catch(console.error);
  }

  function deleteBlock(id: string) {
    const updated = blocks.filter((b) => b.id !== id);
    setBlocks(updated);
    fetch("/api/barbershop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { ...(full?.settings ?? {}), schedule, blocks: updated } }),
    }).catch(console.error);
  }

  function formatBlockDate(from: string, to: string) {
    const f = new Date(from + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
    if (!to || to === from) return f;
    const t = new Date(to + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
    return `${f} → ${t}`;
  }

  /* ── Copiar link ─────────────────────────────────────────────────────── */
  function copyLink() {
    navigator.clipboard.writeText(PUBLIC_URL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ── Guardar perfil ──────────────────────────────────────────────────── */
  async function saveProfile() {
    if (!profileName.trim()) { setProfileError("El nombre es obligatorio."); return; }
    if (!profileSlug.trim()) { setProfileError("El slug es obligatorio."); return; }
    setProfileError("");
    setSavingProfile(true);
    try {
      const res = await fetch("/api/barbershop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    profileName.trim(),
          slug:    profileSlug.trim().toLowerCase(),
          logoUrl: profileLogoUrl.trim() || null,
          address: profileAddress.trim() || null,
          city:    profileCity.trim() || null,
          phone:   profilePhone.trim() || null,
          email:   profileEmail.trim() || null,
          settings: {
            ...(full?.settings ?? {}),
            schedule,
            blocks,
            description:   profileDesc.trim() || null,
            coverColor:    profileCoverColor || "#CA8A04",
            coverImageUrl: profileCoverImageUrl.trim() || null,
            instagramUrl:  profileInstagram.trim() || null,
          },
        }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        setProfileError(error ?? "Error al guardar.");
        return;
      }
      await refreshBarbershop();
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 2500);
    } catch (e) {
      console.error(e);
      setProfileError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSavingProfile(false);
    }
  }

  /* ── Upload de logo ─────────────────────────────────────────────────── */
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview local inmediato
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/logo", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json();
        setProfileError(error ?? "Error al subir imagen");
        setLogoPreview("");
        return;
      }
      const { url } = await res.json();
      setProfileLogoUrl(url);
    } catch {
      setProfileError("Error de conexión al subir imagen.");
      setLogoPreview("");
    } finally {
      setUploadingLogo(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  /* ── Upload de foto de portada ──────────────────────────────────────── */
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json();
        setProfileError(error ?? "Error al subir portada");
        setCoverPreview(""); return;
      }
      const { url } = await res.json();
      setProfileCoverImageUrl(url);
    } catch {
      setProfileError("Error de conexión al subir portada.");
      setCoverPreview("");
    } finally {
      setUploadingCover(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  const activeDays = Object.values(schedule).filter((d) => d.enabled).length;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div
        className="flex rounded-xl p-0.5 gap-0.5 overflow-x-auto"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold font-body transition-all whitespace-nowrap"
            style={
              activeTab === tab
                ? { backgroundColor: "#CA8A04", color: "#000" }
                : { color: "#52525B" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: HORARIOS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "Horarios" && (
        <div className="flex flex-col gap-4">
          {/* Info */}
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.15)" }}
          >
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#CA8A04" }} />
            <div>
              <p className="text-sm font-semibold text-white font-body">Tus horarios de atención</p>
              <p className="text-xs font-body mt-0.5" style={{ color: "#71717A" }}>
                Estos horarios definen cuándo los clientes pueden agendar contigo. Actualmente tienes{" "}
                <strong style={{ color: "#CA8A04" }}>{activeDays} días</strong> habilitados.
              </p>
            </div>
          </div>

          {/* Loading skeleton */}
          {loadingFull ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            /* Grilla de días */
            <div className="flex flex-col gap-2">
              {DAYS.map(({ key, label }) => {
                const day = schedule[key];
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-xl transition-all",
                      day.enabled
                        ? "border border-white/[0.07]"
                        : "border border-white/[0.04] opacity-50"
                    )}
                    style={{ backgroundColor: "#111111" }}
                  >
                    {/* Fila principal */}
                    <div className="flex items-center gap-3 p-3 flex-wrap">
                      {/* Toggle */}
                      <button
                        onClick={() => updateDay(key, "enabled", !day.enabled)}
                        className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors"
                        style={{ backgroundColor: day.enabled ? "#CA8A04" : "#1A1A1A" }}
                      >
                        <div
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                          style={{ transform: day.enabled ? "translateX(17px)" : "translateX(2px)" }}
                        />
                      </button>

                      {/* Día */}
                      <span className="text-sm font-semibold font-body text-white w-20 flex-shrink-0">{label}</span>

                      {day.enabled ? (
                        <>
                          {/* Desde → Hasta */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-body" style={{ color: "#52525B" }}>De</span>
                            <input
                              type="time"
                              value={day.from}
                              onChange={(e) => updateDay(key, "from", e.target.value)}
                              className="px-2 py-1.5 rounded-lg text-xs font-body text-white outline-none"
                              style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                            />
                            <span className="text-xs font-body" style={{ color: "#52525B" }}>a</span>
                            <input
                              type="time"
                              value={day.to}
                              onChange={(e) => updateDay(key, "to", e.target.value)}
                              className="px-2 py-1.5 rounded-lg text-xs font-body text-white outline-none"
                              style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}
                            />
                          </div>

                          {/* Toggle pausa */}
                          <button
                            onClick={() => updateDay(key, "hasBreak", !day.hasBreak)}
                            className="ml-auto text-xs font-body font-medium px-2.5 py-1 rounded-lg transition-all flex-shrink-0"
                            style={
                              day.hasBreak
                                ? { backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }
                                : { color: "#3F3F46", border: "1px solid rgba(255,255,255,0.06)" }
                            }
                          >
                            {day.hasBreak ? "Con pausa" : "+ Pausa"}
                          </button>
                        </>
                      ) : (
                        <span className="text-sm font-body" style={{ color: "#3F3F46" }}>Cerrado</span>
                      )}
                    </div>

                    {/* Fila de pausa */}
                    {day.enabled && day.hasBreak && (
                      <div
                        className="flex items-center gap-1.5 px-3 pb-3 flex-wrap"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <div className="w-9 flex-shrink-0 hidden sm:block" />
                        <span className="text-xs font-body flex-shrink-0 pt-2" style={{ color: "#3F3F46" }}>Pausa:</span>
                        <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                          <span className="text-xs font-body" style={{ color: "#3F3F46" }}>De</span>
                          <input
                            type="time"
                            value={day.breakFrom}
                            onChange={(e) => updateDay(key, "breakFrom", e.target.value)}
                            className="px-2 py-1 rounded-lg text-xs font-body text-white outline-none"
                            style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)", colorScheme: "dark" }}
                          />
                          <span className="text-xs font-body" style={{ color: "#3F3F46" }}>a</span>
                          <input
                            type="time"
                            value={day.breakTo}
                            onChange={(e) => updateDay(key, "breakTo", e.target.value)}
                            className="px-2 py-1 rounded-lg text-xs font-body text-white outline-none"
                            style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)", colorScheme: "dark" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={saveSchedule}
            disabled={savingSch || loadingFull}
            className="self-start flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#CA8A04" }}
          >
            {savedSch
              ? <><CheckCircle2 className="w-4 h-4" /> Guardado</>
              : savingSch
              ? "Guardando..."
              : <><Check className="w-4 h-4" /> Guardar horarios</>}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: BLOQUEOS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "Bloqueos" && (
        <div className="flex flex-col gap-4">

          {/* Info */}
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
            <div>
              <p className="text-sm font-semibold text-white font-body">Bloquear horarios</p>
              <p className="text-xs font-body mt-0.5" style={{ color: "#71717A" }}>
                Los días y rangos bloqueados no aparecerán disponibles cuando los clientes intenten agendar. Útil para feriados, vacaciones o mantenimiento.
              </p>
            </div>
          </div>

          {/* Lista de bloqueos */}
          {blocks.length > 0 && (
            <div className="flex flex-col gap-2">
              {blocks.map((b) => (
                <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: "#111111", border: "1px solid rgba(239,68,68,0.12)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(239,68,68,0.08)" }}>
                    <Ban className="w-4 h-4" style={{ color: "#EF4444" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white font-body">{b.reason}</p>
                    <p className="text-xs font-body mt-0.5" style={{ color: "#71717A" }}>
                      {formatBlockDate(b.dateFrom, b.dateTo)}
                    </p>
                    {!b.allDay && (
                      <p className="text-xs font-body" style={{ color: "#52525B" }}>
                        {b.timeFrom} – {b.timeTo}
                      </p>
                    )}
                    {b.allDay && (
                      <span className="text-[10px] font-body px-1.5 py-0.5 rounded font-semibold mt-0.5 inline-block"
                        style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
                        Todo el día
                      </span>
                    )}
                  </div>
                  <button onClick={() => deleteBlock(b.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10 flex-shrink-0"
                    style={{ color: "#3F3F46", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {blocks.length === 0 && !showForm && (
            <div className="py-10 flex flex-col items-center gap-2 text-center"
              style={{ border: "2px dashed rgba(255,255,255,0.06)", borderRadius: "16px" }}>
              <Ban className="w-8 h-8" style={{ color: "#27272A" }} />
              <p className="text-sm font-body" style={{ color: "#3F3F46" }}>Sin bloqueos activos</p>
            </div>
          )}

          {/* Formulario nuevo bloqueo */}
          {showForm && (
            <div className="flex flex-col gap-4 p-5 rounded-2xl"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-sm font-semibold text-white font-body">Nuevo bloqueo</p>

              {/* Motivo */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                  Motivo
                </label>
                <div className="flex flex-wrap gap-2">
                  {BLOCK_REASONS.map((r) => (
                    <button key={r} onClick={() => setNewBlock((b) => ({ ...b, reason: r }))}
                      className="px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-all"
                      style={
                        newBlock.reason === r
                          ? { backgroundColor: "#CA8A04", color: "#000" }
                          : { backgroundColor: "#1A1A1A", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }
                      }>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                    Desde
                  </label>
                  <input type="date" value={newBlock.dateFrom}
                    onChange={(e) => setNewBlock((b) => ({ ...b, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm font-body text-white outline-none"
                    style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                    Hasta <span style={{ color: "#3F3F46" }}>(opcional)</span>
                  </label>
                  <input type="date" value={newBlock.dateTo}
                    onChange={(e) => setNewBlock((b) => ({ ...b, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm font-body text-white outline-none"
                    style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }} />
                </div>
              </div>

              {/* Todo el día vs rango horario */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNewBlock((b) => ({ ...b, allDay: !b.allDay }))}
                  className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors"
                  style={{ backgroundColor: newBlock.allDay ? "#CA8A04" : "#1A1A1A" }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                    style={{ transform: newBlock.allDay ? "translateX(17px)" : "translateX(2px)" }} />
                </button>
                <span className="text-sm font-body text-white">Todo el día</span>
              </div>

              {!newBlock.allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>Desde</label>
                    <input type="time" value={newBlock.timeFrom}
                      onChange={(e) => setNewBlock((b) => ({ ...b, timeFrom: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm font-body text-white outline-none"
                      style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>Hasta</label>
                    <input type="time" value={newBlock.timeTo}
                      onChange={(e) => setNewBlock((b) => ({ ...b, timeTo: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm font-body text-white outline-none"
                      style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }} />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>
                  Cancelar
                </button>
                <button onClick={addBlock} disabled={!newBlock.dateFrom}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90 disabled:opacity-30"
                  style={{ backgroundColor: "#CA8A04" }}>
                  Agregar bloqueo
                </button>
              </div>
            </div>
          )}

          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-body transition-all hover:opacity-80"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Plus className="w-4 h-4" />
              Agregar bloqueo
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: ENLACE PÚBLICO
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "Enlace público" && (
        <div className="flex flex-col gap-5">

          {/* Hero del enlace */}
          <div
            className="p-6 rounded-2xl flex flex-col gap-4"
            style={{ background: "linear-gradient(145deg,#1A1400,#111111)", border: "1px solid rgba(202,138,4,0.25)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(202,138,4,0.12)" }}>
                <Globe className="w-5 h-5" style={{ color: "#CA8A04" }} />
              </div>
              <div>
                <p className="text-base font-semibold text-white font-body">Tu página de reservas</p>
                <p className="text-xs font-body" style={{ color: "#71717A" }}>Comparte este enlace con tus clientes para que agenden en línea</p>
              </div>
            </div>

            {/* URL display */}
            <div
              className="flex items-center gap-2 p-3 rounded-xl min-w-0"
              style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {loadingFull
                ? <Skeleton className="flex-1 h-4" />
                : <span className="flex-1 text-xs font-mono truncate min-w-0" style={{ color: "#A1A1AA" }}>{PUBLIC_URL}</span>
              }
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-body transition-all flex-shrink-0"
                style={
                  copied
                    ? { backgroundColor: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }
                    : { backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }
                }
              >
                {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
              </button>
            </div>

            {/* Ver página */}
            <Link
              href={`/book/${slug}`}
              target="_blank"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold font-body text-black transition-all hover:opacity-90"
              style={{ backgroundColor: "#CA8A04" }}
            >
              <ExternalLink className="w-4 h-4" />
              Ver mi página de reservas
            </Link>
          </div>

          {/* Qué ve el cliente */}
          <div
            className="p-5 rounded-2xl flex flex-col gap-4"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm font-semibold text-white font-body">¿Qué ve el cliente al entrar?</p>
            <div className="flex flex-col gap-3">
              {[
                { step: "1", title: "Elige el servicio",         desc: "Ve tu lista de servicios con precio y duración" },
                { step: "2", title: "Elige al barbero",          desc: "Ve los Mibarberia disponibles y sus especialidades" },
                { step: "3", title: "Elige fecha y hora",        desc: "Selecciona un horario libre según tu disponibilidad" },
                { step: "4", title: "Ingresa sus datos",         desc: "Nombre y teléfono para enviarte la confirmación" },
                { step: "5", title: "Confirmación automática",   desc: "Recibe un WhatsApp de confirmación al instante" },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-body flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(202,138,4,0.15)", color: "#CA8A04" }}
                  >
                    {s.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white font-body">{s.title}</p>
                    <p className="text-xs font-body" style={{ color: "#52525B" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cómo compartir */}
          <div
            className="p-5 rounded-2xl flex flex-col gap-3"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-sm font-semibold text-white font-body">¿Cómo lo comparto?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "💬", label: "WhatsApp", desc: "Pega el link en tu estado o en la bio" },
                { icon: "📸", label: "Instagram", desc: "Ponlo en la bio o en stories como swipe-up" },
                { icon: "🔗", label: "Google Maps", desc: "Agrérgalo al perfil de tu negocio en Maps" },
              ].map((c) => (
                <div key={c.label} className="p-3 rounded-xl text-center" style={{ backgroundColor: "#0D0D0D" }}>
                  <span className="text-2xl">{c.icon}</span>
                  <p className="text-sm font-semibold text-white font-body mt-1">{c.label}</p>
                  <p className="text-xs font-body mt-0.5" style={{ color: "#52525B" }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: PERFIL DE BARBERÍA
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "Perfil de barbería" && (
        <div className="flex flex-col gap-4">

          {loadingFull ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-32 mb-2" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* ── Preview cover ────────────────────────────────────── */}
              <div className="rounded-2xl relative"
                style={{ border: "1px solid rgba(255,255,255,0.06)", paddingBottom: "16px" }}>
                {/* Portada */}
                <div className="h-20 w-full rounded-t-2xl overflow-hidden"
                  style={
                    (coverPreview || profileCoverImageUrl)
                      ? { backgroundImage: `url(${coverPreview || profileCoverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: `linear-gradient(135deg, #0A0A0A 0%, ${profileCoverColor}55 100%)` }
                  } />
                {/* Avatar overlapping cover */}
                <div className="absolute left-5" style={{ top: "44px" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                    style={{
                      backgroundColor: (logoPreview || profileLogoUrl) ? "transparent" : profileCoverColor + "22",
                      color: profileCoverColor,
                      border: `3px solid #111111`,
                      overflow: "hidden",
                      boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                    }}>
                    {(logoPreview || profileLogoUrl)
                      ? <img src={logoPreview || profileLogoUrl} alt="logo" className="w-full h-full object-cover" />
                      : (profileName || "B")[0].toUpperCase()
                    }
                  </div>
                </div>
                {/* Info */}
                <div className="pl-[88px] pr-5 pt-3">
                  <p className="text-sm font-bold text-white font-body">{profileName || "Nombre barbería"}</p>
                  <p className="text-xs font-body" style={{ color: "#52525B" }}>{profileAddress || "Dirección"}</p>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                  Nombre de la barbería
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Ej: Barbería El Clásico"
                  className="input-dark"
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                  Dirección
                </label>
                <input
                  type="text"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="Ej: Av. Providencia 1234"
                  className="input-dark"
                />
              </div>

              {/* Ciudad */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                  Ciudad
                </label>
                <input
                  type="text"
                  value={profileCity}
                  onChange={(e) => setProfileCity(e.target.value)}
                  placeholder="Ej: Santiago"
                  className="input-dark"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                  Teléfono de contacto
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+56 9 XXXX XXXX"
                  className="input-dark"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                  Email de la barbería
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="contacto@mibarberia.com"
                  className="input-dark"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                  Slug (URL pública)
                </label>
                <input
                  type="text"
                  value={profileSlug}
                  onChange={(e) => setProfileSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="mi-barberia"
                  className="input-dark"
                />
                <p className="text-xs font-body mt-1" style={{ color: "#3F3F46" }}>
                  Tu URL quedará: Mibarberia.app/book/<span style={{ color: "#CA8A04" }}>{profileSlug || "tu-slug"}</span>
                </p>
              </div>

              {/* Logo */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-2" style={{ color: "#52525B" }}>
                  <div className="flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Logo de la barbería</div>
                </label>
                {/* Botón subir desde galería */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}>
                    {uploadingLogo
                      ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#CA8A04", borderTopColor: "transparent" }} /> Subiendo...</>
                      : <><Upload className="w-4 h-4" /> Subir desde galería</>
                    }
                  </button>
                  {(profileLogoUrl || logoPreview) && (
                    <button
                      type="button"
                      onClick={() => { setProfileLogoUrl(""); setLogoPreview(""); }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-red-500/10"
                      style={{ border: "1px solid rgba(255,255,255,0.06)", color: "#52525B" }}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs font-body mt-2" style={{ color: "#3F3F46" }}>
                  JPG, PNG o WebP · máx. 2 MB
                </p>
                {/* También acepta URL manual */}
                <div className="mt-2">
                  <input
                    type="url"
                    value={profileLogoUrl}
                    onChange={(e) => { setProfileLogoUrl(e.target.value); setLogoPreview(""); }}
                    placeholder="O pegá una URL de imagen..."
                    className="input-dark text-xs"
                    style={{ fontSize: "12px" }}
                  />
                </div>
              </div>

              {/* Foto de portada (banner) */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                  <div className="flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Foto de portada (banner)</div>
                </label>
                <p className="text-xs font-body mb-2" style={{ color: "#3F3F46" }}>
                  Aparece como fondo en la parte superior de tu página pública. Si no subís foto, se usa el color de portada.
                </p>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}>
                    {uploadingCover
                      ? <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#CA8A04", borderTopColor: "transparent" }} /> Subiendo...</>
                      : <><Upload className="w-4 h-4" /> Subir foto de portada</>
                    }
                  </button>
                  {(profileCoverImageUrl || coverPreview) && (
                    <button
                      type="button"
                      onClick={() => { setProfileCoverImageUrl(""); setCoverPreview(""); }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-red-500/10"
                      style={{ border: "1px solid rgba(255,255,255,0.06)", color: "#52525B" }}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs font-body mt-1.5" style={{ color: "#3F3F46" }}>JPG, PNG o WebP · máx. 5 MB · recomendado 1200×400 px</p>
              </div>

              {/* Color de portada */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-2" style={{ color: "#52525B" }}>
                  Color de portada <span style={{ color: "#3F3F46", fontWeight: 400, textTransform: "none" }}>(se usa si no hay foto)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { color: "#CA8A04", label: "Dorado" },
                    { color: "#DC2626", label: "Rojo" },
                    { color: "#2563EB", label: "Azul" },
                    { color: "#16A34A", label: "Verde" },
                    { color: "#7C3AED", label: "Violeta" },
                    { color: "#0F766E", label: "Teal" },
                    { color: "#EA580C", label: "Naranja" },
                    { color: "#BE185D", label: "Rosa" },
                  ].map(({ color, label }) => (
                    <button key={color} onClick={() => setProfileCoverColor(color)}
                      title={label}
                      className="w-9 h-9 rounded-xl transition-all flex items-center justify-center"
                      style={{
                        backgroundColor: color + "30",
                        border: profileCoverColor === color ? `2.5px solid ${color}` : `1.5px solid ${color}44`,
                        transform: profileCoverColor === color ? "scale(1.1)" : "scale(1)",
                      }}>
                      <div className="w-5 h-5 rounded-lg" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                  {/* Custom color */}
                  <label className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all"
                    title="Color personalizado"
                    style={{ border: "1.5px dashed rgba(255,255,255,0.15)" }}>
                    <input type="color" value={profileCoverColor}
                      onChange={(e) => setProfileCoverColor(e.target.value)}
                      className="opacity-0 absolute w-0 h-0" />
                    <span className="text-xs" style={{ color: "#52525B" }}>+</span>
                  </label>
                </div>
              </div>

              {/* Instagram */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                  <div className="flex items-center gap-1.5"><Instagram className="w-3 h-3" /> Instagram</div>
                </label>
                <input
                  type="url"
                  value={profileInstagram}
                  onChange={(e) => setProfileInstagram(e.target.value)}
                  placeholder="https://instagram.com/tu.barberia"
                  className="input-dark"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                  Descripción breve
                </label>
                <textarea
                  value={profileDesc}
                  onChange={(e) => setProfileDesc(e.target.value)}
                  placeholder="Barbería premium en el centro"
                  rows={3}
                  className="input-dark resize-none"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                />
              </div>

              {/* Error */}
              {profileError && (
                <p className="text-sm font-body" style={{ color: "#EF4444" }}>{profileError}</p>
              )}

              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="self-start flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90 disabled:opacity-50 mt-2"
                style={{ backgroundColor: "#CA8A04" }}
              >
                {savedProfile
                  ? <><CheckCircle2 className="w-4 h-4" /> Guardado</>
                  : savingProfile
                  ? "Guardando..."
                  : <><Check className="w-4 h-4" /> Guardar perfil</>}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
