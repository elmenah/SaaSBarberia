"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X,
  ArrowRightLeft, Check, Clock, User, Scissors, Lock, Ban,
} from "lucide-react";
import NextLink from "next/link";
import { useAuth } from "@/context/auth-context";
import { BarberStatsBar } from "@/components/dashboard/BarberStatsBar";

/* ── Constantes de grilla ────────────────────────────────────────────────── */
const SLOT_H  = 40;
const START_H = 8;
const END_H   = 20;

const MONTH_LABELS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

const SLOTS = Array.from(
  { length: (END_H - START_H) * 2 },
  (_, i) => START_H + i * 0.5
);

const TIME_OPTIONS = Array.from({ length: (END_H - START_H) * 4 + 1 }, (_, i) => {
  const totalMin = START_H * 60 + i * 15;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return {
    value: h + m / 60,
    label: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
  };
});

const WEEK_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/* ── Tipos ───────────────────────────────────────────────────────────────── */
type BarberRow = {
  id: string;
  label: string;
  color: string;   // hex directo del colorTag
};

type BarberStyle = { bg: string; border: string; text: string };

type Appt = {
  id: string;
  day: number;      // índice 0-6 dentro de weekDays (solo semana)
  dateStr: string;  // "YYYY-MM-DD" — usado en vista mensual
  hour: number;     // decimal (9.5 = 09:30)
  duration: number; // decimal en horas
  client: string;
  service: string;
  barber: string;   // barber.id de la DB
  phone?: string;
};

