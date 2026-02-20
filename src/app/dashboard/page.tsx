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

export default function DashboardHomePage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMetrics() {
    try {
      const res = await fetch("/api/dashboard/metrics");
      if (!res.ok) {
        throw new Error("Failed to fetch metrics");
      }
      const data = await res.json();
      setMetrics(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
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
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Revenue This Month</h3>
              <p className="text-2xl font-bold text-white">
                ${metrics.revenueThisMonth.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Active Projects</h3>
              <p className="text-2xl font-bold text-white">{metrics.activeProjects}</p>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.totalProjects} total
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Active Technicians</h3>
              <p className="text-2xl font-bold text-white">
                {metrics.activeWorkSessions}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {metrics.activeTechnicians} total
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Average Margin</h3>
              <p className="text-2xl font-bold text-white">{metrics.avgMargin}%</p>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Completed This Month</h3>
              <p className="text-3xl font-bold text-green-400">
                {metrics.completedThisMonth}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-sm text-slate-400 mb-2">Overdue Invoices</h3>
              <p className="text-3xl font-bold text-red-400">
                {metrics.overdueInvoices}
              </p>
            </div>
          </div>

          {/* Top Technicians */}
          {metrics.topTechnicians.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
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
              className="p-6 rounded-xl bg-slate-800 border border-slate-700 text-white hover:border-relectrik-orange transition-colors"
            >
              <h2 className="font-semibold mb-1">Users</h2>
              <p className="text-sm text-slate-400">Manage technicians, admin and CEO.</p>
            </Link>
            <Link
              href="/dashboard/projects"
              className="p-6 rounded-xl bg-slate-800 border border-slate-700 text-white hover:border-relectrik-orange transition-colors"
            >
              <h2 className="font-semibold mb-1">Projects</h2>
              <p className="text-sm text-slate-400">Create and track projects and clients.</p>
            </Link>
            <Link
              href="/dashboard/map"
              className="p-6 rounded-xl bg-slate-800 border border-slate-700 text-white hover:border-relectrik-orange transition-colors"
            >
              <h2 className="font-semibold mb-1">Live Map</h2>
              <p className="text-sm text-slate-400">
                View real-time technician locations.
              </p>
            </Link>
            <Link
              href="/dashboard/ai"
              className="p-6 rounded-xl bg-slate-800 border border-slate-700 text-white hover:border-relectrik-orange transition-colors"
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
