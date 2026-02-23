"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardMetrics {
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
    name: string;
    email: string;
    efficiencyScore: number | null;
  }>;
}

interface TodaySession {
  id: string;
  punchIn: string;
  punchOut: string | null;
  duration: string | null;
  project: string | null;
  isActive: boolean;
}

interface TechnicianSessionsToday {
  technician: { id: string; name: string | null; email: string };
  sessions: TodaySession[];
}

export default function DashboardHomePage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [sessionsToday, setSessionsToday] = useState<TechnicianSessionsToday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMetrics() {
    try {
      setSessionsError(null);
      setError("");
      const [metricsRes, sessionsRes] = await Promise.all([
        fetch("/api/dashboard/metrics"),
        fetch("/api/dashboard/work-sessions-today", { credentials: "include", cache: "no-store" }),
      ]);

      if (!metricsRes.ok) {
        throw new Error("Failed to fetch metrics");
      }
      const data = await metricsRes.json();
      setMetrics(data);

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        if (Array.isArray(sessionsData)) {
          setSessionsToday(sessionsData);
        } else {
          setSessionsToday([]);
          setSessionsError(sessionsData?.error || "Invalid sessions data");
        }
      } else {
        const errBody = await sessionsRes.json().catch(() => ({}));
        setSessionsError(
          errBody?.error || `Error ${sessionsRes.status}: Could not load work sessions`
        );
        setSessionsToday([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Business intelligence and metrics</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-white">Loading metrics...</div>
      ) : metrics ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Revenue This Month</h3>
              <p className="text-2xl font-bold text-white">
                ${metrics.revenueThisMonth.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Active Projects</h3>
              <p className="text-2xl font-bold text-white">{metrics.activeProjects}</p>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.totalProjects} total
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Active Technicians</h3>
              <p className="text-2xl font-bold text-white">
                {metrics.activeWorkSessions}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.activeTechnicians} total
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Average Margin</h3>
              <p className="text-2xl font-bold text-white">{metrics.avgMargin}%</p>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Completed This Month</h3>
              <p className="text-3xl font-bold text-green-400">
                {metrics.completedThisMonth}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Overdue Invoices</h3>
              <p className="text-3xl font-bold text-red-400">
                {metrics.overdueInvoices}
              </p>
            </div>
          </div>

          {/* Technician connection times - today */}
          <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-lg font-semibold text-white">
                Technician connection times
              </h3>
              <Link
                href="/dashboard/technician-connection-times"
                className="text-sm font-medium text-relectrik-orange hover:underline"
              >
                View calendar (monthly)
              </Link>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Punch in and punch out times. Shows today&apos;s sessions and any technician currently active (punched in).
            </p>
            {sessionsError && (
              <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700 rounded text-amber-200 text-sm">
                {sessionsError}
              </div>
            )}
            {sessionsToday.length === 0 && !sessionsError && metrics.activeWorkSessions > 0 ? (
              <p className="text-slate-500 text-sm">
                Active sessions exist but the list could not be loaded. Try refreshing the page.
              </p>
            ) : sessionsToday.length === 0 ? (
              <p className="text-slate-500 text-sm">No work sessions today.</p>
            ) : (
              <div className="space-y-4">
                {sessionsToday.map(({ technician, sessions }) => (
                  <div key={technician.id} className="p-4 bg-slate-900/50 rounded-lg">
                    <div className="font-medium text-white mb-2">
                      {technician.name || technician.email}
                    </div>
                    <div className="text-slate-500 text-sm mb-2">{technician.email}</div>
                    <div className="space-y-1 text-sm">
                      {sessions.map((s) => (
                        <div
                          key={s.id}
                          className="flex flex-wrap gap-x-4 gap-y-1 items-center text-slate-300"
                        >
                          <span>
                            <strong className="text-slate-400">In:</strong>{" "}
                            {new Date(s.punchIn).toLocaleTimeString()}
                          </span>
                          <span>
                            <strong className="text-slate-400">Out:</strong>{" "}
                            {s.punchOut
                              ? new Date(s.punchOut).toLocaleTimeString()
                              : s.isActive
                                ? "— (active)"
                                : "—"}
                          </span>
                          {s.duration && (
                            <span className="text-slate-400">{s.duration}</span>
                          )}
                          {s.project && (
                            <span className="text-slate-500">Project: {s.project}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Technicians */}
          {metrics.topTechnicians.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4 md:p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Top Performing Technicians
              </h3>
              <div className="space-y-2">
                {metrics.topTechnicians.map((tech, idx) => (
                  <div
                    key={tech.id}
                    className="flex items-center justify-between p-3 bg-slate-900/50 rounded"
                  >
                    <div>
                      <span className="text-slate-400 mr-2">#{idx + 1}</span>
                      <span className="text-white font-medium">{tech.name}</span>
                      <span className="text-slate-500 text-sm ml-2">{tech.email}</span>
                    </div>
                    {tech.efficiencyScore !== null && (
                      <span className="text-green-400 font-semibold">
                        {tech.efficiencyScore.toFixed(1)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/users"
              className="p-4 md:p-6 min-h-[72px] rounded-xl bg-slate-800 border border-slate-700 text-white hover:border-relectrik-orange transition-colors flex flex-col justify-center"
            >
              <h2 className="font-semibold mb-1">Users</h2>
              <p className="text-sm text-slate-400">Manage technicians, admin and CEO.</p>
            </Link>
            <Link
              href="/dashboard/projects"
              className="p-4 md:p-6 min-h-[72px] rounded-xl bg-slate-800 border border-slate-700 text-white hover:border-relectrik-orange transition-colors flex flex-col justify-center"
            >
              <h2 className="font-semibold mb-1">Projects</h2>
              <p className="text-sm text-slate-400">Create and track projects and clients.</p>
            </Link>
            <Link
              href="/dashboard/map"
              className="p-4 md:p-6 min-h-[72px] rounded-xl bg-slate-800 border border-slate-700 text-white hover:border-relectrik-orange transition-colors flex flex-col justify-center"
            >
              <h2 className="font-semibold mb-1">Live Map</h2>
              <p className="text-sm text-slate-400">
                View real-time technician locations.
              </p>
            </Link>
            <Link
              href="/dashboard/ai"
              className="p-4 md:p-6 min-h-[72px] rounded-xl bg-slate-800 border border-slate-700 text-white hover:border-relectrik-orange transition-colors flex flex-col justify-center"
            >
              <h2 className="font-semibold mb-1">AI Assistant</h2>
              <p className="text-sm text-slate-400">Get AI-powered insights and recommendations.</p>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
