import Link from "next/link";
import { ProjectForm } from "@/components/features/projects/ProjectForm";

export default function NewProjectPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/projects"
          className="text-slate-400 hover:text-white text-sm"
        >
          ← Back to projects
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6">New project</h1>
      <ProjectForm />
    </div>
  );
}
