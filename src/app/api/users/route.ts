import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { requireRole, getUserRole, type Role } from "@/lib/middleware/requireRole";
import { hash } from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "TECHNICIAN", "CEO"]),
  department: z.string().optional(),
});

export async function GET() {
  const roleCheck = await requireRole(["ADMIN", "CEO"]);
  if (roleCheck) return roleCheck;
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  // Only ADMIN can create users (not CEO, not TECHNICIAN)
  const roleCheck = await requireRole(["ADMIN"]);
  if (roleCheck) return roleCheck;

  const session = await auth();
  const creatorRole = getUserRole(session);

  try {
    const body = await request.json();
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { email, password, name, role, department } = parsed.data;

    // Backend enforcement: Role whitelist based on creator
    // ADMIN can only create TECHNICIAN or ADMIN (never CEO)
    // Frontend role input is ignored - backend decides allowed roles
    const allowedRoles: Role[] = creatorRole === "ADMIN" 
      ? ["TECHNICIAN", "ADMIN"] 
      : ["TECHNICIAN"];
    
    if (!allowedRoles.includes(role as Role)) {
      return NextResponse.json(
        { error: `Forbidden: Cannot create user with role ${role}. Allowed roles: ${allowedRoles.join(", ")}` },
        { status: 403 }
      );
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }
    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        department,
        status: "ACTIVE",
      },
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
      { error: "Error creating user" },
      { status: 500 }
    );
  }
}
