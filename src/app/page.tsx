"use client";

import { useState, useEffect, useRef } from "react";
import {
  Menu, X, ArrowRight, Check, Zap, Users, Calendar,
  BarChart3, MessageSquare, Shield, Scissors, Bell, ChevronDown,
  Clock, TrendingUp, Star,
} from "lucide-react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";

/* ── Animation helpers ─────────────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ── Dashboard mockup mini ─────────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div
      className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl"
      style={{
        backgroundColor: "#0D0D0D",
        border: "1px solid rgba(202,138,4,0.25)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(202,138,4,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: "#080808", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <Scissors className="w-3 h-3" style={{ color: "#CA8A04" }} />
          <span className="text-white text-xs font-semibold" style={{ fontFamily: "Cormorant, serif" }}>Mibarberia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-xs" style={{ color: "#52525B" }}>En línea</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {[
          { label: "Ingresos", value: "$284K", color: "#CA8A04", trend: "+12%" },
          { label: "Turnos hoy", value: "14", color: "#22C55E", trend: "+3" },
          { label: "Ocupación", value: "87%", color: "#3B82F6", trend: "+5%" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-2.5" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs mb-1" style={{ color: "#52525B" }}>{kpi.label}</p>
            <p className="text-sm font-bold text-white">{kpi.value}</p>
            <p className="text-xs font-medium" style={{ color: kpi.color }}>{kpi.trend}</p>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      <div className="mx-3 mb-3 rounded-xl p-3" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-white">Esta semana</span>
          <span className="text-xs" style={{ color: "#CA8A04" }}>+18% vs anterior</span>
        </div>
        <svg viewBox="0 0 200 40" className="w-full" style={{ height: 36 }}>
          <defs>
            <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CA8A04" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#CA8A04" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,35 L28,28 L56,18 L84,22 L112,12 L140,16 L168,6 L200,10 L200,40 L0,40 Z" fill="url(#mg)" />
          <path d="M0,35 L28,28 L56,18 L84,22 L112,12 L140,16 L168,6 L200,10" fill="none" stroke="#CA8A04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Upcoming appointments */}
      <div className="mx-3 mb-3 rounded-xl overflow-hidden" style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-xs font-medium text-white">Próximos turnos</span>
        </div>
        {[
          { time: "10:30", name: "Carlos M.", service: "Corte + barba", barber: "Miguel" },
          { time: "11:00", name: "Diego R.", service: "Degradado", barber: "Sebastián" },
        ].map((appt) => (
          <div key={appt.time} className="flex items-center gap-2.5 px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
              <span className="text-xs font-bold" style={{ color: "#CA8A04" }}>{appt.time}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{appt.name}</p>
              <p className="text-xs truncate" style={{ color: "#52525B" }}>{appt.service} · {appt.barber}</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* WhatsApp notification bubble */}
      <div className="mx-3 mb-4 flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#25D366" }}>
          <MessageSquare className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white">Recordatorio enviado a 3 clientes</p>
          <p className="text-xs" style={{ color: "#52525B" }}>Hace 2 min · automático</p>
        </div>
      </div>
    </div>
  );
}

/* ── Nav ──────────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Inicio",        id: "inicio"     },
  { label: "Cómo funciona", id: "funciona"   },
  { label: "Funciones",     id: "beneficios" },
  { label: "Planes",        id: "planes"     },
  { label: "Preguntas",     id: "faq"        },
];

/* ── Features ─────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Calendar,
    title: "Reservas por WhatsApp, Instagram y web",
    desc: "Tus clientes agendan desde donde quieran. Sin llamadas, sin idas y venidas en chat — solo eligen, confirman y listo.",
  },
  {
    icon: Bell,
    title: "Notificaciones automáticas por WhatsApp",
    desc: "Confirmaciones al instante, recordatorios 24 h y 1 h antes del turno, y alertas de cancelación — todo sin que toques el teléfono.",
  },
  {
    icon: Users,
    title: "Perfil completo de cada cliente",
    desc: "Cortes favoritos, fotos de referencia, barbero preferido, gasto acumulado y cuándo fue la última vez. Todo en un solo lugar.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de rendimiento",
    desc: "Ingresos del mes, horas muertas, barbero top y servicios más pedidos — en tiempo real, sin Excel.",
  },
  {
    icon: Zap,
    title: "Recuperación automática de clientes",
    desc: "¿Un cliente lleva 3 semanas sin volver? El sistema lo detecta y le manda una promo automática. Tú no haces nada.",
  },
  {
    icon: Shield,
    title: "Multi-sucursal y seguro",
    desc: "Maneja varios locales desde un solo panel. Datos aislados por sucursal, roles de acceso y auditoría completa.",
  },
];

/* ── Planes ───────────────────────────────────────────────────────────────── */
type BillingPeriod = "monthly" | "biannual" | "annual";

