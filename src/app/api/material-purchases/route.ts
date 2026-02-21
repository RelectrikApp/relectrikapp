import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/session";
import { z } from "zod";

const BodySchema = z.object({
  sessionId: z.string().min(1),
  projectId: z.string().min(1),
  supplierName: z.string().optional(),
  supplierAddress: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().positive(),
      unitCost: z.number().min(0).optional(),
    })
  ),
  totalCost: z.number().min(0),
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
    const { sessionId, projectId, supplierName, supplierAddress, items, totalCost } =
      parsed.data;

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

    const purchase = await prisma.materialPurchase.create({
      data: {
        projectId,
        sessionId,
        technicianId: session.user.id,
        supplierName: supplierName || null,
        supplierAddress: supplierAddress || null,
        items: items as object,
        totalCost,
      },
    });

    return NextResponse.json(purchase);
  } catch (e) {
    console.error("Material purchase error:", e);
    return NextResponse.json(
      { error: "Failed to record purchase" },
      { status: 500 }
    );
  }
}
