"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight, Scissors } from "lucide-react";

export default function RegistroExitosoPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <Scissors className="w-5 h-5" style={{ color: "#CA8A04" }} />
        <span className="text-xl font-semibold tracking-tight text-white" style={{ fontFamily: "Cormorant, serif" }}>
          Mibarberia
        </span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl p-8 flex flex-col items-center text-center gap-6"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Icono */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: "#22C55E" }} />
        </div>

        {/* Texto */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Cormorant, serif" }}>
            ¡Cuenta creada con éxito!
          </h1>
          <p className="text-sm" style={{ color: "#71717A" }}>
            Tu barbería ya está lista. Tenés <span className="text-white font-medium">7 días gratis</span> para explorar todas las funciones profesionales.
          </p>
        </div>

        {/* Beneficios */}
        <ul className="w-full flex flex-col gap-2.5 text-left">
          {[
            "Reservas online activadas",
            "Panel de control listo para usar",
            "7 días con funciones Profesional incluidas",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#CA8A04" }} />
              <span className="text-sm" style={{ color: "#A1A1AA" }}>{item}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/setup"
          className="w-full py-3 rounded-xl text-center text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ backgroundColor: "#CA8A04", color: "#000" }}
        >
          Configurar mi barbería <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-xs" style={{ color: "#52525B" }}>
          Solo toma 2 minutos — luego ya puedes empezar a recibir reservas
        </p>
      </div>
    </div>
  );
}
