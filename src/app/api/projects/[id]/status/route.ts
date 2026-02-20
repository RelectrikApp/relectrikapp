import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/session";
import { z } from "zod";

const UpdateStatusSchema = z.object({
  status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "INVOICED", "PAID"]),
});

/**
 * PATCH /api/projects/[id]/status
 * Technician-only endpoint to update project status
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(["TECHNICIAN"]);
  if (roleCheck) return roleCheck;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify project is assigned to this technician
    const project = await prisma.project.findFirst({
      where: {
        id,
        assignedTechnicianId: session.user.id!,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not assigned to you" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = UpdateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status } = parsed.data;

    // Update project status
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status,
        ...(status === "COMPLETED" && !project.completedDate
          ? { completedDate: new Date() }
          : {}),
        ...(status === "IN_PROGRESS" && !project.startDate
          ? { startDate: new Date() }
          : {}),
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project status:", error);
    return NextResponse.json(
      { error: "Failed to update project status" },
      { status: 500 }
    );
  }
}
