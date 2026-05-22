import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = Number(searchParams.get("size") ?? "192");
  const r    = size * 0.22;   // radio de los aros
  const sw   = size * 0.07;   // stroke-width
  const cx1  = size * 0.34;   // centro aro izquierdo X
  const cx2  = size * 0.66;   // centro aro derecho X
  const cy   = size * 0.30;   // centro Y de los aros
  const lx1  = size * 0.43;   // inicio hoja izquierda X
  const lx2  = size * 0.57;   // inicio hoja derecha X
  const ly   = size * 0.43;   // inicio hojas Y
  const lbx1 = size * 0.24;   // fin hoja izquierda X
  const lbx2 = size * 0.76;   // fin hoja derecha X
  const lby  = size * 0.78;   // fin hojas Y
  const lineY = size * 0.84;  // línea separadora Y

  return new ImageResponse(
    (
      <div
        style={{
          width:          size,
          height:         size,
          background:     "#0A0A0A",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          borderRadius:   size * 0.22,
          border:         `${size * 0.015}px solid rgba(202,138,4,0.45)`,
          position:       "relative",
          overflow:       "hidden",
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
          {/* Aro izquierdo */}
          <circle cx={cx1} cy={cy} r={r} stroke="#CA8A04" strokeWidth={sw} fill="none" />
          {/* Aro derecho */}
          <circle cx={cx2} cy={cy} r={r} stroke="#CA8A04" strokeWidth={sw} fill="none" />
          {/* Hoja izquierda */}
          <line x1={lx1} y1={ly} x2={lbx1} y2={lby} stroke="#CA8A04" strokeWidth={sw} strokeLinecap="round" />
          {/* Hoja derecha */}
          <line x1={lx2} y1={ly} x2={lbx2} y2={lby} stroke="#CA8A04" strokeWidth={sw} strokeLinecap="round" />
          {/* Línea separadora */}
          <line x1={size * 0.2} y1={lineY} x2={size * 0.8} y2={lineY} stroke="#CA8A04" strokeWidth={size * 0.015} opacity={0.6} />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
