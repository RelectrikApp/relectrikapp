import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/technicians/live-locations
 * Admin/CEO-only endpoint to get live technician locations
 */
export async function GET() {
  const roleCheck = await requireRole(["ADMIN", "CEO"]);
  if (roleCheck) return roleCheck;

  try {
    // Get active work sessions with latest location
    const activeSessions = await prisma.workSession.findMany({
      where: {
        isActive: true,
      },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        locations: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
        project: {
          select: {
            id: true,
            clientName: true,
            address: true,
          },
        },
      },
    });

    const locations = activeSessions.map((session) => ({
      technicianId: session.technicianId,
      technicianName: session.technician.name,
      technicianEmail: session.technician.email,
      projectId: session.projectId,
      projectName: session.project.clientName,
      location: session.locations[0]
        ? {
            lat: session.locations[0].lat,
            lng: session.locations[0].lng,
            timestamp: session.locations[0].timestamp,
            activityType: session.locations[0].activityType,
          }
        : null,
      status: session.isActive ? "ACTIVE" : "INACTIVE",
    }));

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching live locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch live locations" },
      { status: 500 }
    );
  }
}
