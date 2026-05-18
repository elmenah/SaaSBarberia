"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Star, CheckCircle2 } from "lucide-react";

type ShopBasic = {
  id:      string;
  name:    string;
  logoUrl: string | null;
};

export default function ReviewPage() {
  const { slug }       = useParams<{ slug: string }>();
  const searchParams   = useSearchParams();
  const appointmentId  = searchParams.get("appt");

  const [shop,       setShop]       = useState<ShopBasic | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [rating,     setRating]     = useState(0);
  const [hover,      setHover]      = useState(0);
  const [comment,    setComment]    = useState("");
  const [name,       setName]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    fetch(`/api/book/${slug}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (data) setShop({ id: data.id, name: data.name, logoUrl: data.logoUrl });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shop || rating === 0) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barbershopId:  shop.id,
          appointmentId: appointmentId ?? undefined,
          clientName:    name.trim() || "Cliente anónimo",
          rating,
          comment:       comment.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Error al enviar la reseña");
        return;
      }
      setDone(true);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#080808" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#CA8A04", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#080808" }}>
        <p className="text-sm font-body" style={{ color: "#52525B" }}>Barbería no encontrada.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: "#080808" }}>
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <CheckCircle2 className="w-14 h-14" style={{ color: "#22C55E" }} />
          <h1 className="text-xl font-bold text-white font-body">¡Gracias por tu reseña!</h1>
          <p className="text-sm font-body" style={{ color: "#71717A" }}>
            Tu opinión ayuda a {shop.name} a seguir mejorando y a otros clientes a elegir con confianza.
          </p>
          <a href={`/book/${slug}`}
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold font-body text-black"
            style={{ backgroundColor: "#CA8A04" }}>
            Reservar otro turno
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: "#080808" }}>
      <div className="max-w-md mx-auto px-5 py-12">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: "rgba(202,138,4,0.12)", color: "#CA8A04" }}>
            {shop.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-bold text-white">{shop.name}</h1>
          <p className="text-sm mt-1" style={{ color: "#71717A" }}>¿Cómo fue tu experiencia?</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Estrellas */}
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#52525B" }}>Tu calificación</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className="w-10 h-10"
                    style={{
                      color: n <= (hover || rating) ? "#CA8A04" : "#27272A",
                      fill:  n <= (hover || rating) ? "#CA8A04" : "transparent",
                      transition: "all 0.1s",
                    }}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium" style={{ color: "#CA8A04", minHeight: "20px" }}>
              {(hover || rating) === 1 && "Muy malo"}
              {(hover || rating) === 2 && "Malo"}
              {(hover || rating) === 3 && "Regular"}
              {(hover || rating) === 4 && "Bueno"}
              {(hover || rating) === 5 && "¡Excelente!"}
            </p>
          </div>

          {/* Nombre (opcional) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#52525B" }}>
              Tu nombre <span style={{ color: "#3F3F46" }}>(opcional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Lucas M."
              className="w-full px-4 py-3 rounded-xl text-white text-sm bg-transparent outline-none"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
            />
          </div>

          {/* Comentario */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "#52525B" }}>
              Comentario <span style={{ color: "#3F3F46" }}>(opcional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Contanos cómo fue el servicio, la atención, el resultado..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl text-white text-sm bg-transparent outline-none resize-none"
              style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.07)" }}
            />
            <p className="text-xs mt-1 text-right" style={{ color: "#3F3F46" }}>{comment.length}/500</p>
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "#EF4444" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-black transition-all hover:opacity-90 disabled:opacity-30"
            style={{ backgroundColor: "#CA8A04" }}
          >
            {submitting ? "Enviando..." : "Enviar reseña"}
          </button>

        </form>

        <p className="text-center text-xs mt-6" style={{ color: "#27272A" }}>
          Powered by <span style={{ color: "#CA8A04" }}>BarberOS</span>
        </p>
      </div>
    </div>
  );
}
