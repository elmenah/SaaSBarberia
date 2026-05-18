"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, ClipboardList,
  Users, UserCog, BadgeCheck, Settings,
  Crown, Scissors as ScissorsIcon,
} from "lucide-react";
import { useRole } from "@/lib/role-context";

/* ── Nav items por rol ───────────────────────────────────────────────────── */
const NAV_OWNER = [
  { label: "Inicio",    href: "/dashboard",               icon: LayoutDashboard },
  { label: "Agenda",    href: "/dashboard/agenda",         icon: Calendar        },
  { label: "Reservas",  href: "/dashboard/reservas",       icon: ClipboardList   },
  { label: "Barberos",  href: "/dashboard/barberos",       icon: UserCog         },
  { label: "Config",    href: "/dashboard/configuracion",  icon: Settings        },
];

const NAV_BARBER = [
  { label: "Mi Agenda", href: "/dashboard/agenda",          icon: Calendar     },
  { label: "Reservas",  href: "/dashboard/reservas",        icon: ClipboardList },
  { label: "Mi Perfil", href: "/dashboard/barberos/perfil", icon: BadgeCheck   },
];

export function BottomNav() {
  const pathname       = usePathname();
  const { role, setRole } = useRole();
  const navItems       = role === "owner" ? NAV_OWNER : NAV_BARBER;

  return (
    <nav
      className="flex md:hidden items-stretch flex-shrink-0"
      style={{
        backgroundColor: "#080808",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        height: "60px",
      }}
    >
      {/* Ítems de navegación */}
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-all"
            style={{
              color: isActive ? "#CA8A04" : "#3F3F46",
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

      {/* Separador + toggle de rol */}
      <div
        className="flex flex-col items-center justify-center px-3 flex-shrink-0"
        style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => setRole(role === "owner" ? "barber" : "owner")}
          className="flex flex-col items-center justify-center gap-0.5 w-10 h-full transition-all"
          title={role === "owner" ? "Vista Dueño — cambiar a Barbero" : "Vista Barbero — cambiar a Dueño"}
          style={{ color: "#CA8A04" }}
        >
          {role === "owner"
            ? <Crown       className="w-4 h-4" />
            : <ScissorsIcon className="w-4 h-4" />
          }
          <span className="text-[9px] font-semibold font-body leading-tight">
            {role === "owner" ? "Dueño" : "Barbero"}
          </span>
        </button>
      </div>
    </nav>
  );
}
