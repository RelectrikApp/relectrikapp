import { auth } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { isAdminOrCEO } from "@/lib/utils/role";
import Link from "next/link";
import { DashboardSignOut } from "@/components/features/dashboard/DashboardSignOut";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (!isAdminOrCEO(session)) redirect("/tech");

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <header className="border-b border-slate-700 bg-[#0f172a]/95 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold text-white">
            Relectrikapp
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/dashboard"
              className="text-slate-300 hover:text-white text-sm"
            >
              Home
            </Link>
            <Link
              href="/dashboard/users"
              className="text-slate-300 hover:text-white text-sm"
            >
              Users
            </Link>
            <Link
              href="/dashboard/projects"
              className="text-slate-300 hover:text-white text-sm"
            >
              Projects
            </Link>
            <Link
              href="/dashboard/ai"
              className="text-slate-300 hover:text-white text-sm"
            >
              AI Assistant
            </Link>
            <span className="text-slate-500 text-sm">
              {session.user.email}
            </span>
            <DashboardSignOut />
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
