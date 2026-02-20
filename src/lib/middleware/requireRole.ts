import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/session";
import type { Session } from "next-auth";

export type Role = "ADMIN" | "TECHNICIAN" | "CEO";

/**
 * Backend role enforcement for API routes
 * Use this in API routes to enforce role-based access control
 * 
 * @param allowedRoles - Array of roles that can access this endpoint
 * @returns Response with 403 if unauthorized, or null if authorized
 */
export async function requireRole(
  allowedRoles: Role[]
): Promise<NextResponse | null> {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userRole = (session.user as { role?: string })?.role as Role | undefined;
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: "Forbidden: Insufficient permissions" },
      { status: 403 }
    );
  }

  return null; // Authorized
}

/**
 * Helper to check if session has required role
 * Use this in server components and API routes
 */
export function hasRole(session: Session | null, allowedRoles: Role[]): boolean {
  if (!session?.user) return false;
  const userRole = (session.user as { role?: string })?.role as Role | undefined;
  return userRole ? allowedRoles.includes(userRole) : false;
}

/**
 * Get user role from session
 */
export function getUserRole(session: Session | null): Role | null {
  if (!session?.user) return null;
  return (session.user as { role?: string })?.role as Role | null;
}
