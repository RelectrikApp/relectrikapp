import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/session";

/**
 * POST /api/work-sessions/end
 * Technician-only endpoint to end a work session
 */
export async function POST(request: Request) {
  const roleCheck = await requireRole(["TECHNICIAN"]);
  if (roleCheck) return roleCheck;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sessionId } = body;

    // Find active work session for this technician
    const workSession = await prisma.workSession.findFirst({
      where: {
        id: sessionId || undefined,
        technicianId: session.user.id!,
        isActive: true,
      },
    });

    if (!workSession) {
      return NextResponse.json(
        { error: "No active work session found" },
        { status: 404 }
      );
    }

    // End the work session
    const endedSession = await prisma.workSession.update({
      where: { id: workSession.id },
      data: {
        isActive: false,
        endTime: new Date(),
      },
    });

    return NextResponse.json(endedSession);
  } catch (error) {
    console.error("Error ending work session:", error);
    return NextResponse.json(
      { error: "Failed to end work session" },
      { status: 500 }
    );
  }
}