type BlockSlot = {
  id: string;
  day: number;
  hourFrom: number;
  hourTo: number;
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function slotLabel(slot: number) {
  const h = Math.floor(slot);
  const m = slot % 1 !== 0 ? "30" : "00";
  return `${h.toString().padStart(2, "0")}:${m}`;
}
function isHalf(slot: number) { return slot % 1 !== 0; }

function addHours(slot: number, dur: number) {
  const totalMin = Math.round((slot + dur) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function hourToTime(h: number) {
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
}

function getDaysOfWeek(base: Date) {
  const year  = base.getFullYear();
  const month = base.getMonth();
  const day   = base.getDate();
  const dow   = base.getDay(); // 0=Dom … 6=Sáb
  // Semana Lun→Dom: si hoy es Dom (0) retroceder 6, sino retroceder dow-1
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  const start = day - daysFromMonday;
  return Array.from({ length: 7 }, (_, i) =>
    new Date(year, month, start + i, 12, 0, 0)
  );
}

/** Genera la grilla del mes: 6 semanas × 7 días empezando en Lunes */
function getDaysOfMonth(base: Date): Date[] {
  const y = base.getFullYear();
  const m = base.getMonth();
  const firstDay  = new Date(y, m, 1);
  const dow       = firstDay.getDay(); // 0=Dom
  // Cuántos días antes del 1 hay que mostrar para alinear al Lunes
  const startOffset = dow === 0 ? 6 : dow - 1;
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(y, m, 1 - startOffset + i, 12, 0, 0));
  }
  return cells;
}

/** Convierte un hex (#RRGGBB) al estilo de tarjeta de barbero */
function hexToStyle(hex: string): BarberStyle {
  return {
    bg:     hex + "22",  // 13% opacidad
    border: hex + "66",  // 40% opacidad
    text:   hex,
  };
}

function toISODate(d: Date) {
  // Usar componentes locales (no UTC) para que la fecha no se desplace
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ backgroundColor: "var(--ds-skeleton)" }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function AgendaPage() {
  const { barbershop, loading: authLoading, isBarber } = useAuth();

  const [currentDate,  setCurrentDate]  = useState(() => new Date());
  const [viewMode,     setViewMode]     = useState<"week" | "month">("week");
  const [activeBarber, setActiveBarber] = useState("todos");
  const [appts,        setAppts]        = useState<Appt[]>([]);
  const [barbers,      setBarbers]      = useState<BarberRow[]>([]);
  const [blocks,       setBlocks]       = useState<BlockSlot[]>([]);
  const [loading,      setLoading]      = useState(true);

  // Modal detalle / transferencia
  const [selected,     setSelected]     = useState<Appt | null>(null);
  const [transferMode, setTransferMode] = useState(false);
  const [targetBarber, setTargetBarber] = useState<string | null>(null);
  const [transferred,  setTransferred]  = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  // Modal de bloqueo
  const [blockModal, setBlockModal] = useState<{ day: number; dayDate: Date } | null>(null);
  const [blockFrom,  setBlockFrom]  = useState(8);
  const [blockTo,    setBlockTo]    = useState(8.5);

  const weekDays  = getDaysOfWeek(currentDate);
  const monthYear = currentDate.toLocaleDateString("es-419", { month: "long", year: "numeric" });

  /* ── Mibarberia ────────────────────────────────────────────────────────── */
  const fetchBarbers = useCallback(() => {
    if (!barbershop?.id) { setLoading(false); return; }
    fetch("/api/barbers")
      .then((r) => r.json())
      .then(({ data }) => {
        const rows: BarberRow[] = (data ?? [])
          .filter((b: { isActive: boolean }) => b.isActive)
          .map((b: { id: string; user: { name: string }; colorTag: string | null }) => ({
            id:    b.id,
            label: b.user.name,
            color: b.colorTag ?? "#CA8A04",
          }));
        setBarbers(rows);
      })
      .catch(console.error);
  }, [barbershop?.id]);

  /* ── Appointments (semana o mes) ────────────────────────────────────── */
  const fetchAppts = useCallback(() => {
    if (!barbershop?.id) { setLoading(false); return; }

    let dateFrom: string, dateTo: string;
    let refDays: Date[] = [];

    if (viewMode === "week") {
      refDays   = getDaysOfWeek(currentDate);
      dateFrom  = toISODate(refDays[0]);
      const lastDay = new Date(refDays[6]);
      lastDay.setDate(lastDay.getDate() + 1);
      dateTo = toISODate(lastDay);
    } else {
      // Mes completo (+ 1 día extra para cubrir overflow UTC)
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth();
      dateFrom = toISODate(new Date(y, m, 1));
      dateTo   = toISODate(new Date(y, m + 1, 1));
    }

    setLoading(true);
    fetch(`/api/appointments?barbershopId=${barbershop.id}&dateFrom=${dateFrom}&dateTo=${dateTo}&pageSize=500`)
      .then((r) => r.json())
      .then(({ data }) => {
        const rows: Appt[] = (data ?? []).flatMap((a: {
          id: string;
          startsAt: string;
          totalDuration: number;
          client: { name: string; phone: string };
          barber: { id: string };
          services: { service: { name: string } }[];
        }) => {
          const dt      = new Date(a.startsAt);
          const dStr    = toISODate(dt);
          const hour    = dt.getHours() + dt.getMinutes() / 60;
          const dur     = a.totalDuration / 60;
          const svcName = a.services[0]?.service.name ?? "Servicio";

          // dayIdx solo importa en vista semana
          const dayIdx = viewMode === "week"
            ? refDays.findIndex((d) => d.toDateString() === dt.toDateString())
            : 0;
          if (viewMode === "week" && dayIdx < 0) return [];

          return [{
            id:       a.id,
            day:      dayIdx,
            dateStr:  dStr,
            hour,
            duration: Math.max(dur, 0.5),
            client:   a.client.name,
            service:  svcName,
            barber:   a.barber.id,
            phone:    a.client.phone,
          }];
        });
        setAppts(rows);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [barbershop?.id, currentDate, viewMode]);

  useEffect(() => { if (!authLoading) fetchBarbers(); }, [fetchBarbers, authLoading]);
  useEffect(() => { if (!authLoading) fetchAppts();   }, [fetchAppts,   authLoading]);

  // Auto-scroll a la hora actual al cargar la vista semana
  useEffect(() => {
    if (viewMode !== "week" || loading || !gridRef.current) return;
    const now = new Date();
    const targetHour = Math.max(now.getHours() - 1, START_H);
    gridRef.current.scrollTop = (targetHour - START_H) * 2 * SLOT_H;
  }, [viewMode, loading]);

  /* ── Mapa de estilos por barbero (id → estilo) ───────────────────────── */
  const BS = useMemo<Record<string, BarberStyle>>(() => {
    const map: Record<string, BarberStyle> = {};
    barbers.forEach((b) => { map[b.id] = hexToStyle(b.color); });
    return map;
  }, [barbers]);

  const visible = activeBarber === "todos"
    ? appts
    : appts.filter((a) => a.barber === activeBarber);

  /* ── Navegación ─────────────────────────────────────────────────────── */
  function prevPeriod() {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  }
  function nextPeriod() {
    const d = new Date(currentDate);
    if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  }

  /* ── Bloqueo ────────────────────────────────────────────────────────── */
  function isBlockStart(day: number, slot: number) {
    return blocks.find((b) => b.day === day && b.hourFrom === slot) ?? null;
  }
  function isBlockCovered(day: number, slot: number) {
    return blocks.some((b) => b.day === day && b.hourFrom < slot && b.hourTo > slot);
  }
  function openBlockModal(dayIdx: number, slot: number) {
    setBlockFrom(slot);
    setBlockTo(Math.min(slot + 0.5, END_H));
    setBlockModal({ day: dayIdx, dayDate: weekDays[dayIdx] });
  }
  function confirmBlock() {
    if (!blockModal || blockTo <= blockFrom) return;
    const hasConflict = visible.some(
      (a) => a.day === blockModal.day && a.hour < blockTo && a.hour + a.duration > blockFrom
    );
    if (hasConflict) return;
    setBlocks((prev) => [
      ...prev,
      { id: `bl${Date.now()}`, day: blockModal.day, hourFrom: blockFrom, hourTo: blockTo },
    ]);
    setBlockModal(null);
  }
  function removeBlock(id: string) { setBlocks((prev) => prev.filter((b) => b.id !== id)); }

  /* ── Turno cubierto ─────────────────────────────────────────────────── */
  function isCovered(day: number, hour: number) {
    return visible.some((a) => a.day === day && a.hour < hour && a.hour + a.duration > hour);
  }

  /* ── Detalle turno ──────────────────────────────────────────────────── */
  function openDetail(appt: Appt) {
    setSelected(appt); setTransferMode(false); setTargetBarber(null); setTransferred(false);
  }
  function closeModal() {
    setSelected(null); setTransferMode(false); setTargetBarber(null); setTransferred(false);
  }
  function confirmTransfer() {
    if (!selected || !targetBarber) return;
    setAppts((prev) => prev.map((a) => a.id === selected.id ? { ...a, barber: targetBarber } : a));
    setSelected((prev) => prev ? { ...prev, barber: targetBarber } : null);
    setTransferred(true); setTransferMode(false);
    setTimeout(closeModal, 1400);
  }

  const selStyle      = selected ? (BS[selected.barber] ?? hexToStyle("#CA8A04")) : null;
  const selBarberInfo = selected ? barbers.find((b) => b.id === selected.barber) : null;
  const today         = new Date();

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-4">

      {/* Stats del barbero (solo visible para rol BARBER) */}
      {isBarber && <BarberStatsBar />}

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: "var(--ds-text-3)" }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-medium text-white capitalize w-36 text-center">{monthYear}</h2>
          <button onClick={nextPeriod}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ color: "var(--ds-text-3)" }}>
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentDate(new Date())}
            className="text-xs px-3 py-1.5 rounded-lg font-body transition-colors hover:text-zinc-300"
            style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", color: "var(--ds-text-3)" }}>
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Semana / Mes */}
          <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--ds-border-md)" }}>
            {(["week", "month"] as const).map((mode) => (
              <button key={mode}
                onClick={() => setViewMode(mode)}
                className="px-3 py-1.5 text-xs font-semibold font-body transition-all"
                style={viewMode === mode
                  ? { backgroundColor: "#CA8A04", color: "#000" }
                  : { backgroundColor: "var(--ds-surface)", color: "var(--ds-text-3)" }}>
                {mode === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>

          {viewMode === "week" && (
            <div className="hidden md:flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", color: "#71717A" }}>
              <Lock className="w-3 h-3" style={{ color: "#EF4444" }} />
              Click en celda vacía para bloquear
            </div>
          )}
          {!isBarber && (
            <NextLink href="/dashboard/reservas/nueva">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body text-black hover:opacity-90 transition-all"
                style={{ backgroundColor: "#CA8A04" }}>
                <Plus className="w-4 h-4" />
                Nueva reserva
              </button>
            </NextLink>
          )}
        </div>
      </div>

      {/* Filtro barbero */}
      {!loading && barbers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-body font-medium mr-1" style={{ color: "var(--ds-text-4)" }}>Ver agenda de:</span>
          {[{ id: "todos", label: "Todos", color: "#CA8A04" }, ...barbers].map((b) => (
            <button key={b.id} onClick={() => setActiveBarber(b.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold font-body transition-all"
              style={
                activeBarber === b.id
                  ? { backgroundColor: "#CA8A04", color: "#000" }
                  : { backgroundColor: "var(--ds-surface)", color: "var(--ds-text-3)", border: "1px solid var(--ds-border)" }
              }>
              {b.label}
            </button>
          ))}
          {activeBarber === "todos" && barbers.length > 0 && (
            <div className="ml-auto flex items-center gap-3">
              {barbers.map((b) => (
                <div key={b.id} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: b.color }} />
                  <span className="text-xs font-body" style={{ color: "var(--ds-text-3)" }}>{b.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VISTA MENSUAL
      ══════════════════════════════════════════════════════════════════ */}
      {viewMode === "month" && (() => {
        const monthCells   = getDaysOfMonth(currentDate);
        const curMonth     = currentDate.getMonth();
        const visibleAppts = activeBarber === "todos" ? appts : appts.filter(a => a.barber === activeBarber);
        const apptsByDate  = visibleAppts.reduce<Record<string, Appt[]>>((acc, a) => {
          acc[a.dateStr] = [...(acc[a.dateStr] ?? []), a];
          return acc;
        }, {});

        return (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>
            {/* Cabecera días */}
            <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--ds-border)" }}>
              {MONTH_LABELS.map((l) => (
                <div key={l} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider font-body" style={{ color: "var(--ds-text-4)" }}>
                  {l}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="p-6 grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => <div key={i} className="h-20 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }} />)}
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {monthCells.map((day, idx) => {
                  const dStr    = toISODate(day);
                  const isToday = day.toDateString() === today.toDateString();
                  const isThisMonth = day.getMonth() === curMonth;
                  const dayAppts = apptsByDate[dStr] ?? [];
                  const maxShow  = 3;
                  const extra    = dayAppts.length - maxShow;

                  return (
                    <div key={idx}
                      className="min-h-[96px] p-1.5 flex flex-col gap-1 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      style={{
                        borderRight:  (idx + 1) % 7 !== 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        borderBottom: idx < 35             ? "1px solid rgba(255,255,255,0.04)" : "none",
                        opacity:      isThisMonth ? 1 : 0.3,
                      }}
                      onClick={() => {
                        // Click en día → ir a semana
                        setCurrentDate(day);
                        setViewMode("week");
                      }}
                    >
                      {/* Número del día */}
                      <div className="flex justify-end">
                        <span
                          className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold font-body"
                          style={isToday
                            ? { backgroundColor: "#CA8A04", color: "#000" }
                            : { color: isThisMonth ? "#A1A1AA" : "#3F3F46" }
                          }>
                          {day.getDate()}
                        </span>
                      </div>

                      {/* Turnos del día */}
                      {dayAppts.slice(0, maxShow).map((a) => {
                        const bStyle = BS[a.barber] ?? hexToStyle("#CA8A04");
                        return (
                          <div key={a.id}
                            className="w-full px-1.5 py-0.5 rounded-md text-[10px] font-body font-medium truncate"
                            style={{ backgroundColor: bStyle.bg, color: bStyle.text, border: `1px solid ${bStyle.border}` }}
                            onClick={(e) => { e.stopPropagation(); openDetail(a); }}
                          >
                            {slotLabel(a.hour)} {a.client}
                          </div>
                        );
                      })}

                      {extra > 0 && (
                        <span className="text-[10px] font-body pl-0.5" style={{ color: "var(--ds-text-3)" }}>
                          +{extra} más
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {!loading && appts.length === 0 && (
              <p className="text-center py-8 text-sm font-body" style={{ color: "var(--ds-text-4)" }}>
                Sin turnos este mes
              </p>
            )}
          </div>
        );
      })()}

      {/* ── Grilla SEMANAL ────────────────────────────────────────────── */}
      {viewMode === "week" && <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)" }}>

        {/* Cabecera días */}
        <div className="grid grid-cols-8 sticky top-0 z-10"
          style={{ backgroundColor: "var(--ds-surface)", borderBottom: "1px solid var(--ds-border)" }}>
          <div className="p-3" />
          {weekDays.map((day, idx) => {
            const isToday = day.toDateString() === today.toDateString();
            return (
              <div key={idx} className="p-3 text-center"
                style={{ backgroundColor: isToday ? "rgba(202,138,4,0.04)" : undefined }}>
                <p className="text-xs uppercase tracking-wider font-body" style={{ color: "var(--ds-text-4)" }}>
                  {WEEK_LABELS[day.getDay() === 0 ? 6 : day.getDay() - 1]}
                </p>
                <p className="text-lg font-bold mt-0.5 font-body"
                  style={{ color: isToday ? "#CA8A04" : "#A1A1AA" }}>
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filas de slots */}
        <div ref={gridRef} className="overflow-y-auto" style={{ maxHeight: "560px" }}>
          {loading ? (
            /* Skeleton de la grilla */
            <div className="p-4 flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            SLOTS.map((slot) => (
              <div key={slot}
                className="grid grid-cols-8"
                style={{
                  minHeight: `${SLOT_H}px`,
                  borderBottom: `1px solid rgba(255,255,255,${isHalf(slot) ? "0.02" : "0.04"})`,
                }}
              >
                {/* Etiqueta de hora */}
                <div className="flex items-start justify-end pr-3 pt-1.5 flex-shrink-0">
                  <span className="text-xs font-mono leading-none"
                    style={{ color: isHalf(slot) ? "#27272A" : "#3F3F46" }}>
                    {slotLabel(slot)}
                  </span>
                </div>

                {/* Celdas por día */}
                {weekDays.map((_, dayIdx) => {
                  const appt         = visible.find((a) => a.day === dayIdx && a.hour === slot);
                  const blockEntry   = isBlockStart(dayIdx, slot);
                  const blockCovered = !blockEntry && isBlockCovered(dayIdx, slot);
                  const covered      = !appt && !blockEntry && isCovered(dayIdx, slot);
                  const s            = appt ? (BS[appt.barber] ?? hexToStyle("#CA8A04")) : null;

                  return (
                    <div key={dayIdx}
                      className="relative border-l"
                      style={{ borderColor: "rgba(255,255,255,0.03)", minHeight: `${SLOT_H}px` }}
                    >
                      {/* ── Turno ──────────────────────────────────── */}
                      {appt && s && (
                        <button
                          onClick={() => openDetail(appt)}
                          className="absolute inset-x-0.5 top-0.5 rounded-xl p-2 text-left transition-opacity hover:opacity-75 z-10"
                          style={{
                            height: `${appt.duration * 2 * SLOT_H - 4}px`,
                            backgroundColor: s.bg,
                            border: `1px solid ${s.border}`,
                          }}
                        >
                          <p className="text-xs font-semibold font-body truncate leading-tight" style={{ color: s.text }}>
                            {appt.client}
                          </p>
                          {appt.duration >= 0.5 && (
                            <p className="text-[10px] font-body truncate opacity-70" style={{ color: s.text }}>
                              {appt.service}
                            </p>
                          )}
                          {appt.duration >= 1 && (
                            <p className="text-[10px] font-body truncate opacity-50" style={{ color: s.text }}>
                              {slotLabel(appt.hour)} – {addHours(appt.hour, appt.duration)}
                            </p>
                          )}
                        </button>
                      )}

                      {/* ── Bloqueo (inicio del rango) ──────────────── */}
                      {blockEntry && !appt && (
                        <div
                          className="absolute inset-x-0.5 top-0.5 rounded-xl flex items-start justify-between px-2 pt-1.5 z-10"
                          style={{
                            height: `${(blockEntry.hourTo - blockEntry.hourFrom) * 2 * SLOT_H - 4}px`,
                            backgroundColor: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.25)",
                          }}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Lock className="w-3 h-3 flex-shrink-0" style={{ color: "#EF4444" }} />
                            <div className="min-w-0">
                              <p className="text-[10px] font-body font-semibold leading-tight" style={{ color: "#EF4444" }}>
                                Bloqueado
                              </p>
                              <p className="text-[10px] font-body leading-tight" style={{ color: "rgba(239,68,68,0.6)" }}>
                                {hourToTime(blockEntry.hourFrom)} – {hourToTime(blockEntry.hourTo)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeBlock(blockEntry.id)}
                            className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0 mt-0.5"
                            style={{ color: "#EF4444" }}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* ── Celda vacía clickeable ───────────────────── */}
                      {!appt && !blockEntry && !blockCovered && !covered && (
                        <button
                          onClick={() => openBlockModal(dayIdx, slot)}
                          className="absolute inset-0 w-full h-full group"
                          aria-label={`Bloquear ${slotLabel(slot)}`}
                        >
                          <div className="absolute inset-x-0.5 top-0.5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              height: `${SLOT_H - 4}px`,
                              backgroundColor: "rgba(239,68,68,0.04)",
                              border: "1px dashed rgba(239,68,68,0.2)",
                            }}>
                            <Lock className="w-3 h-3" style={{ color: "rgba(239,68,68,0.4)" }} />
                          </div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {/* Estado vacío semana */}
          {!loading && appts.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <p className="text-sm font-body" style={{ color: "var(--ds-text-4)" }}>Sin turnos esta semana</p>
              <NextLink href="/dashboard/reservas/nueva">
                <button className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold font-body text-black"
                  style={{ backgroundColor: "#CA8A04" }}>
                  <Plus className="w-3.5 h-3.5" /> Agregar turno
                </button>
              </NextLink>
            </div>
          )}
        </div>
      </div>}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — Bloquear horario
      ══════════════════════════════════════════════════════════════════ */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={() => setBlockModal(null)}
          />
          <div
            className="relative w-full max-w-sm rounded-2xl overflow-hidden animate-fade-up"
            style={{ backgroundColor: "var(--ds-surface)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <div className="h-1.5 w-full" style={{ backgroundColor: "#EF4444" }} />

            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Ban className="w-4 h-4" style={{ color: "#EF4444" }} />
                    <h2 className="text-base font-bold text-white font-body">Bloquear horario</h2>
                  </div>
                  <p className="text-xs font-body capitalize" style={{ color: "#71717A" }}>
                    {blockModal.dayDate.toLocaleDateString("es-419", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </p>
                </div>
                <button onClick={() => setBlockModal(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
                  style={{ color: "var(--ds-text-3)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "var(--ds-text-3)" }}>
                    Desde
                  </label>
                  <select value={blockFrom}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setBlockFrom(v);
                      if (blockTo <= v) setBlockTo(Math.min(v + 0.25, END_H));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-body text-white outline-none appearance-none"
                    style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border-md)" }}>
                    {TIME_OPTIONS.filter((o) => o.value < END_H).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "var(--ds-text-3)" }}>
                    Hasta
                  </label>
                  <select value={blockTo}
                    onChange={(e) => setBlockTo(parseFloat(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-body text-white outline-none appearance-none"
                    style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border-md)" }}>
                    {TIME_OPTIONS.filter((o) => o.value > blockFrom).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "#EF4444" }} />
                  <span className="text-sm font-semibold text-white font-body">
                    {hourToTime(blockFrom)} — {hourToTime(blockTo)}
                  </span>
                </div>
                <span className="text-xs font-body" style={{ color: "#71717A" }}>
                  {Math.round((blockTo - blockFrom) * 60)} min
                </span>
              </div>

              {visible.some(
                (a) => a.day === blockModal.day && a.hour < blockTo && a.hour + a.duration > blockFrom
              ) && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <X className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#EF4444" }} />
                  <p className="text-xs font-body" style={{ color: "#EF4444" }}>
                    Hay un turno reservado en ese rango. Cambia el horario.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setBlockModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body"
                  style={{ border: "1px solid var(--ds-border-md)", color: "#71717A" }}>
                  Cancelar
                </button>
                <button onClick={confirmBlock}
                  disabled={
                    blockTo <= blockFrom ||
                    visible.some((a) => a.day === blockModal.day && a.hour < blockTo && a.hour + a.duration > blockFrom)
                  }
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-white hover:opacity-90 disabled:opacity-30 transition-all"
                  style={{ backgroundColor: "#EF4444" }}>
                  Bloquear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL — Detalle + Transferir turno
      ══════════════════════════════════════════════════════════════════ */}
      {selected && selStyle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={closeModal} />

          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border-md)" }}>

            <div className="h-1.5 w-full" style={{ backgroundColor: selStyle.text }} />

            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-body">{selected.client}</h2>
                  <p className="text-xs font-body mt-0.5" style={{ color: "#71717A" }}>
                    {slotLabel(selected.hour)} – {addHours(selected.hour, selected.duration)}
                  </p>
                </div>
                <button onClick={closeModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5"
                  style={{ color: "var(--ds-text-3)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ backgroundColor: "var(--ds-surface-2)" }}>
                {[
                  { icon: Scissors, text: selected.service },
                  { icon: User,     text: selBarberInfo?.label ?? "Barbero" },
                  { icon: Clock,    text: `${Math.round(selected.duration * 60)} min` },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: selStyle.text }} />
                    <span className="text-sm font-body text-white">{text}</span>
                  </div>
                ))}
                {selected.phone && (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs" style={{ color: selStyle.text }}>📱</span>
                    </div>
                    <span className="text-sm font-body" style={{ color: "#71717A" }}>{selected.phone}</span>
                  </div>
                )}
                <div className="mt-1 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selStyle.text }} />
                    <span className="text-xs font-body font-semibold" style={{ color: selStyle.text }}>
                      {transferred ? "Turno transferido" : `Asignado a ${selBarberInfo?.label ?? "Barbero"}`}
                    </span>
                    {transferred && <Check className="w-3.5 h-3.5 ml-1" style={{ color: "#22C55E" }} />}
                  </div>
                </div>
              </div>

              {transferMode && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-body font-semibold uppercase tracking-wider" style={{ color: "var(--ds-text-3)" }}>
                    Transferir a:
                  </p>
                  {barbers.filter((b) => b.id !== selected.barber).map((b) => {
                    const bsb    = BS[b.id] ?? hexToStyle(b.color);
                    const isTarget = targetBarber === b.id;
                    return (
                      <button key={b.id} onClick={() => setTargetBarber(b.id)}
                        className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{
                          backgroundColor: isTarget ? bsb.bg : "#0D0D0D",
                          border: isTarget ? `1.5px solid ${bsb.border}` : "1px solid rgba(255,255,255,0.05)",
                        }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-body flex-shrink-0"
                          style={{ backgroundColor: b.color + "22", color: b.color }}>
                          {b.label[0]}
                        </div>
                        <span className="text-sm font-semibold font-body flex-1"
                          style={{ color: isTarget ? bsb.text : "#A1A1AA" }}>
                          {b.label}
                        </span>
                        {isTarget && <Check className="w-4 h-4" style={{ color: bsb.text }} />}
                      </button>
                    );
                  })}
                  <div className="flex gap-3 mt-1">
                    <button onClick={() => { setTransferMode(false); setTargetBarber(null); }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body"
                      style={{ border: "1px solid var(--ds-border-md)", color: "#71717A" }}>
                      Cancelar
                    </button>
                    <button onClick={confirmTransfer} disabled={!targetBarber}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold font-body text-black hover:opacity-90 disabled:opacity-30 transition-all"
                      style={{ backgroundColor: "#CA8A04" }}>
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              {!transferMode && !transferred && barbers.length > 1 && (
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
