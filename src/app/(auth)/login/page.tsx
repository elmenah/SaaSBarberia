"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email,         setEmail]        = useState("");
  const [password,      setPassword]     = useState("");
  const [show,          setShow]         = useState(false);
  const [loading,       setLoading]      = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  async function handleGoogle() {
    setLoadingGoogle(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error("Error al conectar con Google.");
      setLoadingGoogle(false);
    }
  }

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
          Mibarberia
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
          Mibarberia
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Bienvenido de vuelta</h1>
            <p className="text-sm" style={{ color: "#52525B" }}>Ingresa a tu cuenta para continuar</p>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loadingGoogle}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-3 transition-all hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.1)", color: "#E4E4E7" }}
          >
            {loadingGoogle ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2045c0-.638-.0573-1.252-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9082c1.7018-1.5668 2.6841-3.874 2.6841-6.6149z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9082-2.2581c-.8059.54-1.8368.8591-3.0482.8591-2.3441 0-4.3282-1.5832-5.036-3.7105H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71C3.7841 10.17 3.6818 9.5932 3.6818 9c0-.5932.1023-1.17.2822-1.71V4.9582H.9574A8.9961 8.9961 0 000 9c0 1.4518.3477 2.8264.9574 4.0418L3.964 10.71z" fill="#FBBC05"/>
                  <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
            <span className="text-xs" style={{ color: "#3F3F46" }}>o con tu email</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.07)" }} />
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
