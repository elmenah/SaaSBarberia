"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, ClipboardList, Users,
  UserCog, Scissors, Zap, Settings, Home, ChevronRight, Sparkles,
  MoreHorizontal, X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/* ── Nav items ───────────────────────────────────────────────────────────── */
const DEMO_NAV = [
  { label: "Dashboard",        href: "/demo/dashboard",                  icon: LayoutDashboard },
  { label: "Agenda",           href: "/demo/dashboard/agenda",           icon: Calendar        },
  { label: "Reservas",         href: "/demo/dashboard/reservas",         icon: ClipboardList   },
  { label: "Clientes",         href: "/demo/dashboard/clientes",         icon: Users           },
  { label: "Barbería",         href: "/demo/dashboard/barberos",         icon: UserCog         },
  { label: "Servicios",        href: "/demo/dashboard/servicios",        icon: Scissors        },
  { label: "Automatizaciones", href: "/demo/dashboard/automatizaciones", icon: Zap             },
];

const PAGE_TITLES: Record<string, string> = {
  "/demo/dashboard":                   "Dashboard",
  "/demo/dashboard/agenda":            "Agenda",
  "/demo/dashboard/reservas":          "Reservas",
  "/demo/dashboard/clientes":          "Clientes",
  "/demo/dashboard/barberos":          "Barbería",
  "/demo/dashboard/servicios":         "Servicios",
  "/demo/dashboard/automatizaciones":  "Automatizaciones",
  "/demo/dashboard/configuracion":     "Configuración",
};

/* ── Mobile nav principal ────────────────────────────────────────────────── */
const MOBILE_NAV_MAIN = [
  { href: "/demo/dashboard",          icon: LayoutDashboard, label: "Inicio"   },
  { href: "/demo/dashboard/agenda",   icon: Calendar,        label: "Agenda"   },
  { href: "/demo/dashboard/reservas", icon: ClipboardList,   label: "Reservas" },
  { href: "/demo/dashboard/barberos", icon: UserCog,         label: "Barbería" },
];

/* ── Mobile nav "Más" ────────────────────────────────────────────────────── */
const MOBILE_NAV_MORE = [
  { href: "/demo/dashboard/clientes",         icon: Users,     label: "Clientes"       },
  { href: "/demo/dashboard/servicios",        icon: Scissors,  label: "Servicios"      },
  { href: "/demo/dashboard/automatizaciones", icon: Zap,       label: "Automatizaciones" },
  { href: "/demo/dashboard/configuracion",    icon: Settings,  label: "Configuración"  },
];

