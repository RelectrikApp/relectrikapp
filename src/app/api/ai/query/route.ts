import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { auth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const AIQuerySchema = z.object({
  query: z.string().min(1),
});

/**
 * POST /api/ai/query
 * Admin/CEO-only endpoint for AI assistant
 * Technicians CANNOT access this
 */
export async function POST(request: Request) {
  // STRICT: Only ADMIN and CEO can access AI
  const roleCheck = await requireRole(["ADMIN", "CEO"]);
  if (roleCheck) return roleCheck;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = AIQuerySchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { query } = parsed.data;

    // Log AI interaction
    await prisma.aIInteraction.create({
      data: {
        userId: session.user.id!,
        query,
        timestamp: new Date(),
      },
    });

    // Simple rule-based responses using dashboard data (no external AI yet)
    const q = query.toLowerCase().trim();
    let response: string;

    if (
      q.includes("revenue") ||
      q.includes("sales") ||
      q.includes("how much") ||
      q.includes("business doing") ||
      q.includes("summary") ||
      q.includes("metrics") ||
      q.includes("overview")
    ) {
      const metricsRes = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/dashboard/metrics`,
        { headers: { cookie: request.headers.get("cookie") || "" } }
      );
      if (metricsRes.ok) {
        const m = await metricsRes.json();
        response = `**Dashboard summary:** Revenue this month: $${m.revenueThisMonth?.toLocaleString() ?? 0}. Active projects: ${m.activeProjects ?? 0} of ${m.totalProjects ?? 0} total. Completed this month: ${m.completedThisMonth ?? 0}. Overdue invoices: ${m.overdueInvoices ?? 0}. Active technicians in the field: ${m.activeWorkSessions ?? 0} of ${m.activeTechnicians ?? 0} total. Average margin: ${m.avgMargin ?? 0}%.`;
      } else {
        response = "I couldn't fetch metrics right now. Try again in a moment.";
      }
    } else if (q.includes("project") && (q.includes("status") || q.includes("how many"))) {
      const count = await prisma.project.count();
      const active = await prisma.project.count({
        where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
      });
      response = `There are ${count} total projects. ${active} are currently active (assigned or in progress).`;
    } else if (q.includes("technician") || q.includes("tech")) {
      const total = await prisma.user.count({ where: { role: "TECHNICIAN", status: "ACTIVE" } });
      const activeSessions = await prisma.workSession.count({ where: { isActive: true } });
      response = `There are ${total} active technicians. ${activeSessions} are currently on an active work session (punched in).`;
    } else if (q.includes("help") || q.includes("what can you")) {
      response =
        "I can give you a **business summary** (revenue, projects, technicians), **project status**, and **technician activity**. Ask things like: 'How is the business doing?', 'Revenue and metrics', 'How many projects?', 'Technician status'. For deeper insights, connect an AI provider (e.g. OpenAI) to this endpoint.";
    } else {
      response =
        "I can help with dashboard summaries, project counts, and technician status. Try: 'How is the business doing?' or 'Give me a summary of metrics'. For more, say 'help'.";
    }

    return NextResponse.json({
      response,
      query,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error processing AI query:", error);
    return NextResponse.json(
      { error: "Failed to process AI query" },
      { status: 500 }
    );
  }
}
