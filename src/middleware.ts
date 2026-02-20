import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const path = req.nextUrl.pathname;
  
  // Auth pages (public access)
  const isTechAuth =
    path === "/tech/login" ||
    path === "/tech/register" ||
    path.startsWith("/tech/forgot-password") ||
    path.startsWith("/tech/reset-password") ||
    path.startsWith("/tech/verify-email");
  const isAdminAuth = path === "/admin/login";
  
  // Protected areas
  const isTechArea = path.startsWith("/tech");
  const isAdminArea = path.startsWith("/admin");
  const isDashboard = path.startsWith("/dashboard");

  // Get user role from token
  const userRole = (token as { role?: string } | null)?.role;

  // Redirect authenticated users away from auth pages
  if (isTechAuth && token) {
    // Redirect based on role
    if (userRole === "TECHNICIAN") {
      return NextResponse.redirect(new URL("/tech", req.url));
    } else if (userRole === "ADMIN" || userRole === "CEO") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/tech", req.url));
  }
  
  if (isAdminAuth && token) {
    if (userRole === "ADMIN" || userRole === "CEO") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/tech", req.url));
    }
  }

  // Protect technician routes
  if (isTechArea && !isTechAuth && !token) {
    return NextResponse.redirect(new URL("/tech/login", req.url));
  }
  
  // Protect admin routes
  if (isAdminArea && !isAdminAuth && !token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  
  // Protect dashboard (admin/CEO only)
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  
  // Role-based route protection
  if (isDashboard && token) {
    // Technicians cannot access dashboard
    if (userRole === "TECHNICIAN") {
      return NextResponse.redirect(new URL("/tech", req.url));
    }
  }
  
  if (isTechArea && !isTechAuth && token) {
    // Admin/CEO should not access technician operational routes
    if (userRole === "ADMIN" || userRole === "CEO") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tech/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/(admin)/:path*",
  ],
};