/* ════════════════════════════════════════════════════════════════════════════
   DemoShell — layout completo para la demo sin autenticación
════════════════════════════════════════════════════════════════════════════ */
export function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen,  setMoreOpen]  = useState(false);
  const title = PAGE_TITLES[pathname] ?? "Demo";

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "#080808" }}>

      {/* ── Banner demo ───────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 z-50"
        style={{ backgroundColor: "#CA8A04" }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-black flex-shrink-0" />
          <span className="text-xs font-semibold text-black font-body hidden sm:block">
            Estás viendo la demo de Mibarberia con datos de ejemplo
          </span>
          <span className="text-xs font-semibold text-black font-body sm:hidden">
            Modo demo
          </span>
        </div>
        <Link
          href="/register"
          className="text-xs font-bold text-black px-3 py-1 rounded-lg transition-all hover:opacity-80 flex-shrink-0"
          style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
        >
          Crear cuenta gratis →
        </Link>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside
          className={cn(
            "hidden md:flex flex-col h-full flex-shrink-0 transition-all duration-300",
            collapsed ? "w-[60px]" : "w-[220px]"
          )}
          style={{ backgroundColor: "#080808", borderRight: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Logo */}
          <div
            className="flex items-center justify-between px-4 py-5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            {!collapsed && (
              <span className="text-sm font-bold tracking-tight" style={{ color: "#CA8A04" }}>
                Mibarberia
              </span>
            )}
            <button
              onClick={() => setCollapsed((v) => !v)}
              className={cn("w-6 h-6 rounded-md flex items-center justify-center", collapsed && "mx-auto")}
              style={{ color: "#3F3F46" }}
            >
              <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", !collapsed && "rotate-180")} />
            </button>
          </div>

          {/* Demo badge */}
          {!collapsed && (
            <div className="px-3 pt-3 pb-1">
              <div
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold font-body"
                style={{
                  backgroundColor: "rgba(202,138,4,0.1)",
                  color: "#CA8A04",
                  border: "1px solid rgba(202,138,4,0.2)",
                }}
              >
                <Sparkles className="w-3 h-3" />
                Modo Demo
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
            {DEMO_NAV.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]",
                    collapsed && "justify-center px-0"
                  )}
                  style={isActive ? { backgroundColor: "#161616" } : {}}
                >
                  <item.icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? "#CA8A04" : undefined }}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && isActive && (
                    <div className="ml-auto w-1 h-1 rounded-full" style={{ backgroundColor: "#CA8A04" }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div
            className="px-2 py-4 flex flex-col gap-0.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <Link
              href="/demo/dashboard/configuracion"
              title={collapsed ? "Configuración" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all",
                collapsed && "justify-center px-0"
              )}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Configuración</span>}
            </Link>
            <Link
              href="/"
              title={collapsed ? "Volver al inicio" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all",
                collapsed && "justify-center px-0"
              )}
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Volver al inicio</span>}
            </Link>
          </div>
        </aside>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* TopBar */}
          <header
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ backgroundColor: "#080808", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            {/* Mobile */}
            <div className="flex flex-col md:hidden">
              <p className="text-[10px] font-semibold uppercase tracking-widest font-body" style={{ color: "#CA8A04" }}>
                Barbería
              </p>
              <h1 className="text-base font-bold text-white font-body leading-tight">El Clásico</h1>
            </div>
            {/* Desktop */}
            <div className="hidden md:flex flex-col">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest font-body" style={{ color: "#CA8A04" }}>
                  El Clásico
                </p>
                <span className="text-[10px]" style={{ color: "#27272A" }}>·</span>
                <h1 className="text-[10px] font-semibold uppercase tracking-widest font-body" style={{ color: "#3F3F46" }}>
                  {title}
                </h1>
              </div>
              <p className="text-xs mt-0.5 font-body" style={{ color: "#27272A" }}>
                {new Date().toLocaleDateString("es-419", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-black transition-all hover:opacity-90"
                style={{ backgroundColor: "#CA8A04" }}
              >
                Usar en mi barbería
              </Link>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-black text-xs font-bold font-body"
                style={{ backgroundColor: "#CA8A04" }}
                title="Nicolás García (demo)"
              >
                NG
              </div>
            </div>
          </header>

          {/* Page content */}
          <main
            className="flex-1 overflow-y-auto p-4 md:p-6"
            style={{ backgroundColor: "#0A0A0A" }}
          >
            {children}
          </main>

          {/* ── Drawer "Más" ────────────────────────────────────────── */}
          {moreOpen && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
              <div
                className="absolute inset-0"
                style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                onClick={() => setMoreOpen(false)}
              />
              <div
                className="relative z-10 rounded-t-2xl pb-8 pt-4 px-4"
                style={{ backgroundColor: "#0F0F0F", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
                <div className="flex items-center justify-between mb-4 px-1">
                  <p className="text-sm font-semibold text-white font-body">Más opciones</p>
                  <button
                    onClick={() => setMoreOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#71717A" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {MOBILE_NAV_MORE.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all"
                        style={{
                          backgroundColor: isActive ? "rgba(202,138,4,0.1)" : "rgba(255,255,255,0.03)",
                          border: isActive ? "1px solid rgba(202,138,4,0.25)" : "1px solid rgba(255,255,255,0.06)",
                          color: isActive ? "#CA8A04" : "#71717A",
                        }}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-xs font-semibold font-body text-center leading-tight">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Mobile bottom nav ───────────────────────────────────────── */}
          <nav
            className="md:hidden flex items-stretch flex-shrink-0"
            style={{ backgroundColor: "#080808", borderTop: "1px solid rgba(255,255,255,0.07)", height: "60px" }}
          >
            {MOBILE_NAV_MAIN.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-all"
                  style={{
                    color:     isActive ? "#CA8A04" : "#3F3F46",
                    borderTop: isActive ? "2px solid #CA8A04" : "2px solid transparent",
                  }}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span className="text-[10px] font-semibold font-body leading-tight">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-all"
              style={{
                color:     moreOpen ? "#CA8A04" : "#3F3F46",
                borderTop: moreOpen ? "2px solid #CA8A04" : "2px solid transparent",
              }}
            >
              <MoreHorizontal className="w-[18px] h-[18px]" />
              <span className="text-[10px] font-semibold font-body leading-tight">Más</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
