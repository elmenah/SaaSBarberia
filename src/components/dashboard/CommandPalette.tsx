"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Calendar, ClipboardList,
  Users, UserCog, Scissors, Zap, Settings, CreditCard, X,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Dashboard",        href: "/dashboard",                  icon: LayoutDashboard, group: "Páginas" },
  { label: "Agenda",           href: "/dashboard/agenda",           icon: Calendar,        group: "Páginas" },
  { label: "Reservas",         href: "/dashboard/reservas",         icon: ClipboardList,   group: "Páginas" },
  { label: "Clientes",         href: "/dashboard/clientes",         icon: Users,           group: "Páginas" },
  { label: "Barbería",         href: "/dashboard/barberos",         icon: UserCog,         group: "Páginas" },
  { label: "Servicios",        href: "/dashboard/servicios",        icon: Scissors,        group: "Páginas" },
  { label: "Automatizaciones", href: "/dashboard/automatizaciones", icon: Zap,             group: "Páginas" },
  { label: "Facturación",      href: "/dashboard/billing",          icon: CreditCard,      group: "Páginas" },
  { label: "Configuración",    href: "/dashboard/configuracion",    icon: Settings,        group: "Páginas" },
];

type Result = {
  label: string;
  href: string;
  icon: React.ElementType;
  group: string;
  sub?: string;
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router  = useRouter();
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<Result[]>(NAV_LINKS);
  const [active,  setActive]  = useState(0);

  // Filtrar resultados
  useEffect(() => {
    if (!query.trim()) {
      setResults(NAV_LINKS);
      setActive(0);
      return;
    }
    const q = query.toLowerCase();
    setResults(NAV_LINKS.filter((l) => l.label.toLowerCase().includes(q)));
    setActive(0);
  }, [query]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
      if (e.key === "ArrowUp")   setActive((a) => Math.max(a - 1, 0));
      if (e.key === "Enter" && results[active]) {
        router.push(results[active].href);
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active, router, onClose]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  if (!open) return null;

  function go(href: string) {
    router.push(href);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#52525B" }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar páginas..."
            className="flex-1 bg-transparent text-white text-sm outline-none font-body placeholder:text-zinc-600"
          />
          <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center" style={{ color: "#52525B" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-center py-8 text-sm font-body" style={{ color: "#3F3F46" }}>
              Sin resultados para &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.href}
                onClick={() => go(r.href)}
                onMouseEnter={() => setActive(i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                style={{ backgroundColor: active === i ? "rgba(202,138,4,0.08)" : "transparent" }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: active === i ? "rgba(202,138,4,0.12)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  <r.icon className="w-4 h-4" style={{ color: active === i ? "#CA8A04" : "#52525B" }} />
                </div>
                <div>
                  <p className="text-sm font-medium font-body" style={{ color: active === i ? "#fff" : "#A1A1AA" }}>
                    {r.label}
                  </p>
                  {r.sub && (
                    <p className="text-xs font-body" style={{ color: "#52525B" }}>{r.sub}</p>
                  )}
                </div>
                {active === i && (
                  <kbd className="ml-auto text-xs px-1.5 py-0.5 rounded font-body" style={{ backgroundColor: "#1A1A1A", color: "#52525B" }}>
                    ↵
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2.5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", backgroundColor: "#0D0D0D" }}
        >
          <span className="text-xs font-body flex items-center gap-1" style={{ color: "#3F3F46" }}>
            <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: "#1A1A1A" }}>↑↓</kbd> navegar
          </span>
          <span className="text-xs font-body flex items-center gap-1" style={{ color: "#3F3F46" }}>
            <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: "#1A1A1A" }}>↵</kbd> abrir
          </span>
          <span className="text-xs font-body flex items-center gap-1" style={{ color: "#3F3F46" }}>
            <kbd className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: "#1A1A1A" }}>Esc</kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
