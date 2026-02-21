import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendEmail, passwordResetEmailHtml, getBaseUrl } from "@/lib/email";

const BodySchema = z.object({ email: z.string().email() });

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
      return NextResponse.json({ message: "If an account exists, you will receive a reset link." });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.authToken.deleteMany({
      where: { email, type: "password_reset" },
    });
    await prisma.authToken.create({
      data: { email, token, type: "password_reset", expiresAt },
    });

    const link = `${getBaseUrl()}/tech/reset-password?token=${token}`;
    const { success, error } = await sendEmail({
      to: email,
      subject: "Relectrikapp – Reset your password",
      html: passwordResetEmailHtml(link, user.name ?? undefined),
    });

    if (!success) {
      console.error("Forgot password email error:", error);
      // Return Resend error message so user can fix config (e.g. invalid API key, domain not verified)
      return NextResponse.json(
        { error: error && typeof error === "string" ? error : "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "If an account exists, you will receive a reset link." });
  } catch (e) {
    console.error("Forgot password error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
