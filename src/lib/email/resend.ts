import { Resend } from "resend";
import { ReactElement } from "react";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.EMAIL_FROM ?? "Mibarberia <noreply@Mibarberia.app>";

// ─── Helper genérico ────────────────────────────────────────────────────────
export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[];
  subject: string;
  react: ReactElement;
}) {
  const { data, error } = await resend.emails.send({
    from:    FROM_EMAIL,
    to,
    subject,
    react,
  });

  if (error) {
    console.error("[Resend] Error enviando email:", error);
    throw new Error(error.message);
  }

  return data;
}
