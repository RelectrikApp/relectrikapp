import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ProjectForm } from "@/components/features/projects/ProjectForm";

export default async function EditProjectPage({
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

  const technicians = await prisma.user.findMany({
    where: { role: "TECHNICIAN" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/projects/${id}`}
          className="text-slate-400 hover:text-white text-sm"
        >
          ← Back to project
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-white mb-6">Edit project</h1>
      <ProjectForm
        project={{
          id: project.id,
          clientName: project.clientName,
          clientPhone: project.clientPhone,
          address: project.address,
          description: project.description,
          status: project.status,
          estimatedCost: project.estimatedCost,
          assignedTechnicianId: project.assignedTechnicianId,
        }}
        technicians={technicians}
      />
    </div>
  );
}
