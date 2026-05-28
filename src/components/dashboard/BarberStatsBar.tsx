"use client";

import { useEffect, useState } from "react";
import { Calendar, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type BarberStats = {
  turnosMes:  number;
  ingresosMes: number;
  user:        { name: string };
  colorTag:    string | null;
};

/**
 * Barra de stats mensuales del barbero autenticado.
 * Solo se muestra cuando el usuario tiene rol BARBER.
 */
export function BarberStatsBar() {
  const [stats,   setStats]   = useState<BarberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/barbers/me")
      .then((r) => r.json())
      .then(({ data }) => { if (data) setStats(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-4 animate-pulse"
        style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)", height: 80 }} />
    );
  }

  if (!stats) return null;

  const color = stats.colorTag ?? "#CA8A04";
  const nombre = stats.user.name.split(" ")[0]; // solo el primer nombre

  const items = [
    {
      label: "Turnos este mes",
      value: stats.turnosMes,
      icon:  Calendar,
      color: "#3B82F6",
    },
    {
      label: "Ingresos este mes",
      value: formatCurrency(stats.ingresosMes),
      icon:  DollarSign,
      color: "#22C55E",
    },
    {
      label: "Promedio por turno",
      value: stats.turnosMes > 0
        ? formatCurrency(Math.round(stats.ingresosMes / stats.turnosMes))
        : formatCurrency(0),
      icon:  TrendingUp,
      color: "#CA8A04",
    },
  ];

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: "#111111", border: `1px solid ${color}22` }}>
      <p className="text-xs font-semibold font-body" style={{ color: "#52525B" }}>
        Tus estadísticas de{" "}
        <span style={{ color }}>
          {new Date().toLocaleString("es-419", { month: "long" }).charAt(0).toUpperCase() +
           new Date().toLocaleString("es-419", { month: "long" }).slice(1)}
        </span>
        , {nombre}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1.5 p-3 rounded-xl"
            style={{ backgroundColor: "#0D0D0D" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: item.color + "18" }}>
              <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
            </div>
            <p className="text-base font-bold text-white font-body leading-none">{item.value}</p>
            <p className="text-xs font-body leading-tight" style={{ color: "#52525B" }}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
