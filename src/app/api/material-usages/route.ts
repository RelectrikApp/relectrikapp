import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/session";
import { z } from "zod";

const BodySchema = z.object({
  sessionId: z.string().min(1),
  projectId: z.string().min(1),
  itemsUsed: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().positive(),
      returned: z.number().min(0).optional(),
    })
  ),
});

export async function POST(request: Request) {
  const roleCheck = await requireRole(["TECHNICIAN"]);
  if (roleCheck) return roleCheck;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { sessionId, projectId, itemsUsed } = parsed.data;

    const workSession = await prisma.workSession.findFirst({
      where: {
        id: sessionId,
        technicianId: session.user.id,
        isActive: true,
      },
    });
    if (!workSession) {
      return NextResponse.json(
        { error: "Active session not found. Punch in first." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        assignedTechnicianId: session.user.id,
      },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not assigned to you." },
        { status: 400 }
      );
    }

    const itemsReturned = itemsUsed.map((item) => ({
      ...item,
      returned: item.returned ?? 0,
    }));

    const usage = await prisma.materialUsage.create({
      data: {
        projectId,
        sessionId,
        technicianId: session.user.id,
        itemsUsed: itemsUsed as object,
        itemsReturned: itemsReturned as object,
      },
    });

    return NextResponse.json(usage);
  } catch (e) {
    console.error("Material usage error:", e);
    return NextResponse.json(
      { error: "Failed to record usage" },
      { status: 500 }
    );
  }
}
