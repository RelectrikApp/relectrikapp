import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/session";

/**
 * POST /api/work-sessions/start
 * Technician-only endpoint to start a work session
 */
export async function POST(request: Request) {
  const roleCheck = await requireRole(["TECHNICIAN"]);
  if (roleCheck) return roleCheck;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if there's already an active session
    const existingSession = await prisma.workSession.findFirst({
      where: {
        technicianId: session.user.id!,
        isActive: true,
      },
    });

    if (existingSession) {
      return NextResponse.json(
        { error: "You already have an active work session" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { projectId } = body;

    let finalProjectId = projectId;

    // If projectId provided, verify it's assigned to this technician
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          assignedTechnicianId: session.user.id!,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found or not assigned to you" },
          { status: 404 }
        );
      }
      finalProjectId = projectId;
    } else {
      // If no projectId, try to get first assigned project
      const assignedProject = await prisma.project.findFirst({
        where: {
          assignedTechnicianId: session.user.id!,
          status: {
            in: ["ASSIGNED", "IN_PROGRESS"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (assignedProject) {
        finalProjectId = assignedProject.id;
      } else {
        // Create a temporary "General Work" project if no projects assigned
        // This allows technicians to punch in even without assigned projects
        const tempProject = await prisma.project.create({
          data: {
            clientName: `General Work - ${session.user.name || session.user.email}`,
            address: "TBD",
            status: "IN_PROGRESS",
            assignedTechnicianId: session.user.id!,
            description: "Temporary project for work session",
          },
        });
        finalProjectId = tempProject.id;
      }
    }

    // Create new work session
    const workSession = await prisma.workSession.create({
      data: {
        technicianId: session.user.id!,
        projectId: finalProjectId,
        startTime: new Date(),
        isActive: true,
      },
      include: {
        project: {
          select: {
            id: true,
            clientName: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json(workSession);
  } catch (error) {
    console.error("Error starting work session:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to start work session";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
