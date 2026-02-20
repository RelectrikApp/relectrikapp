import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/session";
import { z } from "zod";

const LocationUpdateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  sessionId: z.string(),
  activityType: z.string().optional(),
  accuracy: z.number().optional(),
});

/**
 * POST /api/location/update
 * Technician-only endpoint to update GPS location
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
    const parsed = LocationUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { lat, lng, sessionId, activityType, accuracy } = parsed.data;

    // Verify work session belongs to technician
    const workSession = await prisma.workSession.findFirst({
      where: {
        id: sessionId,
        technicianId: session.user.id!,
      },
    });

    if (!workSession) {
      return NextResponse.json(
        { error: "Work session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create location record
    const location = await prisma.location.create({
      data: {
        sessionId,
        lat,
        lng,
        activityType: activityType || null,
        accuracy: accuracy || null,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}
