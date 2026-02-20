import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
  name: z.string().min(1, "Name required"),
  lastName: z.string().min(1, "Last name required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { email, password, name, lastName } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    const passwordHash = await hash(password, 12);
    const fullName = `${name} ${lastName}`.trim();

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: fullName,
        role: "TECHNICIAN",
        status: "ACTIVE",
        emailVerifiedAt: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Account created. You can sign in now.",
    });
  } catch (e) {
    console.error("Register error:", e);
    const message =
      process.env.NODE_ENV === "development" && e instanceof Error
        ? e.message
        : "Error creating account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