const BASE_PRICES = { individual: 9990, profesional: 24990, enterprise: 49990 };
function applyDiscount(price: number, period: BillingPeriod) {
  if (period === "biannual") return Math.round(price * 0.80 / 10) * 10;
  if (period === "annual")   return Math.round(price * 0.70 / 10) * 10;
  return price;
}

function fmt(n: number) {
  return n.toLocaleString("es-CL");
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "¿Cuánto tiempo toma configurar Mibarberia?",
    a: "Menos de 10 minutos. Creas la cuenta, cargas tus servicios y en minutos ya puedes recibir reservas online desde tu link propio.",
  },
  {
    q: "¿Necesito instalar algo en mi computadora?",
    a: "No. Mibarberia funciona 100% en el navegador. Disponible desde cualquier dispositivo, sin instalaciones.",
  },
  {
    q: "¿Cómo funcionan los mensajes automáticos de WhatsApp?",
    a: "Mibarberia envía los mensajes desde su propio número de WhatsApp — tú no necesitas conectar ni ceder tu número personal. Simplemente activas el plan y el sistema manda confirmaciones, recordatorios y campañas de reactivación de forma automática.",
  },
  {
    q: "¿Qué pasa con los datos de mis clientes?",
    a: "Son exclusivamente tuyos. Cada barbería tiene sus datos completamente aislados, con cifrado y seguridad de nivel empresarial usando Supabase.",
  },
  {
    q: "¿Puedo probar antes de pagar?",
    a: "Claro. Tienes 7 días de prueba gratuita en todos los planes, sin necesidad de tarjeta de crédito.",
  },
  {
    q: "¿Qué diferencia hay entre el plan Profesional y Enterprise?",
    a: "Enterprise suma barberos y sucursales ilimitadas, 500 WhatsApps mensuales, exportación de datos a Excel, personalización de tu página de booking y soporte prioritario por WhatsApp.",
  },
];

