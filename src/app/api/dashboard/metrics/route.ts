import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/dashboard/metrics
 * Admin/CEO-only endpoint for dashboard metrics
 */
export async function GET() {
  const roleCheck = await requireRole(["ADMIN", "CEO"]);
  if (roleCheck) return roleCheck;

  try {
    // Get current month dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Revenue this month (from invoices)
    const invoicesThisMonth = await prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        paymentStatus: "PAID",
      },
    });
    const revenueThisMonth = invoicesThisMonth.reduce(
      (sum, inv) => sum + inv.amountCharged,
      0
    );

    // Active projects
    const activeProjects = await prisma.project.count({
      where: {
        status: {
          in: ["ASSIGNED", "IN_PROGRESS"],
        },
      },
    });

    // Total projects
    const totalProjects = await prisma.project.count();

    // Completed projects this month
    const completedThisMonth = await prisma.project.count({
      where: {
        completedDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: "COMPLETED",
      },
    });

    // Overdue invoices
    const overdueInvoices = await prisma.invoice.count({
      where: {
        paymentStatus: "OVERDUE",
      },
    });

    // Active technicians
    const activeTechnicians = await prisma.user.count({
      where: {
        role: "TECHNICIAN",
        status: "ACTIVE",
      },
    });

    // Active work sessions
    const activeWorkSessions = await prisma.workSession.count({
      where: {
        isActive: true,
      },
    });

    // Average profit margin (from ProjectProfit)
    const projectProfits = await prisma.projectProfit.findMany({
      take: 100, // Last 100 projects
      orderBy: {
        calculatedAt: "desc",
      },
    });
    const avgMargin =
      projectProfits.length > 0
        ? projectProfits.reduce((sum, p) => sum + p.profitMargin, 0) /
          projectProfits.length
        : 0;

    // Technician efficiency (work sessions with efficiency scores)
    const sessionsWithScores = await prisma.workSession.findMany({
      where: {
        efficiencyScore: {
          not: null,
        },
      },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        efficiencyScore: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
