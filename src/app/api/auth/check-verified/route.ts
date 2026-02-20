import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ verified: false });
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerifiedAt: true },
  });
  return NextResponse.json({ verified: !!user?.emailVerifiedAt });
}
