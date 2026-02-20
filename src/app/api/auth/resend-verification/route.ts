import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { sendEmail, verificationEmailHtml, getBaseUrl } from "@/lib/email";

const BodySchema = z.object({ email: z.string().email() });

/**
 * POST /api/auth/resend-verification
 * Sends a new verification email for an existing unverified account.
 * Used by new users who didn't get the email or by existing users after we enabled verification for all.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }
    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { error: "This account is already verified. You can sign in." },
        { status: 400 }
      );
    }

    // Remove any existing verification tokens for this email
    await prisma.authToken.deleteMany({
      where: { email, type: "email_verification" },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.authToken.create({
      data: { email, token, type: "email_verification", expiresAt },
    });

    const link = `${getBaseUrl()}/tech/verify-email?token=${token}`;
    const sent = await sendEmail({
      to: email,
      subject: "Relectrikapp – Verify your email",
      html: verificationEmailHtml(link, user.name ?? undefined),
    });

    if (!sent.success) {
      return NextResponse.json(
        { error: sent.error ?? "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification email sent. Check your inbox and click the link.",
    });
  } catch (e) {
    console.error("Resend verification error:", e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
