"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Check, ChevronLeft, ChevronRight, Clock, Search,
  User, Phone, Mail, Scissors, Calendar, CheckCircle2,
  Loader2, X,
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

/* ── Tipos ─────────────────────────────────────────────────────────────────── */
type DaySchedule = {
  enabled:   boolean;
  from:      string;
  to:        string;
  breakFrom: string;
  breakTo:   string;
  hasBreak:  boolean;
};
type WeekSchedule = Record<string, DaySchedule>;

// Mapeo key español → índice JS de getDay()
const DAY_KEY_TO_JS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
};
const DAY_JS_TO_KEY = ["domingo","lunes","martes","miercoles","jueves","viernes","sabado"];
const DAY_LABELS: Record<string, string> = {
  domingo: "domingos", lunes: "lunes", martes: "martes", miercoles: "miércoles",
  jueves: "jueves", viernes: "viernes", sabado: "sábados",
};

/** Genera slots de 30 min respetando apertura, cierre y descanso */
function generarSlots(day: DaySchedule | null, ocupados: string[]) {
  const from      = day?.from      ?? "09:00";
  const to        = day?.to        ?? "20:00";
  const hasBreak  = day?.hasBreak  ?? false;
  const breakFrom = day?.breakFrom ?? "";
  const breakTo   = day?.breakTo   ?? "";

  const toMins  = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fromM   = toMins(from);
  const toM     = toMins(to);
  const bFromM  = hasBreak && breakFrom ? toMins(breakFrom) : -1;
  const bToM    = hasBreak && breakTo   ? toMins(breakTo)   : -1;

  const slots = [];
  for (let m = fromM; m < toM; m += 30) {
    const h    = Math.floor(m / 60);
    const min  = m % 60;
    const hora = `${h.toString().padStart(2, "0")}:${min === 0 ? "00" : "30"}`;
    const inBreak = hasBreak && m >= bFromM && m < bToM;
    slots.push({ hora, disponible: !inBreak && !ocupados.includes(hora) });
  }
  return slots;
}

type BarberAPI = {
  id: string;
  colorTag: string;
  specialties: string[];
  isActive: boolean;
  user: { id: string; name: string; phone: string | null; email: string };
};

type ServiceAPI = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMins: number;
  category: string;
};

type ClientAPI = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  totalVisits: number;
};

type Reserva = {
  barbero:      BarberAPI | null;
  servicios:    ServiceAPI[];
  fecha:        string;
  hora:         string;
  cliente:      ClientAPI | null;
  esNuevo:      boolean;
  nuevoCliente: { name: string; phone: string; email: string };
  notas:        string;
};

const PASOS = ["Barbero", "Servicio", "Fecha y hora", "Cliente", "Confirmar"];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />;
}


