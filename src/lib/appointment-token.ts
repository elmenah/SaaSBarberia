import { createHmac } from "crypto";

const SECRET = process.env.APPOINTMENT_TOKEN_SECRET ?? "mibarberia-default-secret-change-in-prod";

/**
 * Genera un token seguro para links públicos de confirmar/cancelar turno.
 * No requiere DB ni sesión — se verifica solo con HMAC.
 */
export function generateAppointmentToken(appointmentId: string, action: "confirm" | "cancel"): string {
  return createHmac("sha256", SECRET)
    .update(`${appointmentId}:${action}`)
    .digest("hex")
    .slice(0, 40);
}

export function verifyAppointmentToken(
  appointmentId: string,
  action: "confirm" | "cancel",
  token: string
): boolean {
  const expected = generateAppointmentToken(appointmentId, action);
  // Comparación en tiempo constante para evitar timing attacks
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

export function buildConfirmUrl(appointmentId: string): string {
  const token = generateAppointmentToken(appointmentId, "confirm");
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/appointments/${appointmentId}/confirm?token=${token}`;
}

export function buildCancelUrl(appointmentId: string): string {
  const token = generateAppointmentToken(appointmentId, "cancel");
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/appointments/${appointmentId}/cancel-by-client?token=${token}`;
}
