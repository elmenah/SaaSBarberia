"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, Scissors, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });

      if (res.status === 429) {
        const { error } = await res.json().catch(() => ({}));
        toast.error(error ?? "Demasiados intentos. Esperá unos minutos.");
        return;
      }
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        toast.error(error ?? "Error inesperado. Intenta nuevamente.");
        return;
      }
      setSent(true);
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
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

        {sent ? (
          /* ── Estado: email enviado ── */
          <div
            className="flex flex-col items-center gap-4 p-8 rounded-2xl text-center"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(34,197,94,0.15)" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
              <CheckCircle2 className="w-7 h-7" style={{ color: "#22C55E" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">Revisa tu email</h2>
              <p className="text-sm leading-relaxed" style={{ color: "#71717A" }}>
                Te enviamos un link a <span className="text-white font-medium">{email}</span> para restablecer tu contraseña.
              </p>
            </div>
            <p className="text-xs" style={{ color: "#52525B" }}>
              ¿No lo ves? Revisa la carpeta de spam.
            </p>
            <Link
              href="/login"
              className="text-sm font-medium transition-colors"
              style={{ color: "#CA8A04" }}
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          /* ── Formulario ── */
          <div
            className="p-8 rounded-2xl"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="mb-6">
              <h1 className="text-xl font-bold text-white mb-1">Restablecer contraseña</h1>
              <p className="text-sm" style={{ color: "#52525B" }}>
                Ingresa tu email y te mandamos un link para crear una nueva contraseña.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "#71717A" }}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#3F3F46" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm placeholder:text-zinc-700 outline-none transition-all"
                    style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(255,255,255,0.07)" }}
                    onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(202,138,4,0.4)")}
                    onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)")}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 rounded-xl font-semibold text-black text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#CA8A04" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link de recuperación"}
              </button>
            </form>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 mt-5 text-sm transition-colors"
              style={{ color: "#52525B" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
