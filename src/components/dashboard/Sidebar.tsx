"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, Scissors,
  Zap, Settings, LogOut, ChevronRight,
  UserCog, ClipboardList, BadgeCheck, Crown, Scissors as ScissorsIcon,
  CreditCard, AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useRole } from "@/lib/role-context";
import { useAuth } from "@/context/auth-context";
import { PushButton } from "@/components/pwa/PushButton";

const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratuito", STARTER: "Individual", PRO: "Profesional", ENTERPRISE: "Enterprise",
};

function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

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
  const { barbershop }    = useAuth();

  const isTrialing = barbershop?.subscriptionStatus === "TRIALING";
  const isActive   = barbershop?.subscriptionStatus === "ACTIVE";
  const daysLeft   = trialDaysLeft(barbershop?.trialEndsAt ?? null);
  const planLabel  = PLAN_LABELS[barbershop?.subscriptionPlan ?? "FREE"] ?? "Gratuito";
  const urgentTrial = isTrialing && daysLeft !== null && daysLeft <= 3;

  const navItems = role === "owner" ? NAV_OWNER : NAV_BARBER;

  async function handleLogout() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.replace("/login");
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

      {/* ── Plan / Trial badge ─────────────────────────────────────────── */}
      {barbershop && !collapsed && (
        <div className="px-3 pb-3">
          <Link
            href="/dashboard/billing"
            className="block rounded-xl p-3 transition-all hover:opacity-90"
            style={{
              backgroundColor: urgentTrial
                ? "rgba(239,68,68,0.07)"
                : isTrialing
                  ? "rgba(202,138,4,0.07)"
                  : "rgba(34,197,94,0.06)",
              border: urgentTrial
                ? "1px solid rgba(239,68,68,0.2)"
                : isTrialing
                  ? "1px solid rgba(202,138,4,0.18)"
                  : "1px solid rgba(34,197,94,0.15)",
            }}
          >
            {/* Fila superior: plan + días */}
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs font-semibold font-body"
                style={{ color: urgentTrial ? "#EF4444" : isTrialing ? "#CA8A04" : "#22C55E" }}
              >
                {planLabel}
              </span>
              {isTrialing && daysLeft !== null && (
                <div className="flex items-center gap-1">
                  {urgentTrial && <AlertTriangle className="w-3 h-3" style={{ color: "#EF4444" }} />}
                  <span
                    className="text-xs font-bold font-body"
                    style={{ color: urgentTrial ? "#EF4444" : "#CA8A04" }}
                  >
                    {daysLeft}d
                  </span>
                </div>
              )}
              {isActive && (
                <span className="text-xs font-body" style={{ color: "#22C55E" }}>Activo</span>
              )}
            </div>

            {/* Barra de progreso del trial */}
            {isTrialing && daysLeft !== null && (
              <>
                <div
                  className="h-1 rounded-full overflow-hidden mb-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((daysLeft / 7) * 100))}%`,
                      backgroundColor: urgentTrial ? "#EF4444" : "#CA8A04",
                    }}
                  />
                </div>
                <p className="text-xs font-body" style={{ color: urgentTrial ? "#EF4444" : "#71717A" }}>
                  {urgentTrial
                    ? `¡Expira en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}!`
                    : `${daysLeft} día${daysLeft !== 1 ? "s" : ""} de prueba restantes`}
                </p>
              </>
            )}
            {isActive && (
              <p className="text-xs font-body" style={{ color: "#3F3F46" }}>
                Renovación automática mensual
              </p>
            )}
          </Link>
        </div>
      )}

      {/* Icono compacto cuando está colapsado */}
      {barbershop && collapsed && (
        <div className="flex justify-center pb-2">
          <Link href="/dashboard/billing" title={`Plan ${planLabel}${isTrialing && daysLeft !== null ? ` — ${daysLeft}d` : ""}`}>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: urgentTrial ? "rgba(239,68,68,0.1)" : isTrialing ? "rgba(202,138,4,0.1)" : "rgba(34,197,94,0.08)",
                color: urgentTrial ? "#EF4444" : isTrialing ? "#CA8A04" : "#22C55E",
              }}
            >
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      )}

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

        {!collapsed && <PushButton />}

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
