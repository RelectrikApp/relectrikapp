import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/auth/verify-email?token=xxx
 * Called when user clicks the verification link in email.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const record = await prisma.authToken.findFirst({
      where: { token, type: "email_verification" },
    });
    if (!record || record.expiresAt < new Date()) {
      await prisma.authToken.deleteMany({ where: { token } });
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.$executeRaw`UPDATE "User" SET "emailVerifiedAt" = ${now}, "updatedAt" = ${now} WHERE "email" = ${record.email}`,
      prisma.authToken.deleteMany({ where: { id: record.id } }),
    ]);

    return NextResponse.json({ message: "Email verified. You can sign in now." });
  } catch (e) {
    console.error("Verify email error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
