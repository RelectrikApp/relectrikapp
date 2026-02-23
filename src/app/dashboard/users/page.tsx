import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  TECHNICIAN: "Technician",
  CEO: "CEO",
};
const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  BLOCKED: "Blocked",
};

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      department: true,
      workSessions: {
        where: { isActive: true },
        take: 1,
        select: { id: true },
      },
    },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Users</h1>
        <Link
          href="/dashboard/users/new"
          className="px-4 py-2 min-h-[44px] flex items-center justify-center rounded-lg bg-relectrik-orange text-black font-medium hover:opacity-90 w-fit"
        >
          New user
        </Link>
      </div>

      {/* Mobile: card layout */}
      <div className="md:hidden space-y-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{u.name ?? "—"}</p>
                  <p className="text-sm text-slate-400">{u.email}</p>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                    u.status === "ACTIVE"
                      ? "text-green-600 bg-green-900/40"
                      : "text-red-400 bg-red-900/40"
                  }`}
                >
                  {statusLabels[u.status] ?? u.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                <span>
                  <span className="text-slate-500">Role:</span>{" "}
                  {roleLabels[u.role] ?? u.role}
                </span>
                {u.role === "TECHNICIAN" && (
                  <span>
                    <span className="text-slate-500">Session:</span>{" "}
                    {u.workSessions.length > 0 ? (
                      <span className="text-green-400">In</span>
                    ) : (
                      <span className="text-slate-400">Out</span>
                    )}
                  </span>
                )}
                {u.department && (
                  <span>
                    <span className="text-slate-500">Dept:</span> {u.department}
                  </span>
                )}
              </div>
              <Link
                href={`/dashboard/users/${u.id}`}
                className="inline-block mt-3 px-4 py-2 rounded-lg bg-relectrik-orange text-black font-medium text-sm hover:opacity-90"
              >
                Edit
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {users.map((u) => (
              <tr key={u.id} className="text-white hover:bg-slate-800/50">
                <td className="px-4 py-3">{u.name ?? "—"}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{roleLabels[u.role] ?? u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      u.status === "ACTIVE"
                        ? "text-relectrik-success"
                        : "text-red-400"
                    }
                  >
                    {statusLabels[u.status] ?? u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.role === "TECHNICIAN" ? (
                    u.workSessions.length > 0 ? (
                      <span className="text-green-400 font-medium">In</span>
                    ) : (
                      <span className="text-slate-400">Out</span>
                    )
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">{u.department ?? "—"}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/users/${u.id}`}
                    className="text-relectrik-orange hover:underline text-sm"
                  >
                    Edit
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
