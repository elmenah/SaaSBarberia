"use client";

import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X,
  ArrowRightLeft, Check, Clock, User, Scissors, Lock, Ban,
} from "lucide-react";
import Link from "next/link";

const SLOT_H  = 40;
const START_H = 8;
const END_H   = 20;

const SLOTS = Array.from(
  { length: (END_H - START_H) * 2 },
  (_, i) => START_H + i * 0.5
);

const TIME_OPTIONS = Array.from({ length: (END_H - START_H) * 4 + 1 }, (_, i) => {
  const totalMin = START_H * 60 + i * 15;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { value: h + m / 60, label: `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}` };
});

const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const BARBERS_LIST = [
  { id: "nicolas", label: "Nicolás", color: "#14B8A6" },
  { id: "juan",    label: "Juan",    color: "#F59E0B" },
  { id: "pedro",   label: "Pedro",   color: "#3B82F6" },
  { id: "carlos",  label: "Carlos",  color: "#8B5CF6" },
];

const BS: Record<string, { bg: string; border: string; text: string }> = {
  nicolas: { bg: "rgba(20,184,166,0.13)",  border: "rgba(20,184,166,0.4)",  text: "#14B8A6" },
  juan:    { bg: "rgba(245,158,11,0.13)",  border: "rgba(245,158,11,0.4)",  text: "#F59E0B" },
  pedro:   { bg: "rgba(59,130,246,0.13)",  border: "rgba(59,130,246,0.4)",  text: "#3B82F6" },
  carlos:  { bg: "rgba(139,92,246,0.13)",  border: "rgba(139,92,246,0.4)",  text: "#8B5CF6" },
};

type Appt = { id: string; day: number; hour: number; duration: number; client: string; service: string; barber: string; phone?: string };
type BlockSlot = { id: string; day: number; hourFrom: number; hourTo: number };

const INITIAL_APPTS: Appt[] = [
  { id:"a1",  day:1, hour:9,    duration:1,    client:"Lucas P.",     service:"Corte + Barba",   barber:"juan",    phone:"+56 9 1234 5678" },
  { id:"a2",  day:1, hour:11,   duration:0.5,  client:"Matías G.",    service:"Corte clásico",   barber:"pedro",   phone:"+56 9 8765 4321" },
  { id:"a3",  day:2, hour:10,   duration:1.5,  client:"Rodrigo S.",   service:"Degradé full",    barber:"juan",    phone:"+56 9 5555 9999" },
  { id:"a4",  day:3, hour:9,    duration:0.75, client:"Diego T.",     service:"Corte + Barba",   barber:"pedro",   phone:"+56 9 4444 8888" },
  { id:"a5",  day:3, hour:14,   duration:0.5,  client:"Agustín R.",   service:"Corte clásico",   barber:"juan",    phone:"+56 9 3333 7777" },
  { id:"a6",  day:4, hour:10.5, duration:0.75, client:"Fernando M.",  service:"Barba perfilada", barber:"pedro",   phone:"+56 9 2222 6666" },
  { id:"a7",  day:5, hour:11,   duration:2,    client:"Carlos R.",    service:"Peinado",         barber:"carlos",  phone:"+56 9 1111 5555" },
  { id:"a8",  day:2, hour:9.5,  duration:0.75, client:"Valentina S.", service:"Diseño de cejas", barber:"carlos",  phone:"+56 9 9999 0000" },
  { id:"a9",  day:1, hour:10,   duration:1,    client:"Franco B.",    service:"Corte clásico",   barber:"nicolas", phone:"+56 9 7777 1234" },
  { id:"a10", day:3, hour:11,   duration:0.5,  client:"Tomás V.",     service:"Degradé",         barber:"nicolas", phone:"+56 9 6666 5432" },
  { id:"a11", day:5, hour:9,    duration:1.5,  client:"Bruno M.",     service:"Corte + Barba",   barber:"nicolas", phone:"+56 9 5555 8765" },
];

function slotLabel(slot: number) {
  const h = Math.floor(slot);
  const m = slot % 1 !== 0 ? "30" : "00";
  return `${h.toString().padStart(2,"0")}:${m}`;
}
function isHalf(slot: number) { return slot % 1 !== 0; }
function addHours(slot: number, dur: number) {
  const totalMin = Math.round((slot + dur) * 60);
  return `${Math.floor(totalMin/60).toString().padStart(2,"0")}:${(totalMin%60).toString().padStart(2,"0")}`;
}
function hourToTime(h: number) {
  const totalMin = Math.round(h * 60);
  return `${Math.floor(totalMin/60).toString().padStart(2,"0")}:${(totalMin%60).toString().padStart(2,"0")}`;
}
function getDaysOfWeek(base: Date) {
  const diff = base.getDate() - base.getDay();
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(base); d.setDate(diff + i); return d; });
}

