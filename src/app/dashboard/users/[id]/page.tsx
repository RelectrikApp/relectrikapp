import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { UserForm } from "@/components/features/users/UserForm";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      department: true,
    },
  });
  if (!user) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/users"
          className="text-slate-400 hover:text-white text-sm"
        >
          ← Back to users
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6">Edit user</h1>
      <UserForm user={user} />
    </div>
  );
}
