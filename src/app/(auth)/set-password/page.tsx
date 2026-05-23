"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Scissors, CheckCircle2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [sessionOk,   setSessionOk]   = useState<boolean | null>(null);

  // Supabase envía el token en el hash: #access_token=...&type=invite|recovery
  // El cliente de Supabase lo procesa automáticamente al montar
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSessionOk(!!data.session);
    });
  }, []);

  const strength = (() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8)               s++;
    if (/[A-Z]/.test(password))             s++;
    if (/[0-9]/.test(password))             s++;
    if (/[^A-Za-z0-9]/.test(password))     s++;
    return s;
  })();

  const strengthLabel = ["", "Débil", "Regular", "Buena", "Fuerte"][strength];
  const strengthColor = ["", "#EF4444", "#F59E0B", "#3B82F6", "#22C55E"][strength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      setDone(true);
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 1800);
    } catch {
      toast.error("Error inesperado. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  // Mientras verificamos la sesión
  if (sessionOk === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#000000" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#CA8A04" }} />
      </div>
    );
  }

  // Sin sesión activa (link expirado o acceso directo)
  if (sessionOk === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#000000" }}>
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-10">
            <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
            <span className="text-xl font-semibold tracking-tight" style={{ color: "#CA8A04", fontFamily: "Cormorant, serif" }}>
              Mibarberia
            </span>
          </div>
          <div
            className="p-8 rounded-2xl text-center"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
              <Lock className="w-7 h-7" style={{ color: "#EF4444" }} />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Link inválido o expirado</h2>
            <p className="text-sm mb-6" style={{ color: "#71717A" }}>
              El link de restablecimiento venció o ya fue usado. Solicitá uno nuevo.
            </p>
            <button
              onClick={() => router.push("/forgot-password")}
              className="w-full py-3 rounded-xl font-semibold text-black text-sm transition-all hover:opacity-90"
              style={{ backgroundColor: "#CA8A04" }}
            >
              Solicitar nuevo link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#000000" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
          <span className="text-xl font-semibold tracking-tight" style={{ color: "#CA8A04", fontFamily: "Cormorant, serif" }}>
            Mibarberia
          </span>
        </div>

        {done ? (
          /* ── Estado: contraseña guardada ── */
          <div
            className="flex flex-col items-center gap-4 p-8 rounded-2xl text-center"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(34,197,94,0.15)" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: "#22C55E" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">¡Contraseña guardada!</h2>
              <p className="text-sm" style={{ color: "#71717A" }}>
                Te estamos llevando al dashboard…
              </p>
            </div>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#CA8A04" }} />
          </div>
        ) : (
          /* ── Formulario ── */
          <div
            className="p-8 rounded-2xl"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="mb-6">
              <h1 className="text-xl font-bold text-white mb-1">Crear contraseña</h1>
              <p className="text-sm" style={{ color: "#52525B" }}>
                Elegí una contraseña segura para tu cuenta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "#71717A" }}>Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all"
                    style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.07)" }}
                    onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
                    onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#52525B" }}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all"
                          style={{ backgroundColor: i <= strength ? strengthColor : "rgba(255,255,255,0.08)" }}
                        />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "#71717A" }}>Confirmar contraseña</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repetí tu contraseña"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all"
                    style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.07)" }}
                    onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
                    onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#52525B" }}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirm.length > 0 && password !== confirm && (
                  <p className="text-xs" style={{ color: "#EF4444" }}>Las contraseñas no coinciden</p>
                )}
                {confirm.length > 0 && password === confirm && (
                  <p className="text-xs" style={{ color: "#22C55E" }}>Las contraseñas coinciden ✓</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm || password !== confirm}
                className="w-full py-3 rounded-xl font-semibold text-black text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                style={{ backgroundColor: "#CA8A04" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar contraseña"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
