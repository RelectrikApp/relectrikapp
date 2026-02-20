import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/session";

/**
 * GET /api/projects/assigned
 * Technician-only endpoint to get assigned projects
 */
export async function GET() {
  const roleCheck = await requireRole(["TECHNICIAN"]);
  if (roleCheck) return roleCheck;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        assignedTechnicianId: session.user.id!,
      },
      select: {
        id: true,
        clientName: true,
        clientPhone: true,
        address: true,
        description: true,
        status: true,
        createdAt: true,
        startDate: true,
        completedDate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching assigned projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned projects" },
      { status: 500 }
    );
  }
}
