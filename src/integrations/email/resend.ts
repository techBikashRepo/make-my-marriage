import "server-only";

import { getServerEnvironment } from "@/shared/config/env";

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  const { RESEND_API_KEY, EMAIL_FROM } = getServerEnvironment();
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    throw new Error("Password reset email is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [email],
      subject: "Reset your Make My Marriage password",
      text: `Use this link to reset your password: ${resetUrl}\n\nIf you did not request a reset, you can ignore this email.`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(
      `Password reset email provider returned ${response.status}`,
    );
  }
}
