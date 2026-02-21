import { auth } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { isAdminOrCEO } from "@/lib/utils/role";
import Link from "next/link";
import { DashboardNav } from "@/components/features/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  if (!isAdminOrCEO(session)) redirect("/tech");

  return (
    <div className="min-h-screen bg-[#0f172a] overflow-x-hidden">
      <header className="border-b border-slate-700 bg-[#0f172a]/95 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between relative">
          <Link href="/dashboard" className="text-lg font-bold text-white shrink-0">
            Relectrikapp
          </Link>
          <div className="flex items-center gap-2">
            <DashboardNav email={session.user.email ?? ""} />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-4 md:py-6">{children}</main>
    </div>
  );
}
