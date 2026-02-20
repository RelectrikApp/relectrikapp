import Link from "next/link";
import { UserForm } from "@/components/features/users/UserForm";

export default function NewUserPage() {
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
      <h1 className="text-2xl font-bold text-white mb-6">New user</h1>
      <UserForm />
    </div>
  );
}
