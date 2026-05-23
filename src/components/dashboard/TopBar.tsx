"use client";

import { useEffect, useState } from "react";
import { Search, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getInitials } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import { NotificationsDropdown } from "./NotificationsDropdown";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":                   "Dashboard",
  "/dashboard/agenda":            "Agenda",
  "/dashboard/reservas":          "Reservas",
  "/dashboard/clientes":          "Clientes",
  "/dashboard/barberos":          "Barbería",
  "/dashboard/servicios":         "Servicios",
  "/dashboard/automatizaciones":  "Automatizaciones",
  "/dashboard/metricas":          "Métricas",
  "/dashboard/configuracion":     "Configuración",
  "/dashboard/billing":           "Facturación",
};

export function TopBar() {
  const pathname = usePathname();
  const { user, barbershop, signOut } = useAuth();
  const title    = PAGE_TITLES[pathname] ?? "Mibarberia";

  const shopName = barbershop?.name ?? "Mi Barbería";
  const userName = user?.user_metadata?.name ?? "Usuario";
  const initials = getInitials(userName);

  const [cmdOpen, setCmdOpen] = useState(false);

  // Abrir con ⌘K o Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/login";
  }

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <header
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{
          backgroundColor: "#080808",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Título */}
        <div>
          <div className="flex flex-col md:hidden">
            <p className="text-[10px] font-semibold uppercase tracking-widest font-body" style={{ color: "#CA8A04" }}>
              Barbería
            </p>
            <h1 className="text-base font-bold text-white font-body leading-tight">{shopName}</h1>
          </div>
          <div className="hidden md:flex flex-col">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest font-body" style={{ color: "#CA8A04" }}>
                {shopName}
              </p>
              <span className="text-[10px]" style={{ color: "#27272A" }}>·</span>
              <h1 className="text-[10px] font-semibold uppercase tracking-widest font-body" style={{ color: "#3F3F46" }}>{title}</h1>
            </div>
            <p className="text-xs mt-0.5 font-body" style={{ color: "#27272A" }}>
              {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search — abre command palette */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors hover:border-white/10"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: "#3F3F46" }} />
            <span className="text-xs" style={{ color: "#3F3F46" }}>Buscar...</span>
            <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#1A1A1A", color: "#52525B" }}>
              ⌘K
            </kbd>
          </button>

          {/* Notificaciones */}
          <NotificationsDropdown />

          {/* Avatar + logout */}
          <div className="flex items-center gap-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-black text-xs font-bold cursor-pointer font-body"
              style={{ backgroundColor: "#CA8A04" }}
              title={userName}
            >
              {initials}
            </div>
            {user && (
              <button
                onClick={handleSignOut}
                title="Cerrar sesión"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                style={{ color: "#3F3F46" }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
