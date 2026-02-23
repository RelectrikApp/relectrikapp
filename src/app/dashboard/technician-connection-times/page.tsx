"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TechnicianRow {
  technician: { id: string; name: string | null; email: string };
  totalHoursInMonth: number;
  hoursByDay: Record<string, number>;
}

interface ApiResponse {
  month: string;
  technicians: TechnicianRow[];
}

/** Format YYYY-MM in English (e.g. "February 2026"). Title always uses selected month. */
function formatMonthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function TechnicianConnectionTimesPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedYear, selectedMonth] = month.split("-");
  const selectedMonthNum = Number(selectedMonth);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ] as const;

  const yearOptions = (() => {
    const nowY = new Date().getFullYear();
    const start = nowY - 1;
    const end = nowY + 3;
    const ys: number[] = [];
    for (let y = start; y <= end; y++) ys.push(y);
    return ys;
  })();

  function updateMonth(nextYear: number, nextMonth: number) {
    const mm = String(nextMonth).padStart(2, "0");
    setMonth(`${nextYear}-${mm}`);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setData(null);
    fetch(`/api/dashboard/technician-connection-times?month=${encodeURIComponent(month)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 400 ? "Invalid month" : "Failed to load");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const dayKeys = data?.technicians[0]
    ? Object.keys(data.technicians[0].hoursByDay).sort()
    : [];
  const dayLabels = dayKeys.map((k) => {
    const [y, m, d] = k.split("-").map(Number);
    return { key: k, label: `${d}` };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
            Technician connection times — Monthly view
          </h1>
          <p className="text-slate-400 text-sm">
            Total hours and daily breakdown per technician. Based on work sessions (Punch In / Punch Out).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-slate-400 text-sm whitespace-nowrap">Month</label>
          <div className="flex items-center gap-2">
            <select
              aria-label="Select month"
              value={String(selectedMonthNum)}
              onChange={(e) => updateMonth(Number(selectedYear), Number(e.target.value))}
              className="rounded-lg bg-slate-800 border border-slate-600 text-white px-3 py-2 text-sm"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={String(idx + 1)}>
                  {name}
                </option>
              ))}
            </select>
            <select
              aria-label="Select year"
              value={selectedYear}
              onChange={(e) => updateMonth(Number(e.target.value), selectedMonthNum)}
              className="rounded-lg bg-slate-800 border border-slate-600 text-white px-3 py-2 text-sm"
            >
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-white">Loading…</div>
      ) : data && data.month !== month ? (
        <div className="text-white">Loading…</div>
      ) : data && data.month === month && data.technicians.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-slate-400">
          No technicians or no work sessions for {formatMonthLabel(month)}.
        </div>
      ) : data && data.month === month ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">
              Total hours and daily breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-900/80 text-slate-300 text-sm">
                  <th className="px-3 py-2 font-medium sticky left-0 bg-slate-900/95 z-10 w-[240px] min-w-[240px]">
                    Technician
                  </th>
                  <th className="px-2 py-2 font-medium whitespace-nowrap sticky left-[240px] bg-slate-900/95 z-10">
                    Total (h)
                  </th>
                  {dayLabels.map(({ key, label }) => (
                    <th
                      key={key}
                      className="px-2 py-2 font-medium text-center w-12"
                      title={key}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.technicians.map((row) => (
                  <tr
                    key={row.technician.id}
                    className="border-t border-slate-700 hover:bg-slate-800/80"
                  >
                    <td className="px-3 py-2 sticky left-0 bg-slate-800 z-10 w-[240px] min-w-[240px]">
                      <div className="font-medium text-white">
                        {row.technician.name || row.technician.email}
                      </div>
                      <div className="text-xs text-slate-500">{row.technician.email}</div>
                    </td>
                    <td className="px-2 py-2 text-white font-semibold whitespace-nowrap sticky left-[240px] bg-slate-800 z-10 w-[96px] min-w-[96px]">
                      {row.totalHoursInMonth.toFixed(1)} h
                    </td>
                    {dayKeys.map((key) => {
                      const h = row.hoursByDay[key] ?? 0;
                      return (
                        <td
                          key={key}
                          className="px-2 py-2 text-center text-slate-300 text-sm"
                        >
                          {h > 0 ? h.toFixed(1) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
