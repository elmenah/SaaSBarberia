"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Search, Plus, Filter, MoreHorizontal, Clock, XCircle, UserX, DollarSign, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

type Appointment = {
  id: string;
  startsAt: string;
  status: string;
  source: string;
  totalPrice: number;
  paidAmount?: number | null;
  totalDuration: number;
  client: { name: string };
  barber: { user: { name: string } };
  services: { service: { name: string } }[];
};

// ── Modal: registrar descuento en turno completado ────────────────────────────
function DiscountModal({
  appointment,
  onConfirm,
  onCancel,
}: {
  appointment: Appointment;
  onConfirm: (paidAmount: number) => void;
  onCancel: () => void;
}) {
  const currentPaid = appointment.paidAmount ?? appointment.totalPrice;
  const [value, setValue] = useState(String(currentPaid));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const parsed = parseFloat(value.replace(",", "."));
  const discount = !isNaN(parsed) ? appointment.totalPrice - parsed : 0;

  function handleConfirm() {
    if (!isNaN(parsed) && parsed >= 0) onConfirm(parsed);
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
            <Tag className="w-4 h-4" style={{ color: "#CA8A04" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white font-body">Registrar descuento</p>
            <p className="text-xs font-body" style={{ color: "#52525B" }}>{appointment.client.name} · precio original: {formatCurrency(appointment.totalPrice)}</p>
          </div>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium font-body" style={{ color: "#71717A" }}>
            Monto real cobrado
          </label>
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{ backgroundColor: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <DollarSign className="w-4 h-4 flex-shrink-0" style={{ color: "#52525B" }} />
            <input
              ref={inputRef}
              type="number"
              min="0"
              step="100"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirm(); if (e.key === "Escape") onCancel(); }}
              className="bg-transparent text-sm outline-none w-full font-body"
              style={{ color: "#E4E4E7" }}
            />
          </div>
          {discount > 0 && (
            <p className="text-xs font-body" style={{ color: "#CA8A04" }}>
              Descuento aplicado: {formatCurrency(discount)} — el dashboard reflejará el monto real
            </p>
          )}
          {discount < 0 && (
            <p className="text-xs font-body" style={{ color: "#EF4444" }}>
              El monto no puede superar el precio original
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium font-body transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isNaN(parsed) || discount < 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body text-black transition-all hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: "#CA8A04" }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED:   { label: "Completada",     color: "#22C55E", bg: "rgba(34,197,94,0.08)"   },
  IN_PROGRESS: { label: "En curso",       color: "#CA8A04", bg: "rgba(202,138,4,0.08)"   },
  CONFIRMED:   { label: "Confirmada",     color: "#A78BFA", bg: "rgba(167,139,250,0.08)" },
  PENDING:     { label: "Pendiente",      color: "#F59E0B", bg: "rgba(245,158,11,0.08)"  },
  CANCELLED:   { label: "Cancelada",      color: "#EF4444", bg: "rgba(239,68,68,0.08)"   },
  NO_SHOW:     { label: "No se presentó", color: "#EF4444", bg: "rgba(239,68,68,0.08)"   },
  EXPIRED:     { label: "Vencida",        color: "#71717A", bg: "rgba(113,113,122,0.08)" },
};

/** Reserva pasada y aún en estado pendiente o confirmada */
function isExpired(r: Appointment) {
  if (r.status !== "PENDING" && r.status !== "CONFIRMED") return false;
  return new Date(r.startsAt) < new Date();
}

function getStatus(r: Appointment) {
  if (isExpired(r)) return STATUS_MAP.EXPIRED;
  return STATUS_MAP[r.status] ?? STATUS_MAP.PENDING;
}

const SOURCE_ICON: Record<string, string> = {
  manual: "✏️", whatsapp: "💬", web: "🌐", api: "🔌",
};

const FILTERS = ["Todas", "Hoy", "Pendientes", "Confirmadas"];

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />;
}

/* ── Menú contextual — usa position:fixed para no quedar cortado por overflow:hidden ── */
type MenuPos = { top?: number; bottom?: number; right: number };

function ActionMenu({ appointment, onStatusChange, onDiscount, onDelete }: {
  appointment: Appointment;
  onStatusChange: (id: string, status: string) => void;
  onDiscount: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
}) {
  const [open, setOpen]   = useState(false);
  const [pos,  setPos]    = useState<MenuPos>({ top: 0, right: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClose(e: MouseEvent) {
      // Ignorar si el click fue en el botón de apertura o dentro del menú
      if (btnRef.current?.contains(e.target as Node))  return;
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handleClose);
    document.addEventListener("scroll",    handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClose);
      document.removeEventListener("scroll",    handleScroll, true);
    };
  }, [open]);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    // Toggle: si ya está abierto, cerrar
    if (open) { setOpen(false); return; }
    if (!btnRef.current) return;
    const rect       = btnRef.current.getBoundingClientRect();
    const menuH      = 116;
    const spaceBelow = window.innerHeight - rect.bottom;
    const right      = window.innerWidth - rect.right;
    setPos(spaceBelow < menuH
      ? { bottom: window.innerHeight - rect.top + 4, right }
      : { top: rect.bottom + 4, right }
    );
    setOpen(true);
  }

  // Acciones de cambio de estado (completar es automático)
  const statusActions = [
    { label: "Marcar no se presentó", icon: UserX,   status: "NO_SHOW",   color: "#EF4444" },
    { label: "Cancelar reserva",      icon: XCircle, status: "CANCELLED", color: "#EF4444" },
  ].filter(a => a.status !== appointment.status && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status));

  // Mostrar "Registrar descuento" si el turno ya está completado
  const showDiscount = ["COMPLETED", "IN_PROGRESS"].includes(appointment.status);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
        style={{ color: "#3F3F46" }}
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="fixed z-[9999] rounded-xl py-1 min-w-[196px]"
          style={{
            top:    pos.top    !== undefined ? pos.top    : "auto",
            bottom: pos.bottom !== undefined ? pos.bottom : "auto",
            right:  pos.right,
            backgroundColor: "#1A1A1A",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {showDiscount && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDiscount(appointment); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-body text-left hover:bg-white/5 transition-colors"
              style={{ color: "#CA8A04" }}
            >
              <Tag className="w-3.5 h-3.5 flex-shrink-0" />
              Registrar descuento
            </button>
          )}
          {statusActions.map(({ label, icon: Icon, status, color }) => (
            <button
              key={status}
              onClick={(e) => { e.stopPropagation(); setOpen(false); onStatusChange(appointment.id, status); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-body text-left hover:bg-white/5 transition-colors"
              style={{ color }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </button>
          ))}
          {!showDiscount && statusActions.length === 0 && (
            <p className="px-3 py-2.5 text-xs font-body" style={{ color: "#3F3F46" }}>Sin acciones disponibles</p>
          )}
          {/* Separador + Eliminar siempre disponible */}
          <div className="my-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(appointment); }}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-body text-left hover:bg-red-500/10 transition-colors"
            style={{ color: "#EF4444" }}
          >
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
            Eliminar reserva
          </button>
        </div>
      )}
    </>
  );
}

