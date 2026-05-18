"use client";

import { useState, useEffect } from "react";
import {
  Menu, X, ArrowRight, Check, Zap, Users, Calendar,
  BarChart3, MessageSquare, Shield, Scissors, Bell,
} from "lucide-react";
import Link from "next/link";

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
  if (period === "biannual") return Math.round(price * 0.80);
  if (period === "annual")   return Math.round(price * 0.70);
  return price;
}

function fmt(n: number) {
  return n.toLocaleString("es-CL");
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "¿Cuánto tiempo toma configurar BarberOS?",
    a: "Menos de 10 minutos. Creas la cuenta, cargas tus servicios y barberos, y ya puedes recibir reservas online.",
  },
  {
    q: "¿Necesito instalar algo en mi computadora?",
    a: "No. BarberOS funciona 100% en el navegador. Disponible desde cualquier dispositivo, sin instalaciones.",
  },
  {
    q: "¿Cómo funcionan los mensajes automáticos de WhatsApp?",
    a: "Conectamos tu número de WhatsApp en minutos. Tú defines los mensajes y horarios; el sistema los envía solo — recordatorios antes de cada cita, confirmaciones y campañas de reenganche.",
  },
  {
    q: "¿Qué pasa con los datos de mis clientes?",
    a: "Son exclusivamente tuyos. Cada barbería tiene sus datos completamente aislados, con cifrado y seguridad de nivel empresarial usando Supabase.",
  },
  {
    q: "¿Puedo probar antes de pagar?",
    a: "Claro. Tienes 14 días de prueba gratuita en todos los planes, sin necesidad de tarjeta de crédito.",
  },
];

