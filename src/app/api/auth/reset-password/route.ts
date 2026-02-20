import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const BodySchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "At least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors.newPassword?.[0] || "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { token, newPassword } = parsed.data;

    const record = await prisma.authToken.findFirst({
      where: { token, type: "password_reset" },
    });
    if (!record || record.expiresAt < new Date()) {
      await prisma.authToken.deleteMany({ where: { token } });
      return NextResponse.json({ error: "Invalid or expired link. Request a new one." }, { status: 400 });
    }

    const passwordHash = await hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { passwordHash },
      }),
      prisma.authToken.deleteMany({ where: { id: record.id } }),
    ]);

    return NextResponse.json({ message: "Password updated. You can sign in now." });
  } catch (e) {
    console.error("Reset password error:", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
