import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ProjectDetail } from "@/components/features/projects/ProjectDetail";

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  INVOICED: "Invoiced",
  PAID: "Paid",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      assignedTechnician: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  if (!project) notFound();

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
      <h1 className="text-2xl font-bold text-white mb-2">{project.clientName}</h1>
      <p className="text-slate-400 text-sm mb-6">
        Status: {statusLabels[project.status] ?? project.status}
      </p>
      <ProjectDetail project={project} />
    </div>
  );
}