/* ── Testimonios ──────────────────────────────────────────────────────────── */
const TESTIMONIOS = [
  {
    quote: "Los no-shows bajaron un 80% con los recordatorios automáticos. La plataforma se paga sola.",
    name: "Rodrigo V.",
    local: "Barbería Los Leones, Santiago",
  },
  {
    quote: "Antes perdía horas respondiendo WhatsApp. Ahora el sistema lo maneja todo y yo me concentro en cortar.",
    name: "Matías C.",
    local: "The Blade Room, Guadalajara",
  },
  {
    quote: "Mis clientes quedaron impresionados con lo profesional que se ve el sistema de reservas online.",
    name: "Sebastián M.",
    local: "Corte & Style, Bogotá",
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENTE
════════════════════════════════════════════════════════════════════════════ */
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          NAVBAR FIJO — aparece sobre todo el contenido
      ════════════════════════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={
          scrolled
            ? { backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }
            : { backgroundColor: "transparent" }
        }
      >
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
            <span className="text-xl font-semibold tracking-tight text-white" style={{ fontFamily: "Cormorant, serif" }}>
              BarberOS
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => scrollTo(link.id)}
                  className="text-sm font-medium transition-colors hover:text-white"
                  style={{ color: scrolled ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.80)" }}
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
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "#CA8A04", border: "1px solid rgba(202,138,4,0.3)", backgroundColor: "rgba(202,138,4,0.07)" }}
            >
              Ver demo
            </Link>
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Ingresar
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 rounded-full text-black text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: "#CA8A04" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EAB308")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#CA8A04")}
            >
              Prueba gratis
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
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
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                    onClick={() => { scrollTo(link.id); setMobileOpen(false); }}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-white/08 flex flex-col gap-2">
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
      <section id="inicio" className="relative h-screen overflow-hidden">

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1920&q=85&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden="true"
        />

        {/* Overlay — más oscuro para esta imagen de tonos cálidos */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.60) 40%, rgba(0,0,0,0.90) 100%)" }}
        />

        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "200px",
          }}
        />

        {/* ── Contenido hero ─────────────────────────────────────────── */}
        <div className="relative h-full flex flex-col pt-16">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center px-4 max-w-4xl mx-auto animate-fade-up">

              {/* Eyebrow */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold uppercase tracking-widest"
                style={{ backgroundColor: "rgba(202,138,4,0.15)", border: "1px solid rgba(202,138,4,0.35)", color: "#CA8A04" }}
              >
                <Scissors className="w-3 h-3" />
                Software para Barberías
              </div>

              {/* Títulos */}
              <h1
                className="leading-none tracking-tighter text-white/55"
                style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(3.5rem,9vw,7.5rem)", fontWeight: 400, textShadow: "0 2px 24px rgba(0,0,0,0.7)" }}
              >
                Automatiza
              </h1>
              <h1
                className="leading-none tracking-tighter text-white"
                style={{ fontFamily: "Cormorant, serif", fontSize: "clamp(3.5rem,9vw,7.5rem)", fontWeight: 600, marginTop: "-8px", textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
              >
                tu barbería.
              </h1>

              {/* Subtítulo */}
              <p
                className="text-lg md:text-xl text-white/70 mt-6 mb-8 max-w-2xl mx-auto font-body font-light"
                style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
              >
                Reservas online, recordatorios automáticos por WhatsApp y recuperación de clientes inactivos — todo desde un solo panel, sin complicaciones.
              </p>

              {/* CTAs */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a
                  href="#funciona"
                  className="px-6 py-2.5 rounded-full font-medium text-sm transition-colors font-body"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "#fff",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.22)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)")}
                >
                  Cómo funciona
                </a>
                <Link
                  href="/register"
                  className="px-6 py-2.5 rounded-full text-black font-semibold text-sm transition-all hover:scale-105 font-body flex items-center gap-2"
                  style={{ backgroundColor: "#CA8A04" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EAB308")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#CA8A04")}
                >
                  Empezar gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Social proof mini */}
              <div className="flex items-center justify-center gap-2 mt-10">
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
                <p className="text-white/60 text-xs font-body font-light">
                  +500 barberías ya lo usan
                </p>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="flex justify-center pb-8">
            <div className="flex flex-col items-center gap-1.5 opacity-40">
              <div className="w-px h-8 bg-white/60" style={{ animation: "pulse 2s infinite" }} />
              <p className="text-white/60 text-xs font-body tracking-widest uppercase">Scroll</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CÓMO FUNCIONA
      ════════════════════════════════════════════════════════════════ */}
      <section id="funciona" className="py-28 px-4" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 font-body text-gold">
              EN 3 PASOS
            </p>
            <h2 className="text-4xl md:text-5xl font-display font-medium text-white tracking-tight">
              Configuración en minutos,<br />resultados desde el primer día
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n: "01", title: "Configura en 10 minutos",   desc: "Cargas tus servicios, barberos y horarios. En minutos ya puedes recibir reservas — sin instalar nada."        },
              { n: "02", title: "Tus clientes agendan solos", desc: "Por WhatsApp, Instagram o tu link directo. El sistema confirma, recuerda y gestiona todo sin que intervengas." },
              { n: "03", title: "La barbería trabaja sola",   desc: "Clientes inactivos reciben promos automáticas. Tú ves las estadísticas y cobras. Nada más."                   },
            ].map((step) => (
              <div
                key={step.n}
                className="p-6 rounded-2xl"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-5xl font-display font-light mb-4" style={{ color: "rgba(202,138,4,0.25)" }}>
                  {step.n}
                </p>
                <h3 className="text-base font-semibold text-white mb-2 font-body">{step.title}</h3>
                <p className="text-sm leading-relaxed font-body font-light" style={{ color: "#71717A" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FUNCIONALIDADES
      ════════════════════════════════════════════════════════════════ */}
      <section id="beneficios" className="py-28 px-4" style={{ backgroundColor: "#000000" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl transition-all hover:border-yellow-600/20 group"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: "rgba(202,138,4,0.1)" }}
                >
                  <f.icon className="w-5 h-5" style={{ color: "#CA8A04" }} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2 font-body">{f.title}</h3>
                <p className="text-sm leading-relaxed font-body font-light" style={{ color: "#71717A" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TESTIMONIOS
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 font-body text-gold">
              LO QUE DICEN
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight">
              Barberías que ya crecieron con BarberOS
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIOS.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-sm" style={{ color: "#CA8A04" }}>★</span>
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5 font-body font-light italic" style={{ color: "#A1A1AA" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold text-white font-body">{t.name}</p>
                  <p className="text-xs font-body" style={{ color: "#52525B" }}>{t.local}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PLANES
      ════════════════════════════════════════════════════════════════ */}
      <section id="planes" className="py-28 px-4" style={{ backgroundColor: "#000000" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 font-body text-gold">PLANES</p>
            <h2 className="text-4xl md:text-5xl font-display font-medium text-white tracking-tight">
              Precios transparentes
            </h2>
            <p className="mt-4 text-base font-body font-light" style={{ color: "#71717A" }}>
              14 días de prueba gratuita. Sin tarjeta de crédito.
            </p>
          </div>

          {/* ── Billing toggle ─────────────────────────────────────────── */}
          <div className="flex justify-center mb-10">
            <div
              className="inline-flex rounded-2xl p-1 gap-1"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {(["monthly", "biannual", "annual"] as BillingPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setBillingPeriod(p)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold font-body transition-all"
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

          {/* ── Cards grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">

            {/* ── INDIVIDUAL ─────────────────────────────────────────── */}
            <div
              className="relative p-6 rounded-2xl flex flex-col gap-5"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest font-body mb-1" style={{ color: "#71717A" }}>Individual</p>
                <p className="text-xs font-body mb-3" style={{ color: "#52525B" }}>Tu primer local, con el boost que necesitas</p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-white font-body">${fmt(applyDiscount(BASE_PRICES.individual, billingPeriod))}</span>
                  <span className="text-xs mb-1 font-body" style={{ color: "#71717A" }}>/ 1 mes</span>
                </div>
              </div>
              <hr style={{ borderColor: "rgba(255,255,255,0.05)" }} />
              <p className="text-xs font-body font-medium" style={{ color: "#71717A" }}>Arranca digital hoy, sin complicaciones</p>
              <ul className="flex flex-col gap-2.5 flex-1">
                {["Agenda online profesional","Citas ilimitadas","1 profesional","1 sucursal"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#CA8A04" }} />
                    <span className="text-sm font-body font-light" style={{ color: "#A1A1AA" }}>{f}</span>
                  </li>
                ))}
                <li className="flex items-center gap-2.5 opacity-40">
                  <X className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#71717A" }} />
                  <span className="text-sm font-body font-light" style={{ color: "#71717A" }}>Sin WhatsApps</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="w-full py-2.5 rounded-xl text-center text-sm font-bold font-body uppercase tracking-wider transition-all"
                style={{ border: "1.5px solid rgba(255,255,255,0.12)", color: "#A1A1AA" }}
              >
                Suscríbete ya →
              </Link>
            </div>

            {/* ── PROFESIONAL (highlight) ─────────────────────────────── */}
            <div
              className="relative rounded-2xl flex flex-col"
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
                    <span className="text-xs mb-1 font-body" style={{ color: "#71717A" }}>/ 1 mes</span>
                  </div>
                </div>
                <hr style={{ borderColor: "rgba(202,138,4,0.15)" }} />
                <p className="text-xs font-body font-medium" style={{ color: "#A1A1AA" }}>Automatiza, escala y mantén el control sin esfuerzo</p>
                <ul className="flex flex-col gap-2.5 flex-1">
                  {["Hasta 7 profesionales","1 sucursal","130 WhatsApps/mes","Monitor en tiempo real","Recordatorios automáticos","CRM avanzado"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#CA8A04" }} />
                      <span className="text-sm font-body font-light" style={{ color: "#A1A1AA" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="w-full py-2.5 rounded-xl text-center text-sm font-bold font-body uppercase tracking-wider transition-all hover:opacity-90"
                  style={{ backgroundColor: "#CA8A04", color: "#000" }}
                >
                  Suscríbete ya →
                </Link>
              </div>
            </div>

            {/* ── ENTERPRISE ─────────────────────────────────────────── */}
            <div
              className="relative p-6 rounded-2xl flex flex-col gap-5"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest font-body mb-1" style={{ color: "#71717A" }}>Enterprise</p>
                <p className="text-xs font-body mb-3" style={{ color: "#52525B" }}>Múltiples sucursales, un solo sistema</p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-white font-body">${fmt(applyDiscount(BASE_PRICES.enterprise, billingPeriod))}</span>
                  <span className="text-xs mb-1 font-body" style={{ color: "#71717A" }}>/ 1 mes</span>
                </div>
              </div>
              <hr style={{ borderColor: "rgba(255,255,255,0.05)" }} />
              <p className="text-xs font-body font-medium" style={{ color: "#71717A" }}>Potencia real para barberías que no paran de crecer</p>
              <ul className="flex flex-col gap-2.5 flex-1">
                {["Hasta 10 profesionales","3 sucursales","500 WhatsApps/mes","Dominio personalizado","API access","Soporte prioritario"].map((f, i) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#CA8A04" }} />
                    <span className="text-sm font-body font-light" style={{ color: "#A1A1AA" }}>{f}</span>
                    {i === 3 && (
                      <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#EF4444" }}>HOT</span>
                    )}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="w-full py-2.5 rounded-xl text-center text-sm font-bold font-body uppercase tracking-wider transition-all"
                style={{ border: "1.5px solid rgba(255,255,255,0.12)", color: "#A1A1AA" }}
              >
                Suscríbete ya →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-28 px-4" style={{ backgroundColor: "#0A0A0A" }}>
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
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
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
                  <div className="px-5 pb-5 animate-fade-up">
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
      <section className="relative py-28 px-4 overflow-hidden" style={{ backgroundColor: "#000000" }}>
        {/* Glow de fondo */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(202,138,4,0.08) 0%, transparent 70%)" }}
        />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-display font-medium text-white tracking-tight mb-6">
            ¿Listo para modernizar<br />
            <span className="text-gradient-gold">tu barbería?</span>
          </h2>
          <p className="text-base mb-10 font-body font-light" style={{ color: "#71717A" }}>
            Únete a cientos de barberías que ya automatizan sus operaciones con BarberOS.<br />
            Prueba gratuita de 14 días — sin compromisos.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-black font-semibold text-sm font-body transition-all hover:scale-105 hover:opacity-90"
              style={{ backgroundColor: "#CA8A04" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EAB308")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#CA8A04")}
            >
              Empezar gratis ahora
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-sm font-medium font-body transition-colors"
              style={{ color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Ya tengo una cuenta
            </Link>
          </div>
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
            <span className="text-sm font-semibold font-display text-gold">BarberOS</span>
          </div>
          <p className="text-xs font-body" style={{ color: "#3F3F46" }}>
            © {new Date().getFullYear()} BarberOS. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            {["Privacidad", "Términos", "Soporte"].map((l) => (
              <a key={l} href="#" className="text-xs font-body hover:text-white transition-colors" style={{ color: "#52525B" }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
