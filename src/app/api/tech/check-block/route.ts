import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const BodySchema = z.object({ email: z.string().email() });

/**
 * POST /api/tech/check-block
 * Comprueba si el técnico está bloqueado hasta 6am (sin revelar si el email existe).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ blocked: false });
    }
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email, role: "TECHNICIAN" },
      select: { blockedUntil: true },
    });
    const now = new Date();
    if (user?.blockedUntil && now < user.blockedUntil) {
      return NextResponse.json({
        blocked: true,
        blockedUntil: user.blockedUntil.toISOString(),
      });
    }
    return NextResponse.json({ blocked: false });
  } catch {
    return NextResponse.json({ blocked: false });
  }
}
