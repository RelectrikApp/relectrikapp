/**
 * Email sending: Resend or console-only.
 *
 * - Resend: set RESEND_API_KEY (and optionally RESEND_FROM).
 * - If not set: links are only logged to the server console (dev-friendly).
 */

// Vercel sets VERCEL_URL; use it so reset/verify links point to the deployed app
const BASE_URL =
  process.env.NEXTAUTH_URL ||
  process.env.APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  "http://localhost:3000";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Relectrikapp <onboarding@resend.dev>";

function extractLinkFromHtml(html: string): string | null {
  const match = html.match(/href="(https?:\/\/[^"]+)"/);
  return match ? match[1] : null;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string }> {
  const link = extractLinkFromHtml(options.html);

  if (RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: RESEND_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      return { success: false, error: err };
    }
  }

  // Sin Resend: solo log (desarrollo)
  console.log("[Email] RESEND_API_KEY not set. Would send:", options.subject, "to", options.to);
  if (link) console.log("[Email] Link:", link);
  return { success: true };
}

export function verificationEmailHtml(link: string, name?: string): string {
  return `
    <p>Hi${name ? ` ${name}` : ""},</p>
    <p>Please verify your email to activate your Relectrikapp account.</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#FCAD46;color:#000;text-decoration:none;border-radius:8px;font-weight:600;">Verify email</a></p>
    <p>Or copy this link: ${link}</p>
    <p>This link expires in 24 hours.</p>
    <p>— Relectrikapp</p>
  `;
}

export function passwordResetEmailHtml(link: string, name?: string): string {
  return `
    <p>Hi${name ? ` ${name}` : ""},</p>
    <p>You requested a password reset for your Relectrikapp account.</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#FCAD46;color:#000;text-decoration:none;border-radius:8px;font-weight:600;">Reset password</a></p>
    <p>Or copy this link: ${link}</p>
    <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    <p>— Relectrikapp</p>
  `;
}

export function getBaseUrl(): string {
  return BASE_URL;
}
