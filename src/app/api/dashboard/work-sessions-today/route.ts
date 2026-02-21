import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/work-sessions-today
 * Admin/CEO: work sessions for today with punch in (startTime) and punch out (endTime)
 */
export async function GET() {
  const roleCheck = await requireRole(["ADMIN", "CEO"]);
  if (roleCheck) return roleCheck;

  try {
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    // Two separate queries to avoid OR edge cases; merge and deduplicate by session id
    const [todaySessions, activeSessions] = await Promise.all([
      prisma.workSession.findMany({
        where: { startTime: { gte: startOfDay, lt: endOfDay } },
        include: {
          technician: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, clientName: true } },
        },
        orderBy: { startTime: "asc" },
      }),
      prisma.workSession.findMany({
        where: { isActive: true },
        include: {
          technician: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, clientName: true } },
        },
        orderBy: { startTime: "asc" },
      }),
    ]);

    const seen = new Set<string>();
    const sessions: typeof todaySessions = [];
    for (const s of todaySessions) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        sessions.push(s);
      }
    }
    for (const s of activeSessions) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        sessions.push(s);
      }
    }
    sessions.sort((a, b) => {
      if (a.technicianId !== b.technicianId) return a.technicianId.localeCompare(b.technicianId);
      return a.startTime.getTime() - b.startTime.getTime();
    });

    const byTechnician: Record<
      string,
      {
        technician: { id: string; name: string | null; email: string };
        sessions: Array<{
          id: string;
          punchIn: string;
          punchOut: string | null;
          duration: string | null;
          project: string | null;
          isActive: boolean;
        }>;
      }
    > = {};

    for (const s of sessions) {
      const techId = s.technicianId;
      const technician = s.technician;
      if (!technician) continue;
      if (!byTechnician[techId]) {
        byTechnician[techId] = {
          technician: {
            id: technician.id,
            name: technician.name,
            email: technician.email,
          },
          sessions: [],
        };
      }
      const punchIn = s.startTime.toISOString();
      const punchOut = s.endTime?.toISOString() ?? null;
      let duration: string | null = null;
      if (s.endTime) {
        const ms = s.endTime.getTime() - s.startTime.getTime();
        const mins = Math.floor(ms / 60000);
        duration = `${Math.floor(mins / 60)}h ${mins % 60}m`;
      } else if (s.isActive) {
        duration = "— (active)";
      }
      byTechnician[techId].sessions.push({
        id: s.id,
        punchIn,
        punchOut,
        duration,
        project: s.project?.clientName ?? null,
        isActive: s.isActive,
      });
    }

    const list = Object.values(byTechnician);
    return NextResponse.json(list);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Work sessions today error:", err.message, err);
    return NextResponse.json(
      { error: "Failed to fetch work sessions" },
      { status: 500 }
    );
  }
}
