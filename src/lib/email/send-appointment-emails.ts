import { createElement } from "react";
import { sendEmail } from "./resend";
import AppointmentConfirmationEmail from "@/emails/appointment-confirmation";
import NewAppointmentOwnerEmail     from "@/emails/new-appointment-owner";
import AppointmentCancelledEmail    from "@/emails/appointment-cancelled";
import AppointmentReminderEmail     from "@/emails/appointment-reminder";
import ReviewRequestEmail           from "@/emails/review-request";
import LoyaltyRewardEmail           from "@/emails/loyalty-reward";
import ReengagementEmail            from "@/emails/reengagement";
import BirthdayEmail                from "@/emails/birthday";

// ─── Tipos compartidos ───────────────────────────────────────────────────────
interface AppointmentEmailData {
  clientName:      string;
  clientEmail?:    string | null;
  clientPhone:     string;
  barbershopName:  string;
  barbershopEmail?: string | null; // email del dueño para recibir avisos
  barbershopAddress?: string | null;
  barberName:      string;
  serviceName:     string;
  startsAt:        Date;
  totalPrice:      number;
  slug?:           string;  // para armar el link de nueva reserva
  source?:         string;
}

// ─── 1. Confirmación al cliente ───────────────────────────────────────────────
export async function sendConfirmationToClient(data: AppointmentEmailData) {
  if (!data.clientEmail) return; // sin email no se envía

  const bookingUrl = data.slug
    ? `${process.env.NEXT_PUBLIC_APP_URL}/book/${data.slug}`
    : undefined;

  await sendEmail({
    to:      data.clientEmail,
    subject: `✅ Turno confirmado en ${data.barbershopName}`,
    react:   createElement(AppointmentConfirmationEmail, {
      clientName:       data.clientName,
      barbershopName:   data.barbershopName,
      barbershopAddress: data.barbershopAddress ?? undefined,
      barberName:       data.barberName,
      serviceName:      data.serviceName,
      startsAt:         data.startsAt,
      totalPrice:       data.totalPrice,
      bookingUrl,
    }),
  });
}

// ─── 2. Aviso de nueva reserva al dueño ──────────────────────────────────────
export async function sendNewAppointmentToOwner(data: AppointmentEmailData) {
  if (!data.barbershopEmail) return;

  await sendEmail({
    to:      data.barbershopEmail,
    subject: `Nueva reserva — ${data.clientName} (${data.barbershopName})`,
    react:   createElement(NewAppointmentOwnerEmail, {
      barbershopName: data.barbershopName,
      clientName:     data.clientName,
      clientPhone:    data.clientPhone,
      clientEmail:    data.clientEmail,
      barberName:     data.barberName,
      serviceName:    data.serviceName,
      startsAt:       data.startsAt,
      totalPrice:     data.totalPrice,
      source:         data.source ?? "web",
    }),
  });
}

// ─── 3. Cancelación al cliente ────────────────────────────────────────────────
export async function sendCancellationToClient(
  data: AppointmentEmailData & { cancelReason?: string }
) {
  if (!data.clientEmail) return;

  const bookingUrl = data.slug
    ? `${process.env.NEXT_PUBLIC_APP_URL}/book/${data.slug}`
    : undefined;

  await sendEmail({
    to:      data.clientEmail,
    subject: `Reserva Cancelada — ${data.barbershopName}`,
    react:   createElement(AppointmentCancelledEmail, {
      clientName:     data.clientName,
      barbershopName: data.barbershopName,
      barberName:     data.barberName,
      serviceName:    data.serviceName,
      startsAt:       data.startsAt,
      cancelReason:   data.cancelReason,
      bookingUrl,
    }),
  });
}

// ─── Helper combinado: envía confirmación al cliente + aviso al dueño ─────────
export async function sendNewAppointmentEmails(data: AppointmentEmailData) {
  await Promise.allSettled([
    sendConfirmationToClient(data),
    sendNewAppointmentToOwner(data),
  ]);
}

