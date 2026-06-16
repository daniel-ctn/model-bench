import "server-only";

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Minimal email sender. Uses Resend when RESEND_API_KEY is set, otherwise logs
 * the message to the server console so password-reset flows work locally
 * without an email provider.
 */
export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "ModelBench <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `\n──────── email (dev) ────────\nTo: ${to}\nSubject: ${subject}\n\n${text}\n─────────────────────────────\n`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });
  if (!res.ok) {
    console.error("[email] Resend error:", res.status, await res.text());
  }
}
