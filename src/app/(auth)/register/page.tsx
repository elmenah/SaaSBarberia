"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, Check, Scissors, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const PERKS = [
  "7 días de prueba gratuita, sin tarjeta",
  "Reservas online desde el primer día",
  "Notificaciones automáticas",
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
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [emailSent,     setEmailSent]     = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [touched,       setTouched]       = useState<Record<string, boolean>>({});

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const pwdRules = {
    length:   form.password.length >= 8,
    upper:    /[A-Z]/.test(form.password),
    number:   /[0-9]/.test(form.password),
  };
  const pwdStrength = Object.values(pwdRules).filter(Boolean).length; // 0-3
  const pwdStrengthColor = pwdStrength === 3 ? "#22C55E" : pwdStrength === 2 ? "#CA8A04" : "#EF4444";
  const pwdStrengthLabel = pwdStrength === 3 ? "Segura" : pwdStrength === 2 ? "Media" : "Débil";

  function handleBlur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Marcar todos como tocados para mostrar errores
    setTouched({ name: true, barbershopName: true, email: true, password: true });

    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error("Ingresa tu nombre completo");
      return;
    }
    if (!form.barbershopName.trim()) {
      toast.error("Ingresa el nombre de tu barbería");
      return;
    }
    if (!EMAIL_RE.test(form.email)) {
      toast.error("Ingresa un email válido");
      return;
    }
    if (!pwdRules.length) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
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
          <h1 className="text-2xl font-bold text-white mb-2">Revisa tu correo</h1>
          <p className="text-sm mb-6" style={{ color: "#71717A" }}>
            Te enviamos un link de confirmación a{" "}
            <span className="text-white font-medium">{form.email}</span>.
            Haz clic en el link para activar tu cuenta.
          </p>
          <p className="text-xs" style={{ color: "#3F3F46" }}>
            ¿No te llegó?{" "}
            <button
              className="underline transition-colors"
              style={{ color: "#CA8A04" }}
              onClick={() => setEmailSent(false)}
            >
              Vuelve a intentarlo
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
          Mibarberia
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Crear tu cuenta</h1>
            <p className="text-sm" style={{ color: "#52525B" }}>
              7 días gratis — sin tarjeta de crédito
            </p>
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
                Registrarse con Google
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

            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "#71717A" }}>Tu nombre</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nicolás García"
                minLength={2}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all"
                style={{
                  backgroundColor: "#111111",
                  border: touched.name && form.name.trim().length < 2
                    ? "1px solid rgba(239,68,68,0.5)"
                    : "1px solid rgba(255,255,255,0.07)",
                }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
                onBlur={(e)  => {
                  handleBlur("name");
                  e.currentTarget.style.border = form.name.trim().length < 2
                    ? "1px solid rgba(239,68,68,0.5)"
                    : "1px solid rgba(255,255,255,0.07)";
                }}
              />
              {touched.name && form.name.trim().length < 2 && (
                <p className="text-xs" style={{ color: "#EF4444" }}>Ingresa tu nombre completo</p>
              )}
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
                style={{
                  backgroundColor: "#111111",
                  border: touched.email && form.email && !EMAIL_RE.test(form.email)
                    ? "1px solid rgba(239,68,68,0.5)"
                    : "1px solid rgba(255,255,255,0.07)",
                }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
                onBlur={(e)  => {
                  handleBlur("email");
                  e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
                }}
              />
              {touched.email && form.email && !EMAIL_RE.test(form.email) && (
                <p className="text-xs" style={{ color: "#EF4444" }}>Ingresa un email válido (ej: nombre@correo.com)</p>
              )}
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
              {/* Barra de fuerza */}
              {form.password.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-0.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i < pwdStrength ? pwdStrengthColor : "rgba(255,255,255,0.06)" }} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      {[
                        { ok: pwdRules.length, label: "8+ caracteres" },
                        { ok: pwdRules.upper,  label: "Mayúscula" },
                        { ok: pwdRules.number, label: "Número" },
                      ].map(({ ok, label }) => (
                        <span key={label} className="text-xs flex items-center gap-1 font-body"
                          style={{ color: ok ? "#22C55E" : "#3F3F46" }}>
                          {ok ? "✓" : "·"} {label}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-semibold font-body" style={{ color: pwdStrengthColor }}>
                      {pwdStrengthLabel}
                    </span>
                  </div>
                </div>
              )}
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
              Al registrarte aceptas los{" "}
              <Link href="/terms" className="underline" style={{ color: "#52525B" }}>
                Términos de Servicio
              </Link>
            </p>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: "#52525B" }}>
            ¿Ya tienes cuenta?{" "}
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
            Mibarberia
          </span>
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#CA8A04" }}>
            ¿Por qué Mibarberia?
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

      </div>
    </div>
  );
}
