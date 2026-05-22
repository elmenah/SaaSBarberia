"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scissors, ArrowRight, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

const STEPS = [
  "Creando tu cuenta en el sistema...",
  "Configurando tu barbería...",
  "Listo — te llevamos al panel",
];

export default function SetupPage() {
  const router = useRouter();
  const { barbershop, loading: authLoading, refreshBarbershop } = useAuth();
  const [form, setForm] = useState({ name: "", barbershopName: "" });
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState(-1); // -1 = form visible

  // Si ya tiene barbería → mandar directo al dashboard
  useEffect(() => {
    if (!authLoading && barbershop) {
      router.replace("/dashboard");
    }
  }, [authLoading, barbershop, router]);

  // Pre-rellenar nombre desde metadata de Supabase si existe
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.replace("/login"); return; }
      const meta = user.user_metadata ?? {};
      setForm((prev) => ({
        name:           prev.name           || meta.name || "",
        barbershopName: prev.barbershopName || meta.barbershop_name || "",
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.barbershopName.trim()) {
      toast.error("Completá ambos campos");
      return;
    }

    setLoading(true);
    setStep(0);

    try {
      await new Promise((r) => setTimeout(r, 600));
      setStep(1);

      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: form.name, barbershopName: form.barbershopName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Error ${res.status}`);
      }

      setStep(2);
      await new Promise((r) => setTimeout(r, 700));

      // Refrescar el contexto de auth para que el DashboardShell encuentre la barbería
      await refreshBarbershop();
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      toast.error(message);
      setStep(-1);
      setLoading(false);
    }
  }

  /* ── Pantalla de progreso ─────────────────────────────────────────────────── */
  if (step >= 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#000000" }}>
        <div className="w-full max-w-sm text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ backgroundColor: "rgba(202,138,4,0.12)", border: "1px solid rgba(202,138,4,0.2)" }}
          >
            {step >= 2
              ? <Check className="w-8 h-8" style={{ color: "#CA8A04" }} />
              : <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#CA8A04" }} />
            }
          </div>

          <div className="flex flex-col gap-3">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-3 text-left">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500"
                  style={
                    step > i
                      ? { backgroundColor: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }
                      : step === i
                      ? { backgroundColor: "rgba(202,138,4,0.15)", border: "1px solid rgba(202,138,4,0.3)" }
                      : { backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {step > i
                    ? <Check className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
                    : step === i
                    ? <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#CA8A04" }} />
                    : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#27272A" }} />
                  }
                </div>
                <span
                  className="text-sm"
                  style={{ color: step >= i ? "#A1A1AA" : "#3F3F46" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulario ───────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#000000" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
          <span className="text-xl font-semibold tracking-tight" style={{ color: "#CA8A04", fontFamily: "Cormorant, serif" }}>
            Mibarberia
          </span>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Configurá tu barbería</h1>
          <p className="text-sm" style={{ color: "#52525B" }}>
            Solo necesitamos dos datos para dejarte listo en segundos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "#71717A" }}>Tu nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nicolás García"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all disabled:opacity-50"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
              onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
              onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
            />
          </div>

          {/* Nombre barbería */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "#71717A" }}>Nombre de tu barbería</label>
            <input
              type="text"
              value={form.barbershopName}
              onChange={(e) => setForm((p) => ({ ...p, barbershopName: e.target.value }))}
              placeholder="Barbería El Clásico"
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all disabled:opacity-50"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
              onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
              onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-black text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            style={{ backgroundColor: "#CA8A04" }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#EAB308")}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#CA8A04")}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <>Ingresar al panel <ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "#3F3F46" }}>
          ¿Cuenta equivocada?{" "}
          <form method="POST" action="/api/auth/signout" className="inline">
            <button
              type="submit"
              className="underline transition-colors"
              style={{ color: "#52525B" }}
            >
              Cerrá sesión e ingresá con otra
            </button>
          </form>
        </p>
      </div>
    </div>
  );
}
