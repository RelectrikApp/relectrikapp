import type { Session } from "next-auth";

export function isAdminOrCEO(session: Session | null): boolean {
  const role = (session?.user as { role?: string } | undefined)?.role;
  return role === "ADMIN" || role === "CEO";
}

export function isTechnician(session: Session | null): boolean {
  return (session?.user as { role?: string } | undefined)?.role === "TECHNICIAN";
}
