"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, Scissors,
  Zap, Settings, LogOut, ChevronRight,
  UserCog, ClipboardList, BadgeCheck, Crown, Scissors as ScissorsIcon,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role-context";

/* ── Nav por rol ─────────────────────────────────────────────────────────── */
const NAV_OWNER = [
  { label: "Dashboard",        href: "/dashboard",                  icon: LayoutDashboard },
  { label: "Agenda",           href: "/dashboard/agenda",           icon: Calendar        },
  { label: "Reservas",         href: "/dashboard/reservas",         icon: ClipboardList   },
  { label: "Clientes",         href: "/dashboard/clientes",         icon: Users           },
  { label: "Mibarberia",         href: "/dashboard/Mibarberia",         icon: UserCog         },
  { label: "Servicios",        href: "/dashboard/servicios",        icon: Scissors        },
  { label: "Automatizaciones", href: "/dashboard/automatizaciones", icon: Zap             },
];

const NAV_BARBER = [
  { label: "Mi Agenda",   href: "/dashboard/agenda",          icon: Calendar     },
  { label: "Reservas",    href: "/dashboard/reservas",        icon: ClipboardList },
  { label: "Mi perfil",   href: "/dashboard/Mibarberia/perfil", icon: BadgeCheck   },
];

type Role = "owner" | "barber";

export function Sidebar() {
  const pathname        = usePathname();
  const router          = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { role, setRole } = useRole();

  const navItems = role === "owner" ? NAV_OWNER : NAV_BARBER;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full flex-shrink-0 transition-all duration-300",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
      style={{
        backgroundColor: "#080808",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
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
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
            collapsed && "mx-auto"
          )}
          style={{ color: "#3F3F46" }}
        >
          <ChevronRight
            className={cn("w-3.5 h-3.5 transition-transform", !collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Role switcher */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div
            className="flex rounded-xl p-0.5 gap-0.5"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {([
              { id: "owner",  label: "Dueño",   icon: Crown         },
              { id: "barber", label: "Barbero",  icon: ScissorsIcon  },
            ] as { id: Role; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setRole(id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold font-body transition-all"
                style={
                  role === id
                    ? { backgroundColor: "#CA8A04", color: "#000" }
                    : { color: "#3F3F46" }
                }
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed role indicator */}
      {collapsed && (
        <button
          onClick={() => setRole(role === "owner" ? "barber" : "owner")}
          className="mx-auto mt-2 w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(202,138,4,0.1)", color: "#CA8A04" }}
          title={role === "owner" ? "Vista Dueño" : "Vista Barbero"}
        >
          {role === "owner" ? <Crown className="w-4 h-4" /> : <ScissorsIcon className="w-4 h-4" />}
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/3",
                collapsed && "justify-center px-0"
              )}
              style={
                isActive
                  ? { backgroundColor: "#161616", color: "#fff" }
                  : {}
              }
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
        {role === "owner" && (
          <>
            <Link
              href="/dashboard/billing"
              title={collapsed ? "Facturación" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/3 transition-all",
                pathname.startsWith("/dashboard/billing") && "text-white",
                collapsed && "justify-center px-0"
              )}
              style={pathname.startsWith("/dashboard/billing") ? { backgroundColor: "#161616" } : {}}
            >
              <CreditCard
                className="w-4 h-4 flex-shrink-0"
                style={{ color: pathname.startsWith("/dashboard/billing") ? "#CA8A04" : undefined }}
              />
              {!collapsed && <span>Facturación</span>}
            </Link>
            <Link
              href="/dashboard/configuracion"
              title={collapsed ? "Configuración" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/3 transition-all",
                collapsed && "justify-center px-0"
              )}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Configuración</span>}
            </Link>
          </>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? "Salir" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all w-full",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
}
