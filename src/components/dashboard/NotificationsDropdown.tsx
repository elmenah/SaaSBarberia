"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Calendar, X, CheckCheck } from "lucide-react";
import Link from "next/link";

type Notif = {
  id: string;
  title: string;
  body: string;
  href: string;
  time: string;
  read: boolean;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export function NotificationsDropdown() {
  const [open,   setOpen]   = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al click afuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cargar notificaciones desde las últimas reservas
  useEffect(() => {
    if (!open || notifs.length > 0) return;
    setLoading(true);
    fetch("/api/appointments?pageSize=8&sort=desc")
      .then((r) => r.json())
      .then(({ data }) => {
        if (!Array.isArray(data)) return;
        setNotifs(
          data.map((a: {
            id: string;
            client?: { name?: string };
            services?: { service?: { name?: string } }[];
            startsAt: string;
            status: string;
          }) => ({
            id:    a.id,
            title: `Nueva reserva — ${a.client?.name ?? "Cliente"}`,
            body:  `${a.services?.[0]?.service?.name ?? "Servicio"} · ${new Date(a.startsAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
            href:  "/dashboard/reservas",
            time:  a.startsAt,
            read:  a.status !== "PENDING",
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, notifs.length]);

  const unread = notifs.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Bell className="w-4 h-4" style={{ color: unread > 0 ? "#CA8A04" : "#52525B" }} />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-black"
            style={{ backgroundColor: "#CA8A04" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-11 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm font-semibold text-white font-body">Notificaciones</p>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-body transition-colors hover:opacity-80"
                  style={{ color: "#CA8A04" }}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Leer todas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/5" style={{ color: "#52525B" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#CA8A04", borderTopColor: "transparent" }} />
              </div>
            ) : notifs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <Bell className="w-8 h-8" style={{ color: "#27272A" }} />
                <p className="text-sm font-body" style={{ color: "#3F3F46" }}>Sin notificaciones</p>
              </div>
            ) : (
              notifs.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => {
                    setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
                    setOpen(false);
                  }}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: n.read ? "rgba(255,255,255,0.04)" : "rgba(202,138,4,0.1)" }}
                  >
                    <Calendar className="w-4 h-4" style={{ color: n.read ? "#3F3F46" : "#CA8A04" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold font-body truncate" style={{ color: n.read ? "#71717A" : "#fff" }}>
                      {n.title}
                    </p>
                    <p className="text-xs font-body mt-0.5 truncate" style={{ color: "#52525B" }}>{n.body}</p>
                    <p className="text-[10px] font-body mt-1" style={{ color: "#3F3F46" }}>{timeAgo(n.time)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "#CA8A04" }} />
                  )}
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            href="/dashboard/reservas"
            onClick={() => setOpen(false)}
            className="block text-center py-3 text-xs font-semibold font-body transition-colors hover:opacity-80"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", color: "#CA8A04", backgroundColor: "#0D0D0D" }}
          >
            Ver todas las reservas →
          </Link>
        </div>
      )}
    </div>
  );
}
