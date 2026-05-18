"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : error.message
        );
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Error inesperado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#000000" }}>

      {/* ── Left branding panel ──────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "#080808", borderRight: "1px solid rgba(255,255,255,0.04)" }}
      >
        <Link href="/" className="text-sm font-bold tracking-tight" style={{ color: "#CA8A04" }}>
          BarberOS
        </Link>

        <div>
          <blockquote className="text-2xl font-light leading-relaxed mb-6" style={{ color: "#A1A1AA" }}>
            "Las automatizaciones me ahorran 3 horas por semana. Los no-shows bajaron un 80%."
          </blockquote>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-black text-sm font-bold"
              style={{ backgroundColor: "#CA8A04" }}
            >
              CR
            </div>
            <div>
              <p className="text-sm font-medium text-white">Carlos Rodríguez</p>
              <p className="text-xs" style={{ color: "#52525B" }}>Dueño — Barbería El Estilo, Córdoba</p>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {[
            { v: "500+", l: "Barberías" },
            { v: "98%",  l: "Satisfacción" },
            { v: "2x",   l: "Más reservas" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-2xl font-bold" style={{ color: "#CA8A04" }}>{s.v}</p>
              <p className="text-xs mt-0.5" style={{ color: "#52525B" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <Link href="/" className="text-sm font-bold mb-10 lg:hidden" style={{ color: "#CA8A04" }}>
          BarberOS
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Bienvenido de vuelta</h1>
            <p className="text-sm" style={{ color: "#52525B" }}>Ingresa a tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "#71717A" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all"
                style={{
                  backgroundColor: "#111111",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
                onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: "#71717A" }}>Contraseña</label>
                <Link href="/forgot-password" className="text-xs transition-colors" style={{ color: "#CA8A04" }}>
                  ¿Olvidaste?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all"
                  style={{
                    backgroundColor: "#111111",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
                  onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#52525B" }}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-black text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              style={{ backgroundColor: "#CA8A04" }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#EAB308")}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#CA8A04")}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Ingresar <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: "#52525B" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-medium transition-colors" style={{ color: "#CA8A04" }}>
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
