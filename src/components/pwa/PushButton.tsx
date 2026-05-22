"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "denied" | "subscribed" | "unsubscribed" | "loading";

export function PushButton() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "unsubscribed");
    });
  }, []);

  async function handleToggle() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;

      if (status === "subscribed") {
        // Desuscribir
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method:  "DELETE",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setStatus("unsubscribed");
        toast.success("Notificaciones desactivadas");
        return;
      }

      // Suscribir — pedir permiso si aún no fue otorgado
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        toast.error("Permiso denegado. Habilitalo en la configuración del navegador.");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          endpoint:  json.endpoint,
          keys:      json.keys,
          userAgent: navigator.userAgent,
        }),
      });

      setStatus("subscribed");
      toast.success("🔔 ¡Notificaciones activadas!");
    } catch (err) {
      console.error("[Push]", err);
      toast.error("Error al configurar notificaciones");
      setStatus("unsubscribed");
    }
  }

  if (status === "unsupported") return null;

  return (
    <button
      onClick={handleToggle}
      disabled={status === "loading" || status === "denied"}
      title={
        status === "subscribed"   ? "Desactivar notificaciones"
        : status === "denied"    ? "Permiso denegado en el navegador"
        : status === "loading"   ? "Cargando..."
        : "Activar notificaciones"
      }
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
      style={
        status === "subscribed"
          ? { backgroundColor: "rgba(202,138,4,0.12)", color: "#CA8A04", border: "1px solid rgba(202,138,4,0.2)" }
          : status === "denied"
          ? { backgroundColor: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }
          : { backgroundColor: "rgba(255,255,255,0.04)", color: "#71717A", border: "1px solid rgba(255,255,255,0.06)" }
      }
    >
      {status === "loading"    && <Loader2 className="w-4 h-4 animate-spin" />}
      {status === "subscribed" && <Bell    className="w-4 h-4" />}
      {(status === "unsubscribed" || status === "denied") && <BellOff className="w-4 h-4" />}

      <span>
        {status === "subscribed"   ? "Notificaciones activas"
        : status === "denied"     ? "Permiso denegado"
        : status === "loading"    ? "Cargando..."
        : "Activar notificaciones"}
      </span>
    </button>
  );
}
