"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Clock, Globe, CheckCircle2, Plus, Trash2, Ban } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type DaySchedule = { enabled: boolean; from: string; to: string; breakFrom: string; breakTo: string; hasBreak: boolean };
type WeekSchedule = Record<string, DaySchedule>;
type Block = { id: string; reason: string; dateFrom: string; dateTo: string; timeFrom: string; timeTo: string; allDay: boolean };

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

const INITIAL_BLOCKS: Block[] = [
  { id: "b1", reason: "Feriado nacional", dateFrom: "2026-05-25", dateTo: "2026-05-25", timeFrom: "09:00", timeTo: "20:00", allDay: true },
  { id: "b2", reason: "Vacaciones",       dateFrom: "2026-07-14", dateTo: "2026-07-21", timeFrom: "09:00", timeTo: "20:00", allDay: true },
];

const BLOCK_REASONS = ["Feriado", "Vacaciones", "Capacitación", "Mantenimiento", "Turno médico", "Otro"];
const TABS = ["Horarios", "Bloqueos", "Enlace público", "Perfil de barbería"] as const;
type Tab = typeof TABS[number];

const SLUG       = "el-clasico";
const PUBLIC_URL = `https://Mibarberia.app/book/${SLUG}`;

export default function DemoConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Horarios");
  const [schedule,  setSchedule]  = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [saved,     setSaved]     = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [blocks,    setBlocks]    = useState<Block[]>(INITIAL_BLOCKS);
  const [showForm,  setShowForm]  = useState(false);
  const [newBlock,  setNewBlock]  = useState<Omit<Block,"id">>({
    reason: "Feriado", dateFrom: "", dateTo: "", timeFrom: "09:00", timeTo: "20:00", allDay: true,
  });

  function updateDay(day: string, field: keyof DaySchedule, value: string | boolean) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }
  function saveSchedule() { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  function addBlock() {
    if (!newBlock.dateFrom) return;
    setBlocks((prev) => [...prev, { ...newBlock, dateTo: newBlock.dateTo || newBlock.dateFrom, id: `b${Date.now()}` }]);
    setShowForm(false);
    setNewBlock({ reason: "Feriado", dateFrom: "", dateTo: "", timeFrom: "09:00", timeTo: "20:00", allDay: true });
  }
  function deleteBlock(id: string) { setBlocks((prev) => prev.filter((b) => b.id !== id)); }
  function formatBlockDate(from: string, to: string) {
    const f = new Date(from + "T12:00:00").toLocaleDateString("es-419", { day: "numeric", month: "short", year: "numeric" });
    if (!to || to === from) return f;
    const t = new Date(to + "T12:00:00").toLocaleDateString("es-419", { day: "numeric", month: "short", year: "numeric" });
    return `${f} → ${t}`;
  }
  function copyLink() {
    navigator.clipboard.writeText(PUBLIC_URL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeDays = Object.values(schedule).filter((d) => d.enabled).length;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">

      {/* Tabs */}
      <div className="flex rounded-xl p-0.5 gap-0.5 overflow-x-auto"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold font-body transition-all whitespace-nowrap"
            style={activeTab === tab ? { backgroundColor: "#CA8A04", color: "#000" } : { color: "#52525B" }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── HORARIOS ──────────────────────────────────────────────────── */}
      {activeTab === "Horarios" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.15)" }}>
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#CA8A04" }} />
            <div>
              <p className="text-sm font-semibold text-white font-body">Tus horarios de atención</p>
              <p className="text-xs font-body mt-0.5" style={{ color: "#71717A" }}>
                Actualmente tienes <strong style={{ color: "#CA8A04" }}>{activeDays} días</strong> habilitados.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {DAYS.map(({ key, label }) => {
              const day = schedule[key];
              return (
                <div key={key} className={cn("rounded-xl transition-all", day.enabled ? "border border-white/[0.07]" : "border border-white/[0.04] opacity-50")}
                  style={{ backgroundColor: "#111111" }}>
                  <div className="flex items-center gap-3 p-3 flex-wrap">
                    <button onClick={() => updateDay(key, "enabled", !day.enabled)}
                      className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors"
                      style={{ backgroundColor: day.enabled ? "#CA8A04" : "#1A1A1A" }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                        style={{ transform: day.enabled ? "translateX(17px)" : "translateX(2px)" }} />
                    </button>
                    <span className="text-sm font-semibold font-body text-white w-20 flex-shrink-0">{label}</span>
                    {day.enabled ? (
                      <>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-body" style={{ color: "#52525B" }}>De</span>
                          <input type="time" value={day.from} onChange={(e) => updateDay(key, "from", e.target.value)}
                            className="px-2 py-1.5 rounded-lg text-xs font-body text-white outline-none"
                            style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }} />
                          <span className="text-xs font-body" style={{ color: "#52525B" }}>a</span>
                          <input type="time" value={day.to} onChange={(e) => updateDay(key, "to", e.target.value)}
                            className="px-2 py-1.5 rounded-lg text-xs font-body text-white outline-none"
                            style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }} />
                        </div>
                        <button onClick={() => updateDay(key, "hasBreak", !day.hasBreak)}
                          className="ml-auto text-xs font-body font-medium px-2.5 py-1 rounded-lg transition-all flex-shrink-0"
                          style={day.hasBreak
                            ? { backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }
                            : { color: "#3F3F46", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {day.hasBreak ? "Con pausa" : "+ Pausa"}
                        </button>
                      </>
                    ) : (
                      <span className="text-sm font-body" style={{ color: "#3F3F46" }}>Cerrado</span>
                    )}
                  </div>
                  {day.enabled && day.hasBreak && (
                    <div className="flex items-center gap-1.5 px-3 pb-3 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <div className="w-9 flex-shrink-0 hidden sm:block" />
                      <span className="text-xs font-body flex-shrink-0 pt-2" style={{ color: "#3F3F46" }}>Pausa:</span>
                      <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                        <span className="text-xs font-body" style={{ color: "#3F3F46" }}>De</span>
                        <input type="time" value={day.breakFrom} onChange={(e) => updateDay(key, "breakFrom", e.target.value)}
                          className="px-2 py-1 rounded-lg text-xs font-body text-white outline-none"
                          style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)", colorScheme: "dark" }} />
                        <span className="text-xs font-body" style={{ color: "#3F3F46" }}>a</span>
                        <input type="time" value={day.breakTo} onChange={(e) => updateDay(key, "breakTo", e.target.value)}
                          className="px-2 py-1 rounded-lg text-xs font-body text-white outline-none"
                          style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)", colorScheme: "dark" }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={saveSchedule}
            className="self-start flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90"
            style={{ backgroundColor: "#CA8A04" }}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Guardado</> : <><Check className="w-4 h-4" /> Guardar horarios</>}
          </button>
        </div>
      )}

      {/* ── BLOQUEOS ──────────────────────────────────────────────────── */}
      {activeTab === "Bloqueos" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
            <div>
              <p className="text-sm font-semibold text-white font-body">Bloquear horarios</p>
              <p className="text-xs font-body mt-0.5" style={{ color: "#71717A" }}>
                Los días bloqueados no aparecerán disponibles para que los clientes agenden.
              </p>
            </div>
          </div>
          {blocks.length > 0 && (
            <div className="flex flex-col gap-2">
              {blocks.map((b) => (
                <div key={b.id} className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: "#111111", border: "1px solid rgba(239,68,68,0.12)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(239,68,68,0.08)" }}>
                    <Ban className="w-4 h-4" style={{ color: "#EF4444" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white font-body">{b.reason}</p>
                    <p className="text-xs font-body mt-0.5" style={{ color: "#71717A" }}>{formatBlockDate(b.dateFrom, b.dateTo)}</p>
                    {b.allDay && (
                      <span className="text-[10px] font-body px-1.5 py-0.5 rounded font-semibold mt-0.5 inline-block"
                        style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444" }}>Todo el día</span>
                    )}
                  </div>
                  <button onClick={() => deleteBlock(b.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 flex-shrink-0"
                    style={{ color: "#3F3F46", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {showForm && (
            <div className="flex flex-col gap-4 p-5 rounded-2xl"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-sm font-semibold text-white font-body">Nuevo bloqueo</p>
              <div className="flex flex-wrap gap-2">
                {BLOCK_REASONS.map((r) => (
                  <button key={r} onClick={() => setNewBlock((b) => ({ ...b, reason: r }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-all"
                    style={newBlock.reason === r
                      ? { backgroundColor: "#CA8A04", color: "#000" }
                      : { backgroundColor: "#1A1A1A", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Desde", field: "dateFrom" as const },
                  { label: "Hasta", field: "dateTo" as const   },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>{label}</label>
                    <input type="date" value={newBlock[field]}
                      onChange={(e) => setNewBlock((b) => ({ ...b, [field]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm font-body text-white outline-none"
                      style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setNewBlock((b) => ({ ...b, allDay: !b.allDay }))}
                  className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors"
                  style={{ backgroundColor: newBlock.allDay ? "#CA8A04" : "#1A1A1A" }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                    style={{ transform: newBlock.allDay ? "translateX(17px)" : "translateX(2px)" }} />
                </button>
                <span className="text-sm font-body text-white">Todo el día</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
                <button onClick={addBlock} disabled={!newBlock.dateFrom}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-black hover:opacity-90 disabled:opacity-30"
                  style={{ backgroundColor: "#CA8A04" }}>Agregar bloqueo</button>
              </div>
            </div>
          )}
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold font-body hover:opacity-80"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Plus className="w-4 h-4" /> Agregar bloqueo
            </button>
          )}
        </div>
      )}

      {/* ── ENLACE PÚBLICO ────────────────────────────────────────────── */}
      {activeTab === "Enlace público" && (
        <div className="flex flex-col gap-5">
          <div className="p-6 rounded-2xl flex flex-col gap-4"
            style={{ background: "linear-gradient(145deg,#1A1400,#111111)", border: "1px solid rgba(202,138,4,0.25)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(202,138,4,0.12)" }}>
                <Globe className="w-5 h-5" style={{ color: "#CA8A04" }} />
              </div>
              <div>
                <p className="text-base font-semibold text-white font-body">Tu página de reservas</p>
                <p className="text-xs font-body" style={{ color: "#71717A" }}>Comparte este enlace con tus clientes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl min-w-0"
              style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="flex-1 text-xs font-mono truncate min-w-0" style={{ color: "#A1A1AA" }}>{PUBLIC_URL}</span>
              <button onClick={copyLink}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-body flex-shrink-0"
                style={copied
                  ? { backgroundColor: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }
                  : { backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}>
                {copied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
              </button>
            </div>
            <Link href={`/book/${SLUG}`} target="_blank"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold font-body text-black hover:opacity-90"
              style={{ backgroundColor: "#CA8A04" }}>
              <ExternalLink className="w-4 h-4" /> Ver mi página de reservas
            </Link>
          </div>
          <div className="p-5 rounded-2xl flex flex-col gap-4"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm font-semibold text-white font-body">¿Qué ve el cliente al entrar?</p>
            <div className="flex flex-col gap-3">
              {[
                { step: "1", title: "Elige el servicio",       desc: "Ve tu lista de servicios con precio y duración"      },
                { step: "2", title: "Elige al barbero",        desc: "Ve los Mibarberia disponibles y sus especialidades"    },
                { step: "3", title: "Elige fecha y hora",      desc: "Selecciona un horario libre según tu disponibilidad" },
                { step: "4", title: "Ingresa sus datos",       desc: "Nombre y teléfono para enviarte la confirmación"     },
                { step: "5", title: "Confirmación automática", desc: "Recibe un WhatsApp de confirmación al instante"      },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-body flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(202,138,4,0.15)", color: "#CA8A04" }}>{s.step}</div>
                  <div>
                    <p className="text-sm font-medium text-white font-body">{s.title}</p>
                    <p className="text-xs font-body" style={{ color: "#52525B" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PERFIL DE BARBERÍA ────────────────────────────────────────── */}
      {activeTab === "Perfil de barbería" && (
        <div className="flex flex-col gap-4">
          {[
            { label: "Nombre de la barbería", value: "Barbería El Clásico",    field: "name"    },
            { label: "Dirección",             value: "Av. Providencia 1234",   field: "address" },
            { label: "Teléfono de contacto",  value: "+56 9 1234 5678",        field: "phone"   },
            { label: "Slug (URL pública)",    value: "el-clasico",              field: "slug"    },
            { label: "Descripción breve",     value: "Barbería premium en el centro de Santiago", field: "desc" },
          ].map(({ label, value, field }) => (
            <div key={field}>
              <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>{label}</label>
              {field === "desc" ? (
                <textarea defaultValue={value} rows={3} className="input-dark resize-none" style={{ fontFamily: "Montserrat, sans-serif" }} />
              ) : (
                <input type="text" defaultValue={value} className="input-dark" />
              )}
              {field === "slug" && (
                <p className="text-xs font-body mt-1" style={{ color: "#3F3F46" }}>
                  Tu URL quedará: Mibarberia.app/book/<span style={{ color: "#CA8A04" }}>el-clasico</span>
                </p>
              )}
            </div>
          ))}
          <button className="self-start flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold font-body text-black hover:opacity-90 mt-2"
            style={{ backgroundColor: "#CA8A04" }}>
            <Check className="w-4 h-4" /> Guardar perfil
          </button>
        </div>
      )}
    </div>
  );
}