// ─── 4. Recordatorio 24h o 1h ────────────────────────────────────────────────
export async function sendReminderToClient(
  data: AppointmentEmailData & { hoursAhead: number }
) {
  if (!data.clientEmail) return;
  const label = data.hoursAhead === 1 ? "en 1 hora" : "mañana";
  await sendEmail({
    to:      data.clientEmail,
    subject: `⏰ Recordatorio: tu turno en ${data.barbershopName} es ${label}`,
    react:   createElement(AppointmentReminderEmail, {
      clientName:       data.clientName,
      barbershopName:   data.barbershopName,
      barbershopAddress: data.barbershopAddress ?? undefined,
      barberName:       data.barberName,
      serviceName:      data.serviceName,
      startsAt:         data.startsAt,
      totalPrice:       data.totalPrice,
      hoursAhead:       data.hoursAhead,
      bookingUrl:       data.slug ? `${process.env.NEXT_PUBLIC_APP_URL}/book/${data.slug}` : undefined,
    }),
  });
}

// ─── 5. Solicitud de reseña post-servicio ────────────────────────────────────
export async function sendReviewRequest({
  clientName,
  clientEmail,
  barbershopName,
  barbershopId,
  barbershopSlug,
  barberName,
  serviceName,
  appointmentId,
}: {
  clientName:     string;
  clientEmail:    string;
  barbershopName: string;
  barbershopId:   string;
  barbershopSlug: string;
  barberName:     string;
  serviceName:    string;
  appointmentId:  string;
}) {
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${barbershopSlug}?appt=${appointmentId}`;
  await sendEmail({
    to:      clientEmail,
    subject: `⭐ ¿Cómo te fue en ${barbershopName}? Dejanos tu opinión`,
    react:   createElement(ReviewRequestEmail, {
      clientName, barbershopName, barberName, serviceName, reviewUrl,
    }),
  });
}

// ─── 6. Premio de fidelización (corte #5 gratis / corte #10 descuento) ────────
export async function sendLoyaltyReward({
  clientName,
  clientEmail,
  barbershopName,
  barbershopSlug,
  totalVisits,
}: {
  clientName:     string;
  clientEmail:    string;
  barbershopName: string;
  barbershopSlug: string;
  totalVisits:    number;
}) {
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${barbershopSlug}`;
  const isMilestone = totalVisits % 5 === 0;
  if (!isMilestone) return;

  const label = totalVisits % 10 === 0 ? `corte #${totalVisits} — descuento` : `corte #${totalVisits} — ¡el próximo es gratis!`;
  await sendEmail({
    to:      clientEmail,
    subject: `🎉 ${label} — ${barbershopName}`,
    react:   createElement(LoyaltyRewardEmail, {
      clientName, barbershopName, totalVisits, bookingUrl,
    }),
  });
}

// ─── 7. Reactivación cliente inactivo 30d ─────────────────────────────────────
export async function sendReengagement({
  clientName,
  clientEmail,
  barbershopName,
  barbershopSlug,
  daysSinceVisit,
}: {
  clientName:     string;
  clientEmail:    string;
  barbershopName: string;
  barbershopSlug: string;
  daysSinceVisit: number;
}) {
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${barbershopSlug}`;
  await sendEmail({
    to:      clientEmail,
    subject: `Te extrañamos en ${barbershopName} 💈`,
    react:   createElement(ReengagementEmail, {
      clientName, barbershopName, daysSinceVisit, bookingUrl,
    }),
  });
}

// ─── 8. Felicitación de cumpleaños ────────────────────────────────────────────
export async function sendBirthdayEmail({
  clientName,
  clientEmail,
  barbershopName,
  barbershopSlug,
}: {
  clientName:     string;
  clientEmail:    string;
  barbershopName: string;
  barbershopSlug: string;
}) {
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${barbershopSlug}`;
  await sendEmail({
    to:      clientEmail,
    subject: `🎂 ¡Feliz cumpleaños, ${clientName}! — ${barbershopName}`,
    react:   createElement(BirthdayEmail, { clientName, barbershopName, bookingUrl }),
  });
}
