import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = Number(searchParams.get("size") ?? "192");

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: size * 0.2,
        }}
      >
        {/* Tijeras estilizadas */}
        <svg
          width={size * 0.58}
          height={size * 0.58}
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Aro superior izquierdo */}
          <circle cx="28" cy="28" r="14" stroke="#CA8A04" strokeWidth="7" fill="none" />
          {/* Aro inferior izquierdo */}
          <circle cx="28" cy="72" r="14" stroke="#CA8A04" strokeWidth="7" fill="none" />
          {/* Hoja superior */}
          <line x1="38" y1="21" x2="78" y2="61" stroke="#CA8A04" strokeWidth="7" strokeLinecap="round" />
          {/* Hoja inferior */}
          <line x1="38" y1="79" x2="78" y2="39" stroke="#CA8A04" strokeWidth="7" strokeLinecap="round" />
          {/* Punto de pivote */}
          <circle cx="58" cy="50" r="5" fill="#CA8A04" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
