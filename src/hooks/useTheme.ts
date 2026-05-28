"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "barber-theme";
const DEFAULT: Theme = "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }
}

/** Inicializa el tema desde localStorage (sin flash). */
export function initThemeScript() {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === "light") document.documentElement.setAttribute("data-theme", "light");
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(DEFAULT);

  // Leer preferencia guardada al montar
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? DEFAULT;
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return { theme, setTheme, toggle, isDark: theme === "dark" };
}