function DeleteConfirmModal({
  appointment,
  onConfirm,
  onCancel,
}: {
  appointment: Appointment;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
            <Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white font-body">Eliminar reserva</p>
            <p className="text-xs font-body" style={{ color: "#52525B" }}>
              {appointment.client.name} · {formatTime(appointment.startsAt)}
            </p>
          </div>
        </div>
        <p className="text-sm font-body" style={{ color: "#71717A" }}>
          Esta acción es permanente y no se puede deshacer. ¿Confirmar?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium font-body transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#71717A" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold font-body transition-all hover:opacity-90"
            style={{ backgroundColor: "#EF4444", color: "#fff" }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReservasPage() {
  const { barbershop, isBarber } = useAuth();
  const [reservas, setReservas] = useState<Appointment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeFilter, setActiveFilter] = useState("Todas");
  const [discountingAppt, setDiscountingAppt] = useState<Appointment | null>(null);
  const [deletingAppt, setDeletingAppt]       = useState<Appointment | null>(null);

  // Auto-transición de estados al cargar la página (IN_PROGRESS / COMPLETED)
  useEffect(() => {
    fetch("/api/appointments/auto-transition", { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!barbershop?.id) { setLoading(false); return; }

    const params = new URLSearchParams({ barbershopId: barbershop.id, pageSize: "50" });
    if (activeFilter === "Hoy") params.set("date", new Date().toISOString().split("T")[0]);
    if (activeFilter === "Pendientes")  params.set("status", "pending");
    if (activeFilter === "Confirmadas") params.set("status", "confirmed");

    setLoading(true);
    fetch(`/api/appointments?${params}`)
      .then(r => r.json())
      .then(({ data }) => setReservas(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [barbershop?.id, activeFilter]);

  async function handleStatusChange(id: string, status: string, paidAmount?: number) {
    // Optimistic update
    setReservas(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    try {
      const body: Record<string, unknown> = { status };
      if (paidAmount !== undefined) body.paidAmount = paidAmount;

      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        // Revert on error — reload
        const params = new URLSearchParams({ barbershopId: barbershop!.id, pageSize: "50" });
        fetch(`/api/appointments?${params}`).then(r => r.json()).then(({ data }) => setReservas(data ?? []));
      }
    } catch {
      console.error("Error actualizando estado");
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingAppt) return;
    const id = deletingAppt.id;
    setDeletingAppt(null);
    setReservas(prev => prev.filter(r => r.id !== id)); // optimistic remove
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Revert: volver a cargar
        const params = new URLSearchParams({ barbershopId: barbershop!.id, pageSize: "50" });
        fetch(`/api/appointments?${params}`).then(r => r.json()).then(({ data }) => setReservas(data ?? []));
      }
    } catch {
      console.error("Error eliminando reserva");
    }
  }

  async function handleDiscountConfirm(paidAmount: number) {
    if (!discountingAppt) return;
    const appt = discountingAppt;
    setDiscountingAppt(null);
    // Optimistic update
    setReservas(prev => prev.map(r => r.id === appt.id ? { ...r, paidAmount } : r));
    try {
      await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount }),
      });
    } catch {
      console.error("Error registrando descuento");
    }
  }

  return (
    <>
    {discountingAppt && (
      <DiscountModal
        appointment={discountingAppt}
        onConfirm={handleDiscountConfirm}
        onCancel={() => setDiscountingAppt(null)}
      />
    )}
    {deletingAppt && (
      <DeleteConfirmModal
        appointment={deletingAppt}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingAppt(null)}
      />
    )}
    <div className="flex flex-col gap-5">

      {/* ── Barra de acciones ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[200px] max-w-xs" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#3F3F46" }} />
          <input placeholder="Buscar reserva..." className="bg-transparent text-white placeholder:text-zinc-600 text-sm outline-none w-full font-body" />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium font-body transition-all"
              style={activeFilter === f
                ? { backgroundColor: "#CA8A04", color: "#000" }
                : { backgroundColor: "#111111", color: "#52525B", border: "1px solid rgba(255,255,255,0.06)" }
              }
            >
              {f}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)", color: "#52525B" }}>
            <Filter className="w-4 h-4" />
          </button>
          {!isBarber && (
            <Link href="/dashboard/reservas/nueva" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body text-black transition-all hover:opacity-90" style={{ backgroundColor: "#CA8A04" }}>
              <Plus className="w-4 h-4" />
              Nueva reserva
            </Link>
          )}
        </div>
      </div>

      {/* ── Mobile cards ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:hidden rounded-2xl overflow-hidden" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-1.5"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-24" /></div>
              </div>
            ))
          : reservas.length === 0
            ? <p className="text-center py-10 text-sm font-body" style={{ color: "#3F3F46" }}>Sin reservas</p>
            : reservas.map((r, idx) => {
                const st = getStatus(r);
                const expired = isExpired(r);
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ borderBottom: idx < reservas.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", opacity: expired ? 0.6 : 1 }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-body flex-shrink-0" style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04" }}>
                      {r.client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate font-body">{r.client.name}</p>
                      <p className="text-xs font-body" style={{ color: "#52525B" }}>
                        {r.barber.user.name.split(" ")[0]} · {formatTime(r.startsAt)} · {r.totalDuration} min · {formatCurrency(r.paidAmount ?? r.totalPrice)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 font-body" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                    <ActionMenu appointment={r} onStatusChange={handleStatusChange} onDiscount={setDiscountingAppt} onDelete={setDeletingAppt} />
                  </div>
                );
              })
        }
      </div>

      {/* ── Desktop tabla ─────────────────────────────────────────────── */}
      <div className="hidden sm:block rounded-2xl overflow-hidden" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider font-body" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#3F3F46" }}>
          <div className="col-span-1">ID</div>
          <div className="col-span-3">Cliente</div>
          <div className="col-span-2 hidden md:block">Barbero</div>
          <div className="col-span-2 hidden lg:block">Servicios</div>
          <div className="col-span-2">Horario</div>
          <div className="col-span-1 hidden sm:block">Total</div>
          <div className="col-span-1">Estado</div>
        </div>

        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 px-5 py-4 items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Skeleton className="col-span-1 h-3" />
                <div className="col-span-3 flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" /><Skeleton className="h-3 flex-1" /></div>
                <Skeleton className="col-span-2 h-3 hidden md:block" />
                <Skeleton className="col-span-2 h-3 hidden lg:block" />
                <Skeleton className="col-span-2 h-3" />
                <Skeleton className="col-span-1 h-3 hidden sm:block" />
                <Skeleton className="col-span-1 h-6 rounded-full" />
              </div>
            ))
          : reservas.length === 0
            ? <p className="text-center py-16 text-sm font-body" style={{ color: "#3F3F46" }}>Sin reservas — creá la primera con el botón "Nueva reserva"</p>
            : reservas.map((r, idx) => {
                const st = getStatus(r);
                const expired = isExpired(r);
                const shortId = r.id.slice(0, 6).toUpperCase();
                return (
                  <div key={r.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ borderBottom: idx < reservas.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", opacity: expired ? 0.6 : 1 }}>
                    <div className="col-span-1">
                      <span className="text-xs font-mono" style={{ color: "#3F3F46" }}>{shortId}</span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-body flex-shrink-0" style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04" }}>
                        {r.client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate font-body">{r.client.name}</p>
                        <p className="text-xs font-body" style={{ color: "#3F3F46" }}>{SOURCE_ICON[r.source] ?? "✏️"} {r.source}</p>
                      </div>
                    </div>
                    <div className="col-span-2 hidden md:flex items-center gap-1.5 min-w-0">
                      <span className="text-sm truncate font-body" style={{ color: "#71717A" }}>{r.barber.user.name.split(" ")[0]}</span>
                    </div>
                    <div className="col-span-2 hidden lg:flex flex-wrap gap-1">
                      {r.services.slice(0, 2).map(({ service }) => (
                        <span key={service.name} className="text-xs px-2 py-0.5 rounded font-body truncate" style={{ backgroundColor: "#1A1A1A", color: "#52525B" }}>{service.name}</span>
                      ))}
                    </div>
                    <div className="col-span-2 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-sm font-body" style={{ color: "#A1A1AA" }}>
                        <Clock className="w-3 h-3" style={{ color: "#3F3F46" }} />
                        {formatTime(r.startsAt)}
                      </div>
                      <span className="text-xs font-body" style={{ color: "#3F3F46" }}>{formatDate(r.startsAt)} · {r.totalDuration} min</span>
                    </div>
                    <div className="col-span-1 hidden sm:block">
                      <span className="text-sm font-semibold text-white font-body">
                        {formatCurrency(r.paidAmount ?? r.totalPrice)}
                      </span>
                      {r.paidAmount != null && r.paidAmount !== r.totalPrice && (
                        <span className="block text-xs font-body line-through" style={{ color: "#3F3F46" }}>
                          {formatCurrency(r.totalPrice)}
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 flex items-center gap-2">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full font-body whitespace-nowrap" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                      <ActionMenu appointment={r} onStatusChange={handleStatusChange} onDiscount={setDiscountingAppt} onDelete={setDeletingAppt} />
                    </div>
                  </div>
                );
              })
        }
      </div>
    </div>
    </>
  );
}
