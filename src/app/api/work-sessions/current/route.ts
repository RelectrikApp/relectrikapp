import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/session";

/**
 * GET /api/work-sessions/current
 * Technician-only endpoint to get current active work session
 */
export async function GET() {
  const roleCheck = await requireRole(["TECHNICIAN"]);
  if (roleCheck) return roleCheck;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const workSession = await prisma.workSession.findFirst({
      where: {
        technicianId: session.user.id!,
        isActive: true,
      },
      include: {
        project: {
          select: {
            id: true,
            clientName: true,
            address: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    if (!workSession) {
      return NextResponse.json({ session: null, isActive: false });
    }

    return NextResponse.json({
      session: workSession,
      isActive: true,
    });
  } catch (error) {
    console.error("Error fetching current work session:", error);
    return NextResponse.json(
      { error: "Failed to fetch work session" },
      { status: 500 }
    );
  }
}
