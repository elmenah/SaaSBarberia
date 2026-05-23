"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, ClipboardList,
  UserCog, BadgeCheck, CreditCard, MoreHorizontal,
  Users, Zap, Settings, X, Scissors as ScissorsIcon,
} from "lucide-react";
import { useState } from "react";

/* ── Nav principal (siempre visible) ─────────────────────────────────────── */
const NAV_MAIN = [
  { label: "Inicio",   href: "/dashboard",          icon: LayoutDashboard },
  { label: "Agenda",   href: "/dashboard/agenda",   icon: Calendar        },
  { label: "Reservas", href: "/dashboard/reservas", icon: ClipboardList   },
  { label: "Barbería", href: "/dashboard/barberos", icon: UserCog         },
];

/* ── Más opciones ────────────────────────────────────────────────────────── */
const NAV_MORE = [
  { label: "Clientes",           href: "/dashboard/clientes",         icon: Users        },
  { label: "Servicios",          href: "/dashboard/servicios",        icon: ScissorsIcon  },
  { label: "Automatizaciones",   href: "/dashboard/automatizaciones", icon: Zap          },
  { label: "Mi perfil barbero",  href: "/dashboard/barberos/perfil",  icon: BadgeCheck   },
  { label: "Facturación",        href: "/dashboard/billing",          icon: CreditCard   },
  { label: "Configuración",      href: "/dashboard/configuracion",    icon: Settings     },
];

export function BottomNav() {
  const pathname          = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* ── Drawer "Más" ─────────────────────────────────────────────────── */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setMoreOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative z-10 rounded-t-2xl pb-8 pt-4 px-4"
            style={{ backgroundColor: "#0F0F0F", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Handle */}
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
              {NAV_MORE.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <nav
        className="flex md:hidden items-stretch flex-shrink-0"
        style={{
          backgroundColor: "#080808",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          height: "60px",
        }}
      >
        {NAV_MAIN.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
              <span className="text-[10px] font-semibold font-body leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Botón "Más" */}
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
    </>
  );
}
