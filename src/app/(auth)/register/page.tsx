"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, Check, Scissors, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const PERKS = [
  "14 días de prueba gratuita, sin tarjeta",
  "Reservas online desde el primer día",
  "Notificaciones automáticas por WhatsApp",
  "Soporte en tiempo real",
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name:           "",
    barbershopName: "",
    email:          "",
    password:       "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [emailSent,    setEmailSent]    = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!form.name.trim() || !form.barbershopName.trim()) {
      toast.error("Completá todos los campos");
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options: {
          data: {
            name:             form.name,
            barbershop_name:  form.barbershopName,
          },
        },
      });

      if (error) {
        toast.error(
          error.message === "User already registered"
            ? "Ya existe una cuenta con ese email"
            : error.message
        );
        return;
      }

      // Si Supabase devuelve sesión directa (email confirmation deshabilitado)
      if (data.session) {
        await fetch("/api/auth/register", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ name: form.name, barbershopName: form.barbershopName }),
        });
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Si requiere confirmación de email → mostrar pantalla de "revisá tu correo"
      setEmailSent(true);
    } catch {
      toast.error("Error inesperado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Pantalla post-registro: revisar email ───────────────────────────────── */
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: "#000000" }}>
        <div className="w-full max-w-sm text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "rgba(202,138,4,0.12)", border: "1px solid rgba(202,138,4,0.25)" }}
          >
            <Mail className="w-8 h-8" style={{ color: "#CA8A04" }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Revisá tu correo</h1>
          <p className="text-sm mb-6" style={{ color: "#71717A" }}>
            Te enviamos un link de confirmación a{" "}
            <span className="text-white font-medium">{form.email}</span>.
            Hacé clic en el link para activar tu cuenta.
          </p>
          <p className="text-xs" style={{ color: "#3F3F46" }}>
            ¿No te llegó?{" "}
            <button
              className="underline transition-colors"
              style={{ color: "#CA8A04" }}
              onClick={() => setEmailSent(false)}
            >
              Volvé a intentarlo
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ── Formulario de registro ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#000000" }}>

      {/* ── Left — Form ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <Link href="/" className="text-sm font-bold mb-10 lg:hidden" style={{ color: "#CA8A04" }}>
          BarberOS
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Crear tu cuenta</h1>
            <p className="text-sm" style={{ color: "#52525B" }}>
              14 días gratis — sin tarjeta de crédito
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "#71717A" }}>Tu nombre</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nicolás García"
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all"
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
                name="barbershopName"
                value={form.barbershopName}
                onChange={handleChange}
                placeholder="Barbería El Clásico"
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
                onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "#71717A" }}>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all"
                style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
                onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "#71717A" }}>Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all"
                  style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
                  onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
                  onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#52525B" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>Crear cuenta gratis <ArrowRight className="w-4 h-4" /></>
              }
            </button>

            <p className="text-center text-xs mt-1" style={{ color: "#3F3F46" }}>
              Al registrarte aceptás los{" "}
              <Link href="/terms" className="underline" style={{ color: "#52525B" }}>
                Términos de Servicio
              </Link>
            </p>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: "#52525B" }}>
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="font-medium transition-colors" style={{ color: "#CA8A04" }}>
              Ingresar
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right — Branding + Perks ───────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "#080808", borderLeft: "1px solid rgba(255,255,255,0.04)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
          <span className="text-xl font-semibold tracking-tight" style={{ color: "#CA8A04", fontFamily: "Cormorant, serif" }}>
            BarberOS
          </span>
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#CA8A04" }}>
            ¿Por qué BarberOS?
          </p>
          <h2 className="text-3xl font-light leading-snug text-white mb-8">
            La plataforma que tu<br />barbería merece
          </h2>
          <ul className="flex flex-col gap-4">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(202,138,4,0.12)" }}
                >
                  <Check className="w-3.5 h-3.5" style={{ color: "#CA8A04" }} />
                </div>
                <span className="text-sm" style={{ color: "#A1A1AA" }}>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-8">
          {[
            { v: "500+", l: "Barberías" },
            { v: "80%",  l: "Menos no-shows" },
            { v: "14d",  l: "Prueba gratis" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-2xl font-bold" style={{ color: "#CA8A04" }}>{s.v}</p>
              <p className="text-xs mt-0.5" style={{ color: "#52525B" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
