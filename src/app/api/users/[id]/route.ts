import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { requireRole, getUserRole, type Role } from "@/lib/middleware/requireRole";
import { hash } from "bcryptjs";
import { z } from "zod";

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "TECHNICIAN", "CEO"]).optional(),
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
  department: z.string().optional(),
  password: z.string().min(8).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(["ADMIN", "CEO"]);
  if (roleCheck) return roleCheck;
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      department: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only ADMIN can update users
  const roleCheck = await requireRole(["ADMIN"]);
  if (roleCheck) return roleCheck;

  const session = await auth();
  const updaterRole = getUserRole(session);
  const { id } = await params;
  
  try {
    const body = await request.json();
    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { password, role, ...rest } = parsed.data;
    
    // Backend enforcement: Prevent role escalation
    // ADMIN cannot change roles via frontend - role changes must be done manually in DB
    // If role is provided, ignore it (security: frontend cannot escalate roles)
    const updateData: { name?: string; status?: string; department?: string; passwordHash?: string } = { ...rest };
    
    // Only allow role updates if explicitly needed (commented out for security)
    // if (role && updaterRole === "ADMIN") {
    //   const allowedRoles: Role[] = ["TECHNICIAN", "ADMIN"];
    //   if (allowedRoles.includes(role as Role)) {
    //     updateData.role = role;
    //   }
    // }
    if (password) {
      updateData.passwordHash = await hash(password, 12);
    }
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true,
        createdAt: true,
      },
    });
    return NextResponse.json(user);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Error updating user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only ADMIN can delete users
  const roleCheck = await requireRole(["ADMIN"]);
  if (roleCheck) return roleCheck;
  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not delete user" },
      { status: 500 }
    );
  }
}
