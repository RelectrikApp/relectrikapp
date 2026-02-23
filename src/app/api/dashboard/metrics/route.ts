import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { getDashboardMetrics } from "@/lib/services/dashboardMetrics";

/**
 * GET /api/dashboard/metrics
 * Admin/CEO-only endpoint for dashboard metrics (uses shared service with parallel queries)
 */
export async function GET() {
  const roleCheck = await requireRole(["ADMIN", "CEO"]);
  if (roleCheck) return roleCheck;

  try {
    const metrics = await getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
