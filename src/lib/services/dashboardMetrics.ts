import { prisma } from "@/lib/db/prisma";

export interface DashboardMetricsResult {
  revenueThisMonth: number;
  activeProjects: number;
  totalProjects: number;
  completedThisMonth: number;
  overdueInvoices: number;
  activeTechnicians: number;
  activeWorkSessions: number;
  avgMargin: number;
  topTechnicians: Array<{
    id: string;
    name: string | null;
    email: string;
    efficiencyScore: number | null;
  }>;
}

/**
 * Shared server-side logic for dashboard metrics.
 * Used by GET /api/dashboard/metrics and by AI query (no HTTP fetch).
 * All Prisma queries run in parallel for minimal latency.
 */
export async function getDashboardMetrics(): Promise<DashboardMetricsResult> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    invoicesThisMonth,
    activeProjects,
    totalProjects,
    completedThisMonth,
    overdueInvoices,
    activeTechnicians,
    activeWorkSessions,
    projectProfits,
    sessionsWithScores,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        invoiceDate: { gte: startOfMonth, lte: endOfMonth },
        paymentStatus: "PAID",
      },
    }),
    prisma.project.count({
      where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
    }),
    prisma.project.count(),
    prisma.project.count({
      where: {
        completedDate: { gte: startOfMonth, lte: endOfMonth },
        status: "COMPLETED",
      },
    }),
    prisma.invoice.count({
      where: { paymentStatus: "OVERDUE" },
    }),
    prisma.user.count({
      where: { role: "TECHNICIAN", status: "ACTIVE" },
    }),
    prisma.workSession.count({
      where: { isActive: true },
    }),
    prisma.projectProfit.findMany({
      take: 100,
      orderBy: { calculatedAt: "desc" },
    }),
    prisma.workSession.findMany({
      where: { efficiencyScore: { not: null } },
      include: {
        technician: { select: { id: true, name: true, email: true } },
      },
      orderBy: { efficiencyScore: "desc" },
      take: 5,
    }),
  ]);

  const revenueThisMonth = invoicesThisMonth.reduce(
    (sum, inv) => sum + inv.amountCharged,
    0
  );
  const avgMargin =
    projectProfits.length > 0
      ? projectProfits.reduce((sum, p) => sum + p.profitMargin, 0) /
        projectProfits.length
      : 0;

  return {
    revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
    activeProjects,
    totalProjects,
    completedThisMonth,
    overdueInvoices,
    activeTechnicians,
    activeWorkSessions,
    avgMargin: Math.round(avgMargin * 100) / 100,
    topTechnicians: sessionsWithScores.map((s) => ({
      id: s.technician.id,
      name: s.technician.name,
      email: s.technician.email,
      efficiencyScore: s.efficiencyScore,
    })),
  };
}
