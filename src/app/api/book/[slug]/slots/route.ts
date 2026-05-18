import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type DaySchedule = {
  enabled:   boolean;
  from:      string;
  to:        string;
  hasBreak:  boolean;
  breakFrom: string;
  breakTo:   string;
};

const toMins = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function generateSlots(
  day: DaySchedule,
  durationMins: number,
  occupied: string[],
  minStartMins: number   // mínimo en minutos desde medianoche (hora local de la barbería)
): string[] {
  const from   = day.from    || "09:00";
  const to     = day.to      || "20:00";
  const fromM  = toMins(from);
  const toM    = toMins(to);
  const bFromM = day.hasBreak && day.breakFrom ? toMins(day.breakFrom) : -1;
  const bToM   = day.hasBreak && day.breakTo   ? toMins(day.breakTo)   : -1;

  const slots: string[] = [];

  for (let m = fromM; m + durationMins <= toM; m += 15) {
    if (m < minStartMins) continue;

    // Verificar que TODOS los bloques de 15 min que necesita el servicio estén libres
    let blocked = false;
    for (let i = 0; i < durationMins; i += 15) {
      const bm     = m + i;
      const bh     = Math.floor(bm / 60);
      const bmn    = bm % 60;
      const blkStr = `${String(bh).padStart(2, "0")}:${String(bmn).padStart(2, "0")}`;

      // ¿Está ocupado por otra reserva?
      if (occupied.includes(blkStr)) { blocked = true; break; }
      // ¿Cae dentro del descanso?
      if (bFromM >= 0 && bm >= bFromM && bm < bToM) { blocked = true; break; }
    }

    if (!blocked) {
      const h   = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
  }

  return slots;
}

/**
 * Retorna la hora actual en una timezone específica como { hour, minute, dateStr }
 * donde dateStr es "YYYY-MM-DD" en esa timezone.
 */
function getNowInTimezone(tz: string): { hour: number; minute: number; dateStr: string } {
  const now   = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone:  tz,
    year:      "numeric",
    month:     "2-digit",
    day:       "2-digit",
    hour:      "2-digit",
    minute:    "2-digit",
    hour12:    false,
  }).formatToParts(now);

  const get  = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const hour = parseInt(get("hour"));   // 0–23 (Intl puede devolver 24 a medianoche, corregimos)
  return {
    hour:    hour === 24 ? 0 : hour,
    minute:  parseInt(get("minute")),
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/**
 * Convierte una fecha UTC a hora local de la timezone dada.
 */
function getTimeInTimezone(date: Date, tz: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   false,
  }).formatToParts(date);
  const get  = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const hour = parseInt(get("hour"));
  return { hour: hour === 24 ? 0 : hour, minute: parseInt(get("minute")) };
}

/**
 * Retorna el offset en ms entre UTC y la timezone dada usando Intl.DateTimeFormat.
 * Ejemplo: America/Santiago UTC-4 → -14400000
 */
function getTimezoneOffsetMs(tz: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year:   "numeric", month:  "2-digit", day:    "2-digit",
    hour:   "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const h   = parseInt(get("hour")); // puede ser 24 a medianoche
  const localMs = Date.UTC(
    parseInt(get("year")),
    parseInt(get("month")) - 1,
    parseInt(get("day")),
    h === 24 ? 0 : h,
    parseInt(get("minute")),
    parseInt(get("second")),
  );
  return localMs - date.getTime();
}

// GET /api/book/[slug]/slots?barberId=&date=&totalDuration=
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;
  const barberId      = searchParams.get("barberId");
  const date          = searchParams.get("date");       // YYYY-MM-DD
  const totalDuration = parseInt(searchParams.get("totalDuration") ?? "30");

  if (!barberId || !date) {
    return NextResponse.json({ error: "barberId y date son requeridos" }, { status: 400 });
  }

  const barbershop = await prisma.barbershop.findUnique({
    where: { slug },
    select: { id: true, settings: true, timezone: true },
  });

  if (!barbershop) {
    return NextResponse.json({ error: "Barbería no encontrada" }, { status: 404 });
  }

  // Obtener horario del día
  const settings  = barbershop.settings as Record<string, unknown> | null;
  const schedule  = (settings?.schedule ?? {}) as Record<string, DaySchedule>;
  const DAY_KEYS  = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const dayOfWeek = new Date(date + "T12:00:00").getDay(); // T12 evita offset
  const dayKey    = DAY_KEYS[dayOfWeek];
  const dayData   = schedule[dayKey];

  if (!dayData?.enabled) {
    return NextResponse.json({ data: { slots: [], closed: true, dayKey } });
  }

  // Calcular hora actual en la timezone de la barbería para filtrar slots pasados
  const tz       = barbershop.timezone ?? "America/Argentina/Buenos_Aires";
  const localNow = getNowInTimezone(tz);
  const isToday  = date === localNow.dateStr;

  // Rango del día en UTC teniendo en cuenta la timezone de la barbería
  // Usamos medianoche y fin del día expresados en esa timezone → convertimos a UTC
  const dayStartLocal = new Date(`${date}T00:00:00`);
  const dayEndLocal   = new Date(`${date}T23:59:59`);
  // Ajustar el offset: obtenemos la diferencia entre UTC y la timezone local del barbershop
  const offsetMs = getTimezoneOffsetMs(tz, dayStartLocal);
  const utcStart = new Date(dayStartLocal.getTime() - offsetMs);
  const utcEnd   = new Date(dayEndLocal.getTime()   - offsetMs);

  const existing = await prisma.appointment.findMany({
    where: {
      barberId,
      barbershopId: barbershop.id,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      startsAt: { gte: utcStart, lte: utcEnd },
    },
    select: { startsAt: true, totalDuration: true },
  });

  // Marcar slots ocupados — convertir startsAt a hora LOCAL de la barbería
  const occupied: string[] = [];
  for (const appt of existing) {
    const localTime = getTimeInTimezone(appt.startsAt, tz);
    const startMins = localTime.hour * 60 + localTime.minute;
    for (let i = 0; i < appt.totalDuration; i += 15) {
      const m2  = startMins + i;
      const h2  = Math.floor(m2 / 60);
      const mn2 = m2 % 60;
      occupied.push(`${String(h2).padStart(2, "0")}:${String(mn2).padStart(2, "0")}`);
    }
  }

  const MARGIN_MINS  = 30;
  const minStartMins = isToday
    ? localNow.hour * 60 + localNow.minute + MARGIN_MINS
    : 0;

  const slots = generateSlots(dayData, totalDuration, occupied, minStartMins);

  return NextResponse.json({ data: { slots, closed: false, dayKey } });
}