/* ── Testimonios ──────────────────────────────────────────────────────────── */
const TESTIMONIOS = [
  {
    quote: "Los no-shows bajaron un 80% con los recordatorios automáticos. La plataforma se paga sola.",
    name: "Rodrigo V.",
    local: "Barbería Los Leones, Santiago",
    rating: 5,
  },
  {
    quote: "Antes perdía horas respondiendo WhatsApp. Ahora el sistema lo maneja todo y yo me concentro en cortar.",
    name: "Matías C.",
    local: "The Blade Room, Guadalajara",
    rating: 5,
  },
  {
    quote: "Mis clientes quedaron impresionados con lo profesional que se ve el sistema de reservas online.",
    name: "Sebastián M.",
    local: "Corte & Style, Bogotá",
    rating: 5,
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENTE
════════════════════════════════════════════════════════════════════════════ */
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* Antes/Después data */
const ANTES = [
  "Agenda en papel o en el chat de WhatsApp",
  "Clientes que olvidan sus turnos y no avisan",
  "Horas perdidas respondiendo mensajes",
  "Sin datos: no sabes cuánto ganas realmente",
  "Clientes que no vuelven y no sabes por qué",
];
const DESPUES = [
  "Agenda online accesible desde cualquier dispositivo",
  "Recordatorios automáticos 24 h y 1 h antes",
  "El sistema confirma, recuerda y gestiona solo",
  "Dashboard con ingresos, ocupación y métricas reales",
  "Reactivación automática de clientes inactivos",
];

/* ── Booking page mockup ───────────────────────────────────────────────────── */
function BookingMockup() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => (s + 1) % 3), 2800);
    return () => clearInterval(timer);
  }, []);

  const services = [
    { name: "Corte clásico", price: "$8.990",  mins: "30 min" },
    { name: "Corte + barba", price: "$14.990", mins: "50 min" },
    { name: "Degradado",     price: "$11.990", mins: "40 min" },
  ];
  const barbers = [
    { name: "Miguel",    rating: "4.9", cuts: "1.2k cortes" },
    { name: "Sebastián", rating: "4.8", cuts: "980 cortes"  },
    { name: "Tomás",     rating: "4.7", cuts: "830 cortes"  },
  ];
  const slots = ["10:00","10:30","11:00","11:30","14:00","14:30","15:00","16:00"];

  return (
    <div
      className="w-full max-w-[300px] mx-auto rounded-3xl overflow-hidden shadow-2xl"
      style={{
        backgroundColor: "#0A0A0A",
        border: "1px solid rgba(202,138,4,0.2)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(202,138,4,0.1)",
      }}
    >
      <div className="flex items-center justify-center py-3" style={{ backgroundColor: "#080808" }}>
        <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: "#1A1A1A" }} />
      </div>
      <div className="px-4 pt-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(202,138,4,0.15)" }}>
            <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white font-body leading-tight">El Clásico</p>
            <p className="text-xs" style={{ color: "#52525B" }}>mibarberia.site/demo/book</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {["Servicio","Barbero","Horario"].map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300"
                style={
                  i < step
                    ? { backgroundColor: "#CA8A04", color: "#000" }
                    : i === step
                    ? { backgroundColor: "rgba(202,138,4,0.15)", color: "#CA8A04", border: "1px solid #CA8A04" }
                    : { backgroundColor: "#1A1A1A", color: "#52525B" }
                }
              >
                {i < step ? <Check className="w-2.5 h-2.5" /> : <span style={{ fontSize: 9 }}>{i + 1}</span>}
              </div>
              <span className="text-xs font-body truncate" style={{ color: i === step ? "#CA8A04" : i < step ? "#52525B" : "#3F3F46", fontSize: 10 }}>
                {label}
              </span>
              {i < 2 && <div className="w-2 h-px flex-shrink-0" style={{ backgroundColor: i < step ? "rgba(202,138,4,0.4)" : "rgba(255,255,255,0.06)" }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 min-h-[220px]">
        {step === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-white font-body mb-1 px-1">Elige tu servicio</p>
            {services.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{
                  backgroundColor: i === 1 ? "rgba(202,138,4,0.08)" : "#111111",
                  border: i === 1 ? "1px solid rgba(202,138,4,0.25)" : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div>
                  <p className="text-xs font-medium text-white font-body">{s.name}</p>
                  <p className="text-xs" style={{ color: "#52525B" }}>{s.mins}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold font-body" style={{ color: i === 1 ? "#CA8A04" : "#71717A" }}>{s.price}</span>
                  {i === 1 && <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#CA8A04" }}><Check className="w-2 h-2 text-black" /></div>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-white font-body mb-1 px-1">Elige tu barbero</p>
            {barbers.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{
                  backgroundColor: i === 0 ? "rgba(202,138,4,0.08)" : "#111111",
                  border: i === 0 ? "1px solid rgba(202,138,4,0.25)" : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-black flex-shrink-0" style={{ backgroundColor: "#CA8A04" }}>
                  {b.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white font-body">{b.name}</p>
                  <p className="text-xs" style={{ color: "#52525B" }}>{b.cuts}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" style={{ color: "#CA8A04" }} />
                  <span className="text-xs font-bold" style={{ color: i === 0 ? "#CA8A04" : "#52525B" }}>{b.rating}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="text-xs font-semibold text-white font-body mb-3 px-1">Viernes 30 mayo · Miguel</p>
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map((slot, i) => (
                <motion.div
                  key={slot}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className="py-2 rounded-xl text-center"
                  style={{
                    backgroundColor: i === 2 ? "#CA8A04" : "#111111",
                    border: i === 2 ? "none" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="text-xs font-semibold font-body" style={{ color: i === 2 ? "#000" : i === 5 || i === 7 ? "#3F3F46" : "#A1A1AA" }}>
                    {slot}
                  </span>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-3 w-full py-2.5 rounded-xl text-center text-xs font-bold font-body"
              style={{ backgroundColor: "#CA8A04", color: "#000" }}
            >
              Confirmar turno →
            </motion.div>
          </div>
        )}
      </div>

      <div className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.12)" }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#25D366" }}>
          <MessageSquare className="w-2.5 h-2.5 text-white" />
        </div>
        <p className="text-xs font-body" style={{ color: "#71717A" }}>
          Confirmación automática por WhatsApp
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [openFaq,       setOpenFaq]       = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [scrolled,      setScrolled]      = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>

      {/* ════════════════════════════════════════════════════════════════
          NAVBAR FIJO
      ════════════════════════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={
          scrolled
            ? { backgroundColor: "rgba(0,0,0,0.90)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }
            : { backgroundColor: "transparent" }
        }
      >
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
            <span className="text-xl font-semibold tracking-tight text-white" style={{ fontFamily: "Cormorant, serif" }}>
              Mibarberia
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => scrollTo(link.id)}
                  className="text-sm font-medium transition-colors hover:text-white cursor-pointer"
                  style={{ color: "rgba(255,255,255,0.70)" }}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/demo/dashboard"
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: "#CA8A04", border: "1px solid rgba(202,138,4,0.3)", backgroundColor: "rgba(202,138,4,0.07)" }}
            >
              Ver demo
            </Link>
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Ingresar
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 rounded-full text-black text-sm font-semibold transition-all hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#CA8A04" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EAB308")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#CA8A04")}
            >
              Prueba gratis
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className="md:hidden mx-4 mb-3 rounded-2xl shadow-2xl p-5"
            style={{
              background: "rgba(8,8,8,0.97)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() => { scrollTo(link.id); setMobileOpen(false); }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <Link href="/demo/dashboard" className="text-center text-sm font-medium py-2.5 rounded-xl" style={{ color: "#CA8A04", backgroundColor: "rgba(202,138,4,0.08)", border: "1px solid rgba(202,138,4,0.2)" }}>
                Ver demo
              </Link>
              <Link href="/login" className="text-center text-sm font-medium text-white/60 py-2">Ingresar</Link>
              <Link href="/register" className="text-center px-4 py-2.5 rounded-full text-black text-sm font-semibold" style={{ backgroundColor: "#CA8A04" }}>
                Prueba gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
      <section id="inicio" className="relative min-h-screen overflow-hidden">

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1920&q=85&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden="true"
        />

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.95) 100%)" }}
        />

        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "200px",
          }}
        />

        {/* Orbs animados */}
        <motion.div
          className="absolute pointer-events-none"
          style={{ top: "20%", left: "5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(202,138,4,0.10) 0%, transparent 70%)", filter: "blur(50px)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute pointer-events-none"
          style={{ top: "30%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(202,138,4,0.07) 0%, transparent 70%)", filter: "blur(60px)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* ── Contenido hero ─────────────────────────────────────────── */}
        <div className="relative pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto">

            {/* Two-column layout on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-160px)]">

              {/* Left: copy */}
              <div className="flex flex-col justify-center">
                {/* Eyebrow */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold uppercase tracking-widest w-fit"
                  style={{ backgroundColor: "rgba(202,138,4,0.15)", border: "1px solid rgba(202,138,4,0.35)", color: "#CA8A04" }}
                >
                  <Scissors className="w-3 h-3" />
                  Software para Barberías
                </motion.div>

                {/* Títulos */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="leading-none tracking-tighter"
                  style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(3rem,7vw,6.5rem)", fontWeight: 400, color: "rgba(255,255,255,0.55)", textShadow: "0 2px 24px rgba(0,0,0,0.7)" }}
                >
                  Automatiza
                </motion.h1>
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="leading-none tracking-tighter text-white"
                  style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(3rem,7vw,6.5rem)", fontWeight: 600, marginTop: "-6px", textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
                >
                  tu barbería.
                </motion.h1>

                {/* Subtítulo */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
                  className="text-lg text-white/70 mt-5 mb-8 max-w-xl font-body font-light leading-relaxed"
                >
                  Reservas online, recordatorios automáticos por WhatsApp y recuperación de clientes inactivos — todo desde un solo panel.
                </motion.p>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                  className="flex items-center gap-4 flex-wrap"
                >
                  <Link
                    href="/register"
                    className="px-7 py-3 rounded-full text-black font-semibold text-sm transition-all hover:scale-105 font-body flex items-center gap-2 cursor-pointer"
                    style={{ backgroundColor: "#CA8A04" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EAB308")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#CA8A04")}
                  >
                    Empezar gratis
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => scrollTo("funciona")}
                    className="px-7 py-3 rounded-full font-medium text-sm transition-colors font-body cursor-pointer"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.10)",
                      border: "1px solid rgba(255,255,255,0.20)",
                      color: "#fff",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    Cómo funciona
                  </button>
                </motion.div>

                {/* Social proof mini */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="flex items-center gap-3 mt-8"
                >
                  <div className="flex -space-x-2">
                    {["JM","PC","SR","DT"].map((i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold text-black"
                        style={{ backgroundColor: "#CA8A04" }}
                      >
                        {i[0]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" style={{ color: "#CA8A04" }} />
                      ))}
                    </div>
                    <p className="text-white/55 text-xs font-body font-light mt-0.5">
                      +500 barberías confían en Mibarberia
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Right: product mockup */}
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex justify-center lg:justify-end"
              >
                <DashboardMockup />
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
              className="flex justify-center mt-4"
            >
              <div className="flex flex-col items-center gap-1.5 opacity-30">
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-5 h-5 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          SOCIAL PROOF METRICS BAR
      ════════════════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: "#080808", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "+500",    label: "Barberías activas",        icon: Scissors  },
              { value: "−80%",    label: "Menos no-shows",           icon: TrendingUp },
              { value: "10 min",  label: "Para configurar todo",     icon: Clock      },
              { value: "24 / 7",  label: "Sistema trabajando solo",  icon: Zap        },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.08}>
                <div className="flex flex-col items-center text-center gap-1">
                  <stat.icon className="w-4 h-4 mb-1" style={{ color: "#CA8A04" }} />
                  <span className="text-2xl font-bold text-white font-body">{stat.value}</span>
                  <span className="text-xs font-body font-light" style={{ color: "#52525B" }}>{stat.label}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════════════════
          TU LINK DE RESERVAS
      ════════════════════════════════════════════════════════════════ */}
      <section id="funciona" className="py-24 px-4 overflow-hidden" style={{ backgroundColor: "#050505" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left: animated booking mockup */}
            <FadeIn delay={0.2} className="flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="relative">
                <div
                  className="absolute inset-0 -z-10 rounded-full"
                  style={{ background: "radial-gradient(circle at center, rgba(202,138,4,0.12) 0%, transparent 70%)", filter: "blur(40px)", transform: "scale(1.3)" }}
                />
                <BookingMockup />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-4 -bottom-4 flex items-center gap-2 px-3 py-2 rounded-xl shadow-xl"
                  style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(34,197,94,0.25)" }}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold font-body text-white">Turno confirmado</span>
                </motion.div>
              </div>
            </FadeIn>

            {/* Right: copy */}
            <FadeUp className="order-1 lg:order-2">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 font-body text-gold">
                TU BARBERÍA ONLINE
              </p>
              <h2 className="text-4xl md:text-5xl font-display font-medium text-white tracking-tight mb-6 leading-tight">
                Tu link de reservas,<br />
                <span className="text-gradient-gold">listo en 10 minutos</span>
              </h2>
              <p className="text-base font-body font-light leading-relaxed mb-8" style={{ color: "#71717A" }}>
                Cada barbería recibe su propia página de booking en <strong className="text-white font-medium">mibarberia.site/book/tu-barberia</strong>. Tus clientes eligen servicio, barbero y horario en segundos — desde el celular, sin llamadas.
              </p>

              <div className="flex flex-col gap-4">
                {[
                  { icon: Scissors, text: "Servicios con precio y duración visibles" },
                  { icon: Users,    text: "Selección de barbero con fotos y rating" },
                  { icon: Calendar, text: "Solo muestra horarios disponibles en tiempo real" },
                  { icon: Bell,     text: "Confirmación automática por WhatsApp al instante" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
                      <item.icon className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
                    </div>
                    <span className="text-sm font-body font-light" style={{ color: "#A1A1AA" }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22C55E" }} />
                <span className="text-sm font-body font-light" style={{ color: "#52525B" }}>
                  Disponible 24/7 — tus clientes agendan aunque estés cortando
                </span>
              </div>

              <div className="mt-6">
                <Link
                  href="/demo/book"
                  target="_blank"
                  className="inline-flex items-center gap-2 text-sm font-semibold font-body transition-colors"
                  style={{ color: "#CA8A04" }}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  Ver demo de booking →
                </Link>
              </div>
            </FadeUp>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          ANTES / DESPUÉS
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-4" style={{ backgroundColor: "#000000" }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 font-body text-gold">
              LA DIFERENCIA
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-medium text-white tracking-tight">
              Sin Mibarberia vs<br />
              <span className="text-gradient-gold">con Mibarberia</span>
            </h2>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Antes */}
              <div className="rounded-2xl p-6" style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                    <X className="w-4 h-4" style={{ color: "#EF4444" }} />
                  </div>
                  <h3 className="text-sm font-semibold font-body" style={{ color: "#EF4444" }}>Sin Mibarberia</h3>
                </div>
                <ul className="flex flex-col gap-3">
                  {ANTES.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                        <X className="w-2.5 h-2.5" style={{ color: "#EF4444" }} />
                      </div>
                      <span className="text-sm font-body font-light leading-relaxed" style={{ color: "#71717A" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Después */}
              <div className="rounded-2xl p-6" style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(202,138,4,0.18)" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
                    <Check className="w-4 h-4" style={{ color: "#CA8A04" }} />
                  </div>
                  <h3 className="text-sm font-semibold font-body" style={{ color: "#CA8A04" }}>Con Mibarberia</h3>
                </div>
                <ul className="flex flex-col gap-3">
                  {DESPUES.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ backgroundColor: "rgba(202,138,4,0.1)" }}>
                        <Check className="w-2.5 h-2.5" style={{ color: "#CA8A04" }} />
                      </div>
                      <span className="text-sm font-body font-light leading-relaxed" style={{ color: "#A1A1AA" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeUp>

          {/* CTA inline */}
          <FadeUp delay={0.2} className="text-center mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-black font-semibold text-sm font-body transition-all hover:scale-105 cursor-pointer"
              style={{ backgroundColor: "#CA8A04" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EAB308")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#CA8A04")}
            >
              Quiero la versión con Mibarberia
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FUNCIONALIDADES
      ════════════════════════════════════════════════════════════════ */}
      <section id="beneficios" className="py-28 px-4" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 font-body text-gold">
              FUNCIONALIDADES
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-medium text-white tracking-tight">
              Todo lo que tu barbería<br />
              <span className="text-gradient-gold">necesita para crecer</span>
            </h2>
            <p className="mt-5 text-base max-w-xl mx-auto font-body font-light" style={{ color: "#71717A" }}>
              Diseñado para barberías modernas que quieren escalar sin complicarse con la administración.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.08}>
                <motion.div
                  className="p-6 rounded-2xl h-full"
                  style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
                  whileHover={{ borderColor: "rgba(202,138,4,0.2)", y: -4, backgroundColor: "#131313" }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: "rgba(202,138,4,0.1)" }}
                    whileHover={{ backgroundColor: "rgba(202,138,4,0.18)", scale: 1.05 }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: "#CA8A04" }} />
                  </motion.div>
                  <h3 className="text-base font-semibold text-white mb-2 font-body">{f.title}</h3>
                  <p className="text-sm leading-relaxed font-body font-light" style={{ color: "#71717A" }}>
                    {f.desc}
                  </p>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TESTIMONIOS
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4" style={{ backgroundColor: "#000000" }}>
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 font-body text-gold">
              LO QUE DICEN
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight">
              Barberías que ya crecieron con Mibarberia
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIOS.map((t, i) => (
              <FadeUp key={t.name} delay={i * 0.1}>
                <motion.div
                  className="p-6 rounded-2xl h-full flex flex-col"
                  style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}
                  whileHover={{ borderColor: "rgba(202,138,4,0.15)", y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.rating)].map((_, si) => (
                      <motion.span
                        key={si}
                        style={{ color: "#CA8A04" }}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + si * 0.07 }}
                        viewport={{ once: true }}
                      >
                        <Star className="w-3.5 h-3.5 fill-current inline" />
                      </motion.span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-5 font-body font-light italic flex-1" style={{ color: "#A1A1AA" }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-white font-body">{t.name}</p>
                    <p className="text-xs font-body" style={{ color: "#52525B" }}>{t.local}</p>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PLANES — 3 columnas
      ════════════════════════════════════════════════════════════════ */}
      <section id="planes" className="py-28 px-4" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 font-body text-gold">PLANES</p>
            <h2 className="text-4xl md:text-5xl font-display font-medium text-white tracking-tight">
              Precios transparentes
            </h2>
            <p className="mt-4 text-base font-body font-light" style={{ color: "#71717A" }}>
              7 días de prueba gratuita. Sin tarjeta de crédito.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-10">
            <div
              className="inline-flex rounded-2xl p-1 gap-1"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {(["monthly", "biannual", "annual"] as BillingPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setBillingPeriod(p)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold font-body transition-all cursor-pointer"
                  style={
                    billingPeriod === p
                      ? { backgroundColor: "#1A1A1A", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }
                      : { color: "#52525B" }
                  }
                >
                  {p === "monthly"  && "1 mes"}
                  {p === "biannual" && <><span>6 meses</span><span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22C55E" }}>20% OFF</span></>}
                  {p === "annual"   && <><span>1 año</span><span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#22C55E" }}>30% OFF</span></>}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid — 3 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* ── INDIVIDUAL ─────────────────────────────────────────── */}
            <FadeUp delay={0.05}>
              <div
                className="relative p-6 rounded-2xl flex flex-col gap-5 h-full"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest font-body mb-1" style={{ color: "#71717A" }}>Individual</p>
                  <p className="text-xs font-body mb-3" style={{ color: "#52525B" }}>Tu primer local, con el boost que necesitas</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-white font-body">${fmt(applyDiscount(BASE_PRICES.individual, billingPeriod))}</span>
                    <span className="text-xs mb-1 font-body" style={{ color: "#71717A" }}>CLP / mes</span>
                  </div>
                </div>
                <hr style={{ borderColor: "rgba(255,255,255,0.05)" }} />
                <ul className="flex flex-col gap-2.5 flex-1">
                  {["Agenda online profesional","Citas ilimitadas","Notificaciones por email","1 profesional","1 sucursal"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#CA8A04" }} />
                      <span className="text-sm font-body font-light" style={{ color: "#A1A1AA" }}>{f}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2.5 opacity-40">
                    <X className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#71717A" }} />
                    <span className="text-sm font-body font-light" style={{ color: "#71717A" }}>WhatsApp automático</span>
                  </li>
                </ul>
                <Link
                  href="/register"
                  className="w-full py-2.5 rounded-xl text-center text-sm font-bold font-body uppercase tracking-wider transition-all cursor-pointer hover:bg-white/5"
                  style={{ border: "1.5px solid rgba(255,255,255,0.12)", color: "#A1A1AA" }}
                >
                  Empezar →
                </Link>
              </div>
            </FadeUp>

            {/* ── PROFESIONAL (highlight) ─────────────────────────────── */}
            <FadeUp delay={0.1}>
              <div
                className="relative rounded-2xl flex flex-col h-full"
                style={{ border: "2px solid #CA8A04", background: "linear-gradient(180deg,#161000 0%,#111111 100%)" }}
              >
                <div
                  className="text-center py-1.5 text-xs font-bold uppercase tracking-widest font-body"
                  style={{ backgroundColor: "#CA8A04", color: "#000", borderRadius: "14px 14px 0 0" }}
                >
                  Más popular
                </div>
                <div className="p-6 flex flex-col gap-5 flex-1">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest font-body mb-1" style={{ color: "#CA8A04" }}>Profesional</p>
                    <p className="text-xs font-body mb-3" style={{ color: "#71717A" }}>El equipo crece, el caos no</p>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-white font-body">${fmt(applyDiscount(BASE_PRICES.profesional, billingPeriod))}</span>
                      <span className="text-xs mb-1 font-body" style={{ color: "#71717A" }}>CLP / mes</span>
                    </div>
                  </div>
                  <hr style={{ borderColor: "rgba(202,138,4,0.15)" }} />
                  <ul className="flex flex-col gap-2.5 flex-1">
                    {["Hasta 7 profesionales","1 sucursal","130 WhatsApps / mes","Notificaciones automáticas","Monitor en tiempo real","Recordatorios automáticos","CRM avanzado"].map((f) => (
                      <li key={f} className="flex items-center gap-2.5">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#CA8A04" }} />
                        <span className="text-sm font-body font-light" style={{ color: "#A1A1AA" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className="w-full py-2.5 rounded-xl text-center text-sm font-bold font-body uppercase tracking-wider transition-all hover:opacity-90 cursor-pointer"
                    style={{ backgroundColor: "#CA8A04", color: "#000" }}
                  >
                    Empezar →
                  </Link>
                </div>
              </div>
            </FadeUp>

            {/* ── ENTERPRISE ──────────────────────────────────────────── */}
            <FadeUp delay={0.15}>
              <div
                className="relative p-6 rounded-2xl flex flex-col gap-5 h-full"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest font-body mb-1" style={{ color: "#71717A" }}>Enterprise</p>
                  <p className="text-xs font-body mb-3" style={{ color: "#52525B" }}>Escala sin límites con todo incluido</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-white font-body">${fmt(applyDiscount(BASE_PRICES.enterprise, billingPeriod))}</span>
                    <span className="text-xs mb-1 font-body" style={{ color: "#71717A" }}>CLP / mes</span>
                  </div>
                </div>
                <hr style={{ borderColor: "rgba(255,255,255,0.05)" }} />
                <ul className="flex flex-col gap-2.5 flex-1">
                  {["Barberos ilimitados","Sucursales ilimitadas","500 WhatsApps / mes","Reportes avanzados","Exportar datos a Excel","Soporte prioritario WhatsApp","Personalización del booking"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#CA8A04" }} />
                      <span className="text-sm font-body font-light" style={{ color: "#A1A1AA" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="w-full py-2.5 rounded-xl text-center text-sm font-bold font-body uppercase tracking-wider transition-all cursor-pointer hover:bg-white/5"
                  style={{ border: "1.5px solid rgba(202,138,4,0.25)", color: "#CA8A04" }}
                >
                  Contactar →
                </Link>
              </div>
            </FadeUp>
          </div>

          {/* Nota de prueba */}
          <FadeIn delay={0.2} className="text-center mt-8">
            <p className="text-xs font-body" style={{ color: "#3F3F46" }}>
              Todos los planes incluyen 7 días de prueba gratuita · Sin tarjeta de crédito · Cancela cuando quieras
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-28 px-4" style={{ backgroundColor: "#000000" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 font-body text-gold">PREGUNTAS FRECUENTES</p>
            <h2 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight">
              Resolvemos tus dudas
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium text-white font-body">{faq.q}</span>
                  <span
                    className="text-xl leading-none flex-shrink-0 text-gold"
                    style={{
                      display: "inline-block",
                      transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm leading-relaxed font-body font-light" style={{ color: "#71717A" }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28 px-4 overflow-hidden" style={{ backgroundColor: "#0A0A0A" }}>
        {/* Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(202,138,4,0.07) 0%, transparent 70%)" }}
        />
        {/* Top border accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(202,138,4,0.5), transparent)" }} />

        <div className="max-w-3xl mx-auto text-center relative">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-widest mb-5 font-body text-gold">
              EMPIEZA HOY
            </p>
            <h2 className="text-4xl md:text-6xl font-display font-medium text-white tracking-tight mb-6 leading-tight">
              ¿Listo para modernizar<br />
              <span className="text-gradient-gold">tu barbería?</span>
            </h2>
            <p className="text-base mb-10 font-body font-light" style={{ color: "#71717A" }}>
              Únete a cientos de barberías que ya automatizan sus operaciones.<br />
              Prueba gratuita de 7 días — sin compromisos, sin tarjeta.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-black font-semibold text-sm font-body transition-all hover:scale-105 hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: "#CA8A04" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EAB308")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#CA8A04")}
              >
                Empezar gratis ahora
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-sm font-medium font-body transition-colors cursor-pointer"
                style={{ color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                Ya tengo una cuenta
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer
        className="py-10 px-8"
        style={{ backgroundColor: "#000000", borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-3.5 h-3.5 text-gold" />
            <span className="text-sm font-semibold font-display text-gold">Mibarberia</span>
          </div>
          <p className="text-xs font-body" style={{ color: "#3F3F46" }}>
            © {new Date().getFullYear()} Mibarberia. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            {["Privacidad", "Términos", "Soporte"].map((l) => (
              <a key={l} href="#" className="text-xs font-body hover:text-white transition-colors cursor-pointer" style={{ color: "#52525B" }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════
          STICKY MOBILE CTA — solo en pantallas pequeñas
      ════════════════════════════════════════════════════════════════ */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-4"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.90) 70%, transparent 100%)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
        }}
      >
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-black font-bold text-sm font-body transition-all active:scale-95 cursor-pointer"
          style={{ backgroundColor: "#CA8A04", boxShadow: "0 8px 24px rgba(202,138,4,0.4)" }}
        >
          Prueba 7 días gratis
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Spacer para que el sticky CTA no tape el footer en mobile */}
      <div className="md:hidden h-20" />
    </div>
  );
}