export default function DemoAgendaPage() {
  const [currentDate,  setCurrentDate]  = useState(new Date(2026, 4, 12));
  const [activeBarber, setActiveBarber] = useState("todos");
  const [appts,        setAppts]        = useState<Appt[]>(INITIAL_APPTS);
  const [blocks,       setBlocks]       = useState<BlockSlot[]>([]);
  const [selected,     setSelected]     = useState<Appt | null>(null);
  const [transferMode, setTransferMode] = useState(false);
  const [targetBarber, setTargetBarber] = useState<string | null>(null);
  const [transferred,  setTransferred]  = useState(false);
  const [blockModal,   setBlockModal]   = useState<{ day: number; dayDate: Date } | null>(null);
  const [blockFrom,    setBlockFrom]    = useState(8);
  const [blockTo,      setBlockTo]      = useState(8.5);

  const weekDays  = getDaysOfWeek(currentDate);
  const monthYear = currentDate.toLocaleDateString("es-419", { month: "long", year: "numeric" });
  const visible   = activeBarber === "todos" ? appts : appts.filter((a) => a.barber === activeBarber);

  function prevWeek() { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }
  function nextWeek() { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }

  function isBlockStart(day: number, slot: number) { return blocks.find((b) => b.day === day && b.hourFrom === slot) ?? null; }
  function isBlockCovered(day: number, slot: number) { return blocks.some((b) => b.day === day && b.hourFrom < slot && b.hourTo > slot); }
  function isCovered(day: number, hour: number) { return visible.some((a) => a.day === day && a.hour < hour && a.hour + a.duration > hour); }

  function openBlockModal(dayIdx: number, slot: number) {
    setBlockFrom(slot); setBlockTo(Math.min(slot + 0.5, END_H));
    setBlockModal({ day: dayIdx, dayDate: weekDays[dayIdx] });
  }
  function confirmBlock() {
    if (!blockModal || blockTo <= blockFrom) return;
    if (visible.some((a) => a.day === blockModal.day && a.hour < blockTo && a.hour + a.duration > blockFrom)) return;
    setBlocks((prev) => [...prev, { id: `bl${Date.now()}`, day: blockModal.day, hourFrom: blockFrom, hourTo: blockTo }]);
    setBlockModal(null);
  }
  function removeBlock(id: string) { setBlocks((prev) => prev.filter((b) => b.id !== id)); }

  function openDetail(appt: Appt) { setSelected(appt); setTransferMode(false); setTargetBarber(null); setTransferred(false); }
  function closeModal() { setSelected(null); setTransferMode(false); setTargetBarber(null); setTransferred(false); }
  function confirmTransfer() {
    if (!selected || !targetBarber) return;
    setAppts((prev) => prev.map((a) => a.id === selected.id ? { ...a, barber: targetBarber } : a));
    setSelected((prev) => prev ? { ...prev, barber: targetBarber } : null);
    setTransferred(true); setTransferMode(false);
    setTimeout(closeModal, 1400);
  }

  const selStyle      = selected ? BS[selected.barber] ?? BS.juan : null;
  const selBarberInfo = selected ? BARBERS_LIST.find((b) => b.id === selected.barber) : null;

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" style={{ color: "#52525B" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-medium text-white capitalize w-36 text-center">{monthYear}</h2>
          <button onClick={nextWeek} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" style={{ color: "#52525B" }}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentDate(new Date(2026, 4, 12))}
            className="text-xs px-3 py-1.5 rounded-lg font-body transition-colors hover:text-zinc-300"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)", color: "#52525B" }}>
            Hoy
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", color: "#71717A" }}>
            <Lock className="w-3 h-3" style={{ color: "#EF4444" }} />
            Click en celda vacía para bloquear
          </div>
          <Link href="/register">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body text-black hover:opacity-90 transition-all" style={{ backgroundColor: "#CA8A04" }}>
              <Plus className="w-4 h-4" />
              Nueva reserva
            </button>
          </Link>
        </div>
      </div>

      {/* Filtro barbero */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-body font-medium mr-1" style={{ color: "#3F3F46" }}>Ver agenda de:</span>
        {[{ id: "todos", label: "Todos" }, ...BARBERS_LIST].map((b) => (
          <button key={b.id} onClick={() => setActiveBarber(b.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-all"
            style={activeBarber === b.id
              ? { backgroundColor: "#CA8A04", color: "#000" }
              : { backgroundColor: "#111111", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }
            }>
            {b.label}
          </button>
        ))}
        {activeBarber === "todos" && (
          <div className="ml-auto flex items-center gap-3">
            {BARBERS_LIST.map(({ id, label }) => (
              <div key={id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: BS[id].text }} />
                <span className="text-xs font-body" style={{ color: "#52525B" }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grilla */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Cabecera días */}
        <div className="grid grid-cols-8 sticky top-0 z-10" style={{ backgroundColor: "#111111", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="p-3" />
          {weekDays.map((day, idx) => {
            const isToday = day.toDateString() === new Date(2026, 4, 12).toDateString();
            return (
              <div key={idx} className="p-3 text-center" style={{ backgroundColor: isToday ? "rgba(202,138,4,0.04)" : undefined }}>
                <p className="text-xs uppercase tracking-wider font-body" style={{ color: "#3F3F46" }}>{DAYS[day.getDay()]}</p>
                <p className="text-lg font-bold mt-0.5 font-body" style={{ color: isToday ? "#CA8A04" : "#A1A1AA" }}>{day.getDate()}</p>
              </div>
            );
          })}
        </div>

        {/* Filas de slots */}
        <div className="overflow-y-auto" style={{ maxHeight: "560px" }}>
          {SLOTS.map((slot) => (
            <div key={slot} className="grid grid-cols-8"
              style={{ minHeight: `${SLOT_H}px`, borderBottom: `1px solid rgba(255,255,255,${isHalf(slot) ? "0.02" : "0.04"})` }}>
              <div className="flex items-start justify-end pr-3 pt-1.5 flex-shrink-0">
                <span className="text-xs font-mono leading-none" style={{ color: isHalf(slot) ? "#27272A" : "#3F3F46" }}>{slotLabel(slot)}</span>
              </div>
              {weekDays.map((_, dayIdx) => {
                const appt         = visible.find((a) => a.day === dayIdx && a.hour === slot);
                const blockEntry   = isBlockStart(dayIdx, slot);
                const blockCovered = !blockEntry && isBlockCovered(dayIdx, slot);
                const covered      = !appt && !blockEntry && isCovered(dayIdx, slot);
                const s            = appt ? BS[appt.barber] ?? BS.juan : null;
                return (
                  <div key={dayIdx} className="relative border-l" style={{ borderColor: "rgba(255,255,255,0.03)", minHeight: `${SLOT_H}px` }}>
                    {appt && s && (
                      <button onClick={() => openDetail(appt)}
                        className="absolute inset-x-0.5 top-0.5 rounded-xl p-2 text-left transition-opacity hover:opacity-75 z-10"
                        style={{ height: `${appt.duration * 2 * SLOT_H - 4}px`, backgroundColor: s.bg, border: `1px solid ${s.border}` }}>
                        <p className="text-xs font-semibold font-body truncate leading-tight" style={{ color: s.text }}>{appt.client}</p>
                        {appt.duration >= 0.5 && <p className="text-[10px] font-body truncate opacity-70" style={{ color: s.text }}>{appt.service}</p>}
                        {appt.duration >= 1 && <p className="text-[10px] font-body truncate opacity-50" style={{ color: s.text }}>{slotLabel(appt.hour)} – {addHours(appt.hour, appt.duration)}</p>}
                      </button>
                    )}
                    {blockEntry && !appt && (
                      <div className="absolute inset-x-0.5 top-0.5 rounded-xl flex items-start justify-between px-2 pt-1.5 z-10"
                        style={{ height: `${(blockEntry.hourTo - blockEntry.hourFrom) * 2 * SLOT_H - 4}px`, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Lock className="w-3 h-3 flex-shrink-0" style={{ color: "#EF4444" }} />
                          <div className="min-w-0">
                            <p className="text-[10px] font-body font-semibold leading-tight" style={{ color: "#EF4444" }}>Bloqueado</p>
                            <p className="text-[10px] font-body leading-tight" style={{ color: "rgba(239,68,68,0.6)" }}>{hourToTime(blockEntry.hourFrom)} – {hourToTime(blockEntry.hourTo)}</p>
                          </div>
                        </div>
                        <button onClick={() => removeBlock(blockEntry.id)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/20 flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {!appt && !blockEntry && !blockCovered && !covered && (
                      <button onClick={() => openBlockModal(dayIdx, slot)} className="absolute inset-0 w-full h-full group" aria-label={`Bloquear ${slotLabel(slot)}`}>
                        <div className="absolute inset-x-0.5 top-0.5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ height: `${SLOT_H - 4}px`, backgroundColor: "rgba(239,68,68,0.04)", border: "1px dashed rgba(239,68,68,0.2)" }}>
                          <Lock className="w-3 h-3" style={{ color: "rgba(239,68,68,0.4)" }} />
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal bloquear */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={() => setBlockModal(null)} />
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: "#111111", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div className="h-1.5 w-full" style={{ backgroundColor: "#EF4444" }} />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Ban className="w-4 h-4" style={{ color: "#EF4444" }} />
                    <h2 className="text-base font-bold text-white font-body">Bloquear horario</h2>
                  </div>
                  <p className="text-xs font-body capitalize" style={{ color: "#71717A" }}>
                    {blockModal.dayDate.toLocaleDateString("es-419", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                </div>
                <button onClick={() => setBlockModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5" style={{ color: "#52525B" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Desde", val: blockFrom, onChange: (v: number) => { setBlockFrom(v); if (blockTo <= v) setBlockTo(Math.min(v + 0.25, END_H)); }, opts: TIME_OPTIONS.filter((o) => o.value < END_H) },
                  { label: "Hasta", val: blockTo, onChange: (v: number) => setBlockTo(v), opts: TIME_OPTIONS.filter((o) => o.value > blockFrom) },
                ].map(({ label, val, onChange, opts }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>{label}</label>
                    <select value={val} onChange={(e) => onChange(parseFloat(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-body text-white outline-none appearance-none"
                      style={{ backgroundColor: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", colorScheme: "dark" }}>
                      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "#EF4444" }} />
                  <span className="text-sm font-semibold text-white font-body">{hourToTime(blockFrom)} — {hourToTime(blockTo)}</span>
                </div>
                <span className="text-xs font-body" style={{ color: "#71717A" }}>{Math.round((blockTo - blockFrom) * 60)} min</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setBlockModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
                <button onClick={confirmBlock}
                  disabled={blockTo <= blockFrom || visible.some((a) => a.day === blockModal.day && a.hour < blockTo && a.hour + a.duration > blockFrom)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-white hover:opacity-90 disabled:opacity-30"
                  style={{ backgroundColor: "#EF4444" }}>
                  Bloquear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle turno */}
      {selected && selStyle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={closeModal} />
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="h-1.5 w-full" style={{ backgroundColor: selStyle.text }} />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-body">{selected.client}</h2>
                  <p className="text-xs font-body mt-0.5" style={{ color: "#71717A" }}>{slotLabel(selected.hour)} – {addHours(selected.hour, selected.duration)}</p>
                </div>
                <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5" style={{ color: "#52525B" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ backgroundColor: "#0D0D0D" }}>
                {[
                  { icon: Scissors, text: selected.service },
                  { icon: User,     text: selBarberInfo?.label ?? selected.barber },
                  { icon: Clock,    text: `${selected.duration * 60} min` },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: selStyle.text }} />
                    <span className="text-sm font-body text-white">{text}</span>
                  </div>
                ))}
                <div className="mt-1 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selStyle.text }} />
                    <span className="text-xs font-body font-semibold" style={{ color: selStyle.text }}>
                      {transferred ? "Turno transferido" : `Asignado a ${selBarberInfo?.label}`}
                    </span>
                    {transferred && <Check className="w-3.5 h-3.5 ml-1" style={{ color: "#22C55E" }} />}
                  </div>
                </div>
              </div>
              {transferMode && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-body font-semibold uppercase tracking-wider" style={{ color: "#52525B" }}>Transferir a:</p>
                  {BARBERS_LIST.filter((b) => b.id !== selected.barber).map((b) => {
                    const bsb = BS[b.id];
                    const isTarget = targetBarber === b.id;
                    return (
                      <button key={b.id} onClick={() => setTargetBarber(b.id)}
                        className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{ backgroundColor: isTarget ? bsb.bg : "#0D0D0D", border: isTarget ? `1.5px solid ${bsb.border}` : "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-body flex-shrink-0"
                          style={{ backgroundColor: b.color + "22", color: b.color }}>{b.label[0]}</div>
                        <span className="text-sm font-semibold font-body flex-1" style={{ color: isTarget ? bsb.text : "#A1A1AA" }}>{b.label}</span>
                        {isTarget && <Check className="w-4 h-4" style={{ color: bsb.text }} />}
                      </button>
                    );
                  })}
                  <div className="flex gap-3 mt-1">
                    <button onClick={() => { setTransferMode(false); setTargetBarber(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}>Cancelar</button>
                    <button onClick={confirmTransfer} disabled={!targetBarber} className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-black hover:opacity-90 disabled:opacity-30" style={{ backgroundColor: "#CA8A04" }}>Confirmar</button>
                  </div>
                </div>
              )}
              {!transferMode && !transferred && (
                <button onClick={() => setTransferMode(true)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold font-body hover:opacity-80 transition-all"
                  style={{ backgroundColor: "rgba(202,138,4,0.08)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}>
                  <ArrowRightLeft className="w-4 h-4" />
                  Transferir a otro barbero
                </button>
              )}
              {transferred && (
                <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold font-body"
                  style={{ backgroundColor: "rgba(34,197,94,0.08)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <Check className="w-4 h-4" /> Turno transferido con éxito
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
