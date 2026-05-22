"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[PWA] Service worker registrado:", reg.scope);
      })
      .catch((err) => {
        console.warn("[PWA] Error al registrar service worker:", err);
      });
  }, []);

  return null;
}
