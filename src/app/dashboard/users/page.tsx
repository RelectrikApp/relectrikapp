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
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <Link
          href="/dashboard/users/new"
          className="px-4 py-2 rounded-lg bg-relectrik-orange text-black font-medium hover:opacity-90"
        >
          New user
        </Link>
      </div>
      <div className="rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-300 text-sm">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
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
