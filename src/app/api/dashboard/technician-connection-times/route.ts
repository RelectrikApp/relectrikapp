import { NextResponse } from "next/server";
import { requireRole } from "@/lib/middleware/requireRole";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/technician-connection-times?month=YYYY-MM
 * Returns per-technician total hours and per-day breakdown for the given month (UTC).
 * Admin/CEO only.
 */
export async function GET(request: Request) {
  const roleCheck = await requireRole(["ADMIN", "CEO"]);
  if (roleCheck) return roleCheck;

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month");
  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json(
      { error: "Query 'month' required as YYYY-MM" },
      { status: 400 }
    );
  }

  const [y, m] = monthParam.split("-").map(Number);
  const startOfMonth = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

  try {
    const technicians = await prisma.user.findMany({
      where: { role: "TECHNICIAN" },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });

    const sessionsRaw = await prisma.workSession.findMany({
      where: { startTime: { lt: new Date(endOfMonth.getTime() + 1) } },
      select: {
        id: true,
        technicianId: true,
        startTime: true,
        endTime: true,
        isActive: true,
      },
      orderBy: { startTime: "asc" },
    });
    const nowForFilter = new Date();
    const sessions = sessionsRaw.filter((s) => {
      const end = s.endTime ?? (s.isActive ? nowForFilter : s.startTime);
      return end >= startOfMonth;
    });

    const now = new Date();
    const daysInMonth = endOfMonth.getUTCDate();
    const dayKeys: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      dayKeys.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }

    type DayHours = Record<string, number>;
    const technicianData: Record<
      string,
      { totalHoursInMonth: number; hoursByDay: DayHours }
    > = {};

    for (const tech of technicians) {
      technicianData[tech.id] = {
        totalHoursInMonth: 0,
        hoursByDay: Object.fromEntries(dayKeys.map((k) => [k, 0])),
      };
    }

    for (const s of sessions) {
      const sessionEnd = s.endTime ?? (s.isActive ? now : s.startTime);
      const start = new Date(Math.max(s.startTime.getTime(), startOfMonth.getTime()));
      const end = new Date(Math.min(sessionEnd.getTime(), endOfMonth.getTime()));
      if (start >= end) continue;

      const techId = s.technicianId;
      if (!technicianData[techId]) continue;

      const totalMs = end.getTime() - start.getTime();
      const totalHours = totalMs / (1000 * 60 * 60);
      technicianData[techId].totalHoursInMonth += totalHours;

      const dayStart = new Date(start);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      let cursor = new Date(start);
      while (cursor < end) {
        const dStart = new Date(cursor);
        dStart.setUTCHours(0, 0, 0, 0);
        const dEnd = new Date(dStart);
        dEnd.setUTCDate(dEnd.getUTCDate() + 1);
        const segmentStart = new Date(Math.max(cursor.getTime(), dStart.getTime()));
        const segmentEnd = new Date(Math.min(end.getTime(), dEnd.getTime()));
        const segmentMs = segmentEnd.getTime() - segmentStart.getTime();
        const dayKey = `${dStart.getUTCFullYear()}-${String(dStart.getUTCMonth() + 1).padStart(2, "0")}-${String(dStart.getUTCDate()).padStart(2, "0")}`;
        if (technicianData[techId].hoursByDay[dayKey] !== undefined) {
          technicianData[techId].hoursByDay[dayKey] += segmentMs / (1000 * 60 * 60);
        }
        cursor = dEnd;
      }
    }

    const result = technicians.map((tech) => ({
      technician: { id: tech.id, name: tech.name, email: tech.email },
      totalHoursInMonth: Math.round(technicianData[tech.id].totalHoursInMonth * 100) / 100,
      hoursByDay: technicianData[tech.id].hoursByDay,
    }));

    return NextResponse.json({
      month: monthParam,
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
      technicians: result,
    });
  } catch (e) {
    console.error("Technician connection times error:", e);
    return NextResponse.json(
      { error: "Failed to fetch technician connection times" },
      { status: 500 }
    );
  }
}
