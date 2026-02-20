import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isAdminOrCEO } from "@/lib/utils/role";
import { z } from "zod";

const UpdateProjectSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientPhone: z.string().optional(),
  address: z.string().min(1).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "INVOICED", "PAID"]).optional(),
  estimatedCost: z.number().optional(),
  assignedTechnicianId: z.string().nullable().optional(),
  startDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminOrCEO(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      assignedTechnician: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminOrCEO(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = UpdateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = { ...parsed.data };
    const updateData = {
      ...(data.name && { name: data.name }),
      ...(data.department && { department: data.department }),
      ...(data.passwordHash && { passwordHash: data.passwordHash }),
      ...(data.status && { status: data.status as UserStatus }),
    };
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        assignedTechnician: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    return NextResponse.json(project);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Error updating project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !isAdminOrCEO(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not delete project" },
      { status: 500 }
    );
  }
}