/* ════════════════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
════════════════════════════════════════════════════════════════════════════ */
export default function NuevaReservaPage() {
  const router = useRouter();
  const { barbershop } = useAuth();

  const [paso,     setPaso]     = useState(0);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  /* ── Datos de la DB ───────────────────────────────────────────────────── */
  const [Mibarberia,        setMibarberia]        = useState<BarberAPI[]>([]);
  const [servicios,       setServicios]       = useState<ServiceAPI[]>([]);
  const [clientes,        setClientes]        = useState<ClientAPI[]>([]);
  const [slots,           setSlots]           = useState<{ hora: string; disponible: boolean }[]>([]);
  const [schedule,        setSchedule]        = useState<WeekSchedule | null>(null);
  const [loadingMibarberia, setLoadingMibarberia] = useState(true);
  const [loadingServicios,setLoadingServicios]= useState(true);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingSlots,    setLoadingSlots]    = useState(false);

  const [reserva, setReserva] = useState<Reserva>({
    barbero:      null,
    servicios:    [],
    fecha:        "",
    hora:         "",
    cliente:      null,
    esNuevo:      false,
    nuevoCliente: { name: "", phone: "", email: "" },
    notas:        "",
  });

  /* ── Fetch horario de la barbería ────────────────────────────────────── */
  useEffect(() => {
    fetch("/api/barbershop")
      .then((r) => r.json())
      .then(({ barbershop }) => {
        const s = barbershop?.settings?.schedule as WeekSchedule | undefined;
        setSchedule(s ?? null);
      })
      .catch(console.error);
  }, []);

  /** Devuelve el DaySchedule del día de una fecha ISO (YYYY-MM-DD) */
  function getDaySchedule(dateStr: string): DaySchedule | null {
    if (!schedule) return null;
    const dayKey = DAY_JS_TO_KEY[new Date(dateStr + "T12:00:00").getDay()];
    return schedule[dayKey] ?? null;
  }

  /** Retorna true si la barbería abre ese día */
  function isDayOpen(dateStr: string): boolean {
    const ds = getDaySchedule(dateStr);
    return ds?.enabled ?? true; // sin horario configurado, todo abierto
  }

  /* ── Fetch Mibarberia ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!barbershop?.id) return;
    fetch("/api/barbers")
      .then((r) => r.json())
      .then(({ data }) => setMibarberia((data ?? []).filter((b: BarberAPI) => b.isActive)))
      .catch(console.error)
      .finally(() => setLoadingMibarberia(false));
  }, [barbershop?.id]);

  /* ── Fetch servicios ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!barbershop?.id) return;
    fetch("/api/services")
      .then((r) => r.json())
      .then(({ data }) => setServicios(data ?? []))
      .catch(console.error)
      .finally(() => setLoadingServicios(false));
  }, [barbershop?.id]);

  /* ── Fetch clientes ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!barbershop?.id) return;
    fetch(`/api/clients?barbershopId=${barbershop.id}&pageSize=500`)
      .then((r) => r.json())
      .then(({ data }) => setClientes(data ?? []))
      .catch(console.error)
      .finally(() => setLoadingClientes(false));
  }, [barbershop?.id]);

  /* ── Fetch slots disponibles al cambiar barbero o fecha ───────────────── */
  useEffect(() => {
    if (!reserva.barbero || !reserva.fecha || !barbershop?.id) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    fetch(`/api/appointments?barbershopId=${barbershop.id}&date=${reserva.fecha}&pageSize=100`)
      .then((r) => r.json())
      .then(({ data }) => {
        const appts = (data ?? []).filter(
          (a: { barberId: string; status: string }) =>
            a.barberId === reserva.barbero!.id &&
            !["CANCELLED", "NO_SHOW"].includes(a.status)
        );
        const ocupados = appts.map((a: { startsAt: string }) => {
          const d = new Date(a.startsAt);
          return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes() === 0 ? "00" : "30"}`;
        });
        // Usar horario real del día seleccionado
        const daySchedule = getDaySchedule(reserva.fecha);
        setSlots(generarSlots(daySchedule, ocupados));
      })
      .catch(() => setSlots(generarSlots(null, [])))
      .finally(() => setLoadingSlots(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reserva.barbero, reserva.fecha, barbershop?.id, schedule]);

  /* ── Cálculos ─────────────────────────────────────────────────────────── */
  const totalPrecio  = reserva.servicios.reduce((s, sv) => s + Number(sv.price), 0);
  const totalMinutos = reserva.servicios.reduce((s, sv) => s + sv.durationMins, 0);
  const puedeAvanzar = ([
    !!reserva.barbero,
    reserva.servicios.length > 0,
    !!(reserva.fecha && reserva.hora),
    reserva.esNuevo
      ? !!(reserva.nuevoCliente.name && reserva.nuevoCliente.phone)
      : !!reserva.cliente,
  ][paso]) ?? true;

  function toggleServicio(sv: ServiceAPI) {
    setReserva((r) => ({
      ...r,
      servicios: r.servicios.find((s) => s.id === sv.id)
        ? r.servicios.filter((s) => s.id !== sv.id)
        : [...r.servicios, sv],
    }));
  }

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.phone.includes(busqueda)
  );

  /* ── Confirmar reserva ────────────────────────────────────────────────── */
  async function confirmar() {
    if (!reserva.barbero) return;
    setCargando(true);
    try {
      let clientId: string;

      if (reserva.esNuevo) {
        const res = await fetch("/api/clients", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            name:  reserva.nuevoCliente.name.trim(),
            phone: reserva.nuevoCliente.phone.trim(),
            email: reserva.nuevoCliente.email.trim() || undefined,
          }),
        });

        if (res.status === 409) {
          // Cliente ya existe — usar el existente
          const match = clientes.find((c) => c.phone === reserva.nuevoCliente.phone.trim());
          if (match) {
            clientId = match.id;
          } else {
            toast.error("El teléfono ya está registrado para otro cliente");
            return;
          }
        } else if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err.error ?? "Error al crear el cliente");
          return;
        } else {
          const { data } = await res.json();
          clientId = data.id;
        }
      } else {
        if (!reserva.cliente) { toast.error("Seleccioná un cliente"); return; }
        clientId = reserva.cliente.id;
      }

      // Construir startsAt como ISO UTC
      const startsAt = new Date(`${reserva.fecha}T${reserva.hora}:00`).toISOString();

      const apptRes = await fetch("/api/appointments", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          clientId,
          barberId:   reserva.barbero.id,
          serviceIds: reserva.servicios.map((s) => s.id),
          startsAt,
          notes:  reserva.notas.trim() || undefined,
          source: "manual",
        }),
      });

      if (!apptRes.ok) {
        const err = await apptRes.json().catch(() => ({}));
        toast.error(err.error ?? "Error al crear la reserva");
        return;
      }

      toast.success("¡Reserva registrada con éxito!");
      router.refresh(); // Invalida el Router Cache para que /dashboard recargue datos
      router.push("/dashboard/reservas");
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto pb-12">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/reservas" className="text-xs font-medium font-body transition-colors" style={{ color: "#52525B" }}>
          Reservas
        </Link>
        <ChevronRight className="w-3 h-3" style={{ color: "#3F3F46" }} />
        <span className="text-xs font-medium font-body text-white">Nueva reserva manual</span>
      </div>

      {/* Título */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-medium text-white tracking-tight">Registrar reserva manual</h1>
        <p className="text-sm font-body font-light mt-1" style={{ color: "#52525B" }}>Completá los datos del turno a registrar</p>
      </div>

      {/* ── Stepper ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
        {PASOS.map((label, i) => (
          <div key={label} className="flex items-center flex-shrink-0">
            <button onClick={() => i < paso && setPaso(i)} className="flex flex-col items-center gap-1.5" disabled={i > paso}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-body transition-all",
                i < paso ? "step-done" : i === paso ? "step-active" : "step-pending"
              )}>
                {i < paso ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className="text-xs font-body whitespace-nowrap hidden sm:block"
                style={{ color: i === paso ? "#CA8A04" : i < paso ? "#71717A" : "#3F3F46" }}>
                {label}
              </span>
            </button>
            {i < PASOS.length - 1 && (
              <div className="h-px w-8 sm:w-12 mx-1 flex-shrink-0 transition-colors"
                style={{ backgroundColor: i < paso ? "rgba(202,138,4,0.4)" : "rgba(255,255,255,0.06)" }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Panel del paso ────────────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 animate-slide-in"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* ═══ PASO 0 — BARBERO ════════════════════════════════════════════ */}
        {paso === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-display font-medium text-white mb-2">Seleccionar barbero</h2>

            {loadingMibarberia ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
            ) : Mibarberia.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Scissors className="w-8 h-8" style={{ color: "#27272A" }} />
                <p className="text-sm font-body" style={{ color: "#3F3F46" }}>No tenés Mibarberia activos todavía</p>
                <Link href="/dashboard/Mibarberia"
                  className="text-xs font-semibold font-body px-4 py-2 rounded-xl"
                  style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}>
                  Agregar barbero
                </Link>
              </div>
            ) : (
              Mibarberia.map((b) => {
                const color    = b.colorTag ?? "#CA8A04";
                const selected = reserva.barbero?.id === b.id;
                return (
                  <button key={b.id} onClick={() => setReserva((r) => ({ ...r, barbero: b }))}
                    className="flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                    style={{
                      backgroundColor: selected ? "rgba(202,138,4,0.06)" : "#0D0D0D",
                      border: selected ? "1px solid rgba(202,138,4,0.35)" : "1px solid rgba(255,255,255,0.06)",
                    }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold font-body flex-shrink-0"
                      style={{ backgroundColor: color + "22", color }}>
                      {getInitials(b.user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white font-body">{b.user.name}</p>
                      <p className="text-xs font-body font-light" style={{ color: "#52525B" }}>
                        {b.specialties[0] ?? "Sin especialidad"}
                      </p>
                    </div>
                    {selected && <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#CA8A04" }} />}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* ═══ PASO 1 — SERVICIOS ══════════════════════════════════════════ */}
        {paso === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-medium text-white">Seleccionar servicio(s)</h2>
              {reserva.servicios.length > 0 && (
                <span className="text-xs font-body px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(202,138,4,0.12)", color: "#CA8A04" }}>
                  {reserva.servicios.length} seleccionado{reserva.servicios.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {loadingServicios ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : servicios.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Scissors className="w-8 h-8" style={{ color: "#27272A" }} />
                <p className="text-sm font-body" style={{ color: "#3F3F46" }}>No tenés servicios configurados todavía</p>
                <Link href="/dashboard/servicios"
                  className="text-xs font-semibold font-body px-4 py-2 rounded-xl"
                  style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }}>
                  Agregar servicio
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {servicios.map((sv) => {
                    const sel = !!reserva.servicios.find((s) => s.id === sv.id);
                    return (
                      <button key={sv.id} onClick={() => toggleServicio(sv)}
                        className="flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                        style={{
                          backgroundColor: sel ? "rgba(202,138,4,0.06)" : "#0D0D0D",
                          border: sel ? "1px solid rgba(202,138,4,0.35)" : "1px solid rgba(255,255,255,0.06)",
                        }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ backgroundColor: sel ? "rgba(202,138,4,0.15)" : "#1A1A1A" }}>
                          <Scissors className="w-3.5 h-3.5" style={{ color: sel ? "#CA8A04" : "#52525B" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white font-body">{sv.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-body px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: "#1A1A1A", color: "#52525B" }}>{sv.category}</span>
                            <span className="text-xs font-body flex items-center gap-1" style={{ color: "#52525B" }}>
                              <Clock className="w-3 h-3" /> {sv.durationMins} min
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-white font-body">{formatCurrency(Number(sv.price))}</p>
                        </div>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ backgroundColor: sel ? "#CA8A04" : "#1A1A1A", border: sel ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
                          {sel && <Check className="w-3 h-3 text-black" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {reserva.servicios.length > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-xl mt-2"
                    style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.2)" }}>
                    <div className="flex items-center gap-2 text-sm font-body" style={{ color: "#A1A1AA" }}>
                      <Clock className="w-4 h-4" style={{ color: "#CA8A04" }} />
                      <span>{totalMinutos} min en total</span>
                    </div>
                    <p className="text-base font-bold text-white font-body">{formatCurrency(totalPrecio)}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ PASO 2 — FECHA Y HORA ═══════════════════════════════════════ */}
        {paso === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-display font-medium text-white">Fecha y hora del turno</h2>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-2" style={{ color: "#52525B" }}>
                Fecha
              </label>
              <input type="date" value={reserva.fecha}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) { setReserva((r) => ({ ...r, fecha: "", hora: "" })); return; }
                  if (!isDayOpen(val)) {
                    const dayKey = DAY_JS_TO_KEY[new Date(val + "T12:00:00").getDay()];
                    toast.error(`La barbería no abre los ${DAY_LABELS[dayKey]}. Elegí otro día.`);
                    e.target.value = reserva.fecha; // revertir visualmente
                    return;
                  }
                  setReserva((r) => ({ ...r, fecha: val, hora: "" }));
                }}
                className="input-dark" style={{ colorScheme: "dark" }} />

              {/* Chips de días habilitados */}
              {schedule && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {["lunes","martes","miercoles","jueves","viernes","sabado","domingo"].map((key) => {
                    const open = schedule[key]?.enabled ?? false;
                    const label = { lunes:"Lu", martes:"Ma", miercoles:"Mi", jueves:"Ju", viernes:"Vi", sabado:"Sa", domingo:"Do" }[key];
                    return (
                      <span key={key} className="text-xs font-semibold font-body px-2.5 py-1 rounded-lg"
                        style={open
                          ? { backgroundColor: "rgba(34,197,94,0.1)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }
                          : { backgroundColor: "rgba(239,68,68,0.06)", color: "#52525B", border: "1px solid rgba(255,255,255,0.05)" }
                        }>
                        {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {reserva.fecha && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-3" style={{ color: "#52525B" }}>
                  Hora disponible
                </label>
                {loadingSlots ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {slots.map(({ hora, disponible }) => (
                      <button key={hora} disabled={!disponible}
                        onClick={() => setReserva((r) => ({ ...r, hora }))}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-semibold font-body transition-all",
                          !disponible && "opacity-30 cursor-not-allowed line-through"
                        )}
                        style={{
                          backgroundColor: reserva.hora === hora ? "#CA8A04" : disponible ? "#1A1A1A" : "#0D0D0D",
                          border: reserva.hora === hora ? "1px solid #CA8A04" : "1px solid rgba(255,255,255,0.06)",
                          color: reserva.hora === hora ? "#000" : disponible ? "#A1A1AA" : "#3F3F46",
                        }}>
                        {hora}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {reserva.fecha && reserva.hora && (
              <div className="flex items-center gap-3 p-4 rounded-xl"
                style={{ backgroundColor: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.2)" }}>
                <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: "#CA8A04" }} />
                <p className="text-sm font-body font-medium" style={{ color: "#A1A1AA" }}>
                  {new Date(reserva.fecha + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
                  {" "}&bull;{" "}{reserva.hora} hrs
                  {" "}&bull;{" "}{totalMinutos} min
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ PASO 3 — CLIENTE ════════════════════════════════════════════ */}
        {paso === 3 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-display font-medium text-white">Datos del cliente</h2>

            <div className="flex rounded-xl overflow-hidden"
              style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                { label: "Buscar cliente", val: false },
                { label: "Cliente nuevo",  val: true  },
              ].map(({ label, val }) => (
                <button key={label}
                  onClick={() => setReserva((r) => ({ ...r, esNuevo: val, cliente: null }))}
                  className="flex-1 py-2.5 text-sm font-semibold font-body transition-all rounded-xl"
                  style={reserva.esNuevo === val
                    ? { backgroundColor: "#CA8A04", color: "#000" }
                    : { color: "#52525B" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Buscar cliente existente */}
            {!reserva.esNuevo && (
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#3F3F46" }} />
                  <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Busca por nombre o teléfono..." className="input-dark pl-10" />
                </div>

                {loadingClientes ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
                ) : (
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {clientesFiltrados.length === 0 ? (
                      <p className="text-center text-sm font-body py-6" style={{ color: "#3F3F46" }}>
                        {busqueda ? "No se encontró ningún cliente" : "No hay clientes registrados todavía"}
                      </p>
                    ) : (
                      clientesFiltrados.map((c) => (
                        <button key={c.id} onClick={() => setReserva((r) => ({ ...r, cliente: c }))}
                          className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                          style={{
                            backgroundColor: reserva.cliente?.id === c.id ? "rgba(202,138,4,0.06)" : "#0D0D0D",
                            border: reserva.cliente?.id === c.id ? "1px solid rgba(202,138,4,0.35)" : "1px solid rgba(255,255,255,0.06)",
                          }}>
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-body flex-shrink-0"
                            style={{ backgroundColor: "#1A1A1A", color: "#CA8A04" }}>
                            {getInitials(c.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white font-body">{c.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-body" style={{ color: "#52525B" }}>{c.phone}</span>
                              <span className="text-xs font-body" style={{ color: "#3F3F46" }}>·</span>
                              <span className="text-xs font-body" style={{ color: "#52525B" }}>{c.totalVisits} visitas</span>
                            </div>
                          </div>
                          {reserva.cliente?.id === c.id && <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#CA8A04" }} />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Nuevo cliente */}
            {reserva.esNuevo && (
              <div className="flex flex-col gap-3">
                {[
                  { field: "name",  label: "Nombre completo",       placeholder: "Ej: Lucas Pérez",   icon: User,  type: "text"  },
                  { field: "phone", label: "Teléfono (WhatsApp)",    placeholder: "+56 9 XXXX XXXX",   icon: Phone, type: "tel"   },
                  { field: "email", label: "Correo (opcional)",      placeholder: "lucas@correo.com",  icon: Mail,  type: "email" },
                ].map(({ field, label, placeholder, icon: Icon, type }) => (
                  <div key={field}>
                    <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                      {label}
                    </label>
                    <div className="relative">
                      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#3F3F46" }} />
                      <input type={type}
                        value={reserva.nuevoCliente[field as keyof typeof reserva.nuevoCliente]}
                        onChange={(e) => setReserva((r) => ({ ...r, nuevoCliente: { ...r.nuevoCliente, [field]: e.target.value } }))}
                        placeholder={placeholder} className="input-dark pl-10" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider font-body block mb-1.5" style={{ color: "#52525B" }}>
                Notas (opcional)
              </label>
              <textarea value={reserva.notas}
                onChange={(e) => setReserva((r) => ({ ...r, notas: e.target.value }))}
                placeholder="Ej: cliente nuevo, quiere degradé bien bajo..."
                rows={3} className="input-dark resize-none"
                style={{ fontFamily: "Montserrat, sans-serif" }} />
            </div>
          </div>
        )}

        {/* ═══ PASO 4 — CONFIRMAR ══════════════════════════════════════════ */}
        {paso === 4 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5" style={{ color: "#CA8A04" }} />
              <h2 className="text-lg font-display font-medium text-white">Todo listo, revisá el resumen</h2>
            </div>

            <div className="flex flex-col gap-3">
              {[
                {
                  icon: User,
                  label: "Barbero",
                  value: reserva.barbero?.user.name ?? "-",
                  sub: reserva.barbero?.specialties[0],
                },
                {
                  icon: Scissors,
                  label: "Servicios",
                  value: reserva.servicios.map((s) => s.name).join(", ") || "-",
                  sub: `${totalMinutos} min · ${formatCurrency(totalPrecio)}`,
                },
                {
                  icon: Calendar,
                  label: "Fecha y hora",
                  value: reserva.fecha
                    ? new Date(reserva.fecha + "T12:00:00").toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })
                    : "-",
                  sub: reserva.hora ? `${reserva.hora} hrs` : "",
                },
                {
                  icon: User,
                  label: "Cliente",
                  value: reserva.esNuevo
                    ? reserva.nuevoCliente.name || "-"
                    : reserva.cliente?.name ?? "-",
                  sub: reserva.esNuevo ? reserva.nuevoCliente.phone : reserva.cliente?.phone,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
                    <row.icon className="w-4 h-4" style={{ color: "#CA8A04" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider font-body mb-0.5" style={{ color: "#52525B" }}>
                      {row.label}
                    </p>
                    <p className="text-sm font-medium text-white font-body truncate">{row.value}</p>
                    {row.sub && <p className="text-xs font-body font-light mt-0.5" style={{ color: "#71717A" }}>{row.sub}</p>}
                  </div>
                </div>
              ))}

              {reserva.notas && (
                <div className="p-4 rounded-xl"
                  style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider font-body mb-1" style={{ color: "#52525B" }}>Notas</p>
                  <p className="text-sm font-body font-light" style={{ color: "#A1A1AA" }}>{reserva.notas}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "linear-gradient(145deg,#1A1400,#111111)", border: "1px solid rgba(202,138,4,0.3)" }}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider font-body" style={{ color: "#CA8A04" }}>Total a cobrar</p>
                <p className="text-xs font-body font-light mt-0.5" style={{ color: "#71717A" }}>
                  {totalMinutos} min · {reserva.servicios.length} servicio{reserva.servicios.length !== 1 ? "s" : ""}
                </p>
              </div>
              <p className="text-2xl font-bold text-white font-body">{formatCurrency(totalPrecio)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Navegación ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => paso === 0 ? router.push("/dashboard/reservas") : setPaso((p) => p - 1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold font-body transition-colors"
          style={{ color: "#52525B", border: "1px solid rgba(255,255,255,0.07)" }}>
          {paso === 0 ? <X className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {paso === 0 ? "Cancelar" : "Atrás"}
        </button>

        {paso < PASOS.length - 1 ? (
          <button onClick={() => setPaso((p) => p + 1)} disabled={!puedeAvanzar}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#CA8A04" }}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={confirmar} disabled={cargando}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold font-body text-black transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#CA8A04" }}>
            {cargando
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Registrando...</>
              : <><CheckCircle2 className="w-4 h-4" /> Confirmar reserva</>
            }
          </button>
        )}
      </div>
    </div>
  );
}
