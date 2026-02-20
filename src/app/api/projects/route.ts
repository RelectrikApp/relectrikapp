import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isAdminOrCEO } from "@/lib/utils/role";
import { z } from "zod";

const CreateProjectSchema = z.object({
  clientName: z.string().min(1),
  clientPhone: z.string().optional(),
  address: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  description: z.string().optional(),
  estimatedCost: z.number().optional(),
  assignedTechnicianId: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !isAdminOrCEO(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const where = status
    ? { status: status as "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "INVOICED" | "PAID" }
    : {};
  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTechnician: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !isAdminOrCEO(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const parsed = CreateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const project = await prisma.project.create({
      data: {
        ...parsed.data,
        status: parsed.data.assignedTechnicianId ? "ASSIGNED" : "PENDING",
      },
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
      { error: "Error creating project" },
      { status: 500 }
    );
  }
}
