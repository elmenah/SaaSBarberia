import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ── Acciones disponibles ──────────────────────────────────────────────────────

export type AuditAction =
  | "APPOINTMENT_CREATED"
  | "APPOINTMENT_STATUS_CHANGED"
  | "APPOINTMENT_CANCELLED"
  | "BARBER_CREATED"
  | "BARBER_UPDATED"
  | "BARBER_DELETED"
  | "SERVICE_CREATED"
  | "SERVICE_UPDATED"
  | "SERVICE_DELETED"
  | "CLIENT_CREATED"
  | "CLIENT_UPDATED"
  | "SETTINGS_UPDATED"
  | "LOGO_UPDATED"
  | "PLAN_ACTIVATED"
  | "PLAN_CANCELLED";

type AuditParams = {
  barbershopId: string;
  userId:       string;
  action:       AuditAction;
  entity:       string;
  entityId?:    string;
  before?:      Prisma.InputJsonValue;
  after?:       Prisma.InputJsonValue;
  ipAddress?:   string;
  userAgent?:   string;
};

/**
 * Escribe un registro de auditoría de forma asíncrona (fire-and-forget).
 * Los errores se loguean pero nunca interrumpen el flujo principal.
 */
export function writeAuditLog(params: AuditParams): void {
  prisma.auditLog
    .create({ data: params })
    .catch((err) => console.error("[audit] Error escribiendo log:", err));
}

/**
 * Versión awaitable para cuando necesitás garantizar que el log se escribió.
 */
export async function writeAuditLogAsync(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (err) {
    console.error("[audit] Error escribiendo log:", err);
  }
}
