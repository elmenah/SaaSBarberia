"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, XCircle, AlertCircle, Scissors } from "lucide-react";
import Link from "next/link";

const STATES = {
  confirmed: {
    icon: CheckCircle2,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.15)",
    title: "¡Turno confirmado!",
    message: "Gracias por confirmar. Te esperamos.",
  },
  cancelled: {
    icon: XCircle,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.15)",
    title: "Turno cancelado",
    message: "Tu turno fue cancelado. ¡Podés reservar cuando quieras!",
  },
  invalid: {
    icon: AlertCircle,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.15)",
    title: "Link inválido",
    message: "El link es inválido o ya fue utilizado.",
  },
  not_found: {
    icon: AlertCircle,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.15)",
    title: "Turno no encontrado",
    message: "No encontramos ese turno. Puede que ya haya sido cancelado.",
  },
  already_cancelled: {
    icon: XCircle,
    color: "#71717A",
    bg: "rgba(113,113,122,0.1)",
    border: "rgba(113,113,122,0.15)",
    title: "Ya estaba cancelado",
    message: "Este turno ya había sido cancelado anteriormente.",
  },
  already_completed: {
    icon: CheckCircle2,
    color: "#22C55E",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.15)",
    title: "Turno completado",
    message: "Este turno ya fue realizado. ¡Gracias por visitarnos!",
  },
} as const;

type StateKey = keyof typeof STATES;

function ResponseContent() {
  const searchParams = useSearchParams();
  const status   = (searchParams.get("status") ?? "invalid") as StateKey;
  const shopName = searchParams.get("shop") ?? "";
  const slug     = searchParams.get("slug") ?? "";

  const state = STATES[status] ?? STATES.invalid;
  const Icon  = state.icon;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#000000" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Scissors className="w-4 h-4" style={{ color: "#CA8A04" }} />
          <span className="text-xl font-semibold tracking-tight" style={{ color: "#CA8A04", fontFamily: "Cormorant, serif" }}>
            {shopName || "Mibarberia"}
          </span>
        </div>

        <div
          className="flex flex-col items-center gap-4 p-8 rounded-2xl text-center"
          style={{ backgroundColor: "#111111", border: `1px solid ${state.border}` }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: state.bg }}
          >
            <Icon className="w-8 h-8" style={{ color: state.color }} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-white mb-2">{state.title}</h1>
            <p className="text-sm leading-relaxed" style={{ color: "#71717A" }}>
              {state.message}
            </p>
          </div>

          {slug && (
            <Link
              href={`/book/${slug}`}
              className="w-full py-3 rounded-xl font-semibold text-black text-sm text-center transition-all hover:opacity-90 mt-2"
              style={{ backgroundColor: "#CA8A04" }}
            >
              Reservar nuevo turno
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppointmentResponsePage() {
  return (
    <Suspense>
      <ResponseContent />
    </Suspense>
  );
}
