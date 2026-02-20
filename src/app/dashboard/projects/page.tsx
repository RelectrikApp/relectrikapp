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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="px-4 py-2 rounded-lg bg-relectrik-orange text-black font-medium hover:opacity-90"
        >
          New project
        </Link>
      </div>
      <div className="rounded-xl border border-slate-700 overflow-hidden">
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
