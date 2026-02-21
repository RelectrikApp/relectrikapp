import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  INVOICED: "Invoiced",
  PAID: "Paid",
};

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      assignedTechnician: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="px-4 py-2 min-h-[44px] flex items-center justify-center rounded-lg bg-relectrik-orange text-black font-medium hover:opacity-90 w-fit"
        >
          New project
        </Link>
      </div>

      {/* Mobile: card layout */}
      <div className="md:hidden space-y-4">
        {projects.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-white">{p.clientName}</h3>
                <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                  {statusLabels[p.status] ?? p.status}
                </span>
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">{p.address}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                <span>
                  <span className="text-slate-500">Technician:</span>{" "}
                  {p.assignedTechnician?.name ?? "—"}
                </span>
                {p.estimatedCost != null && (
                  <span>
                    <span className="text-slate-500">Est:</span> $
                    {p.estimatedCost.toLocaleString()}
                  </span>
                )}
              </div>
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="inline-block mt-3 px-4 py-2 rounded-lg bg-relectrik-orange text-black font-medium text-sm hover:opacity-90"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-300 text-sm">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Technician</th>
              <th className="px-4 py-3">Est. cost</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {projects.map((p) => (
              <tr key={p.id} className="text-white hover:bg-slate-800/50">
                <td className="px-4 py-3">{p.clientName}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{p.address}</td>
                <td className="px-4 py-3">
                  <span className="text-slate-300">
                    {statusLabels[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.assignedTechnician?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {p.estimatedCost != null ? `$${p.estimatedCost.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/projects/${p.id}`}
                    className="text-relectrik-orange hover:underline text-sm"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
