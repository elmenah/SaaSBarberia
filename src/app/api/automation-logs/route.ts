import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/automation-logs?limit=5
export async function GET(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.barbershop) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");

  const logs = await prisma.automationLog.findMany({
    where:   { barbershopId: session.barbershop.id },
    orderBy: { createdAt: "desc" },
    take:    Math.min(limit, 100),
    include: {
      client: { select: { name: true } },
    },
  });

  return NextResponse.json({ data: logs });
}
