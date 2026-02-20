"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "INVOICED", label: "Invoiced" },
  { value: "PAID", label: "Paid" },
];

type Project = {
  id: string;
  clientName: string;
  clientPhone: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string | null;
  status: string;
  estimatedCost: number | null;
  assignedTechnicianId: string | null;
  createdAt: Date;
  startDate: Date | null;
  completedDate: Date | null;
  assignedTechnician: { id: string; name: string | null; email: string } | null;
};

export function ProjectDetail({ project }: { project: Project }) {
  const router = useRouter();
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Client</h3>
          <p className="text-white">{project.clientName}</p>
          {project.clientPhone && (
            <p className="text-slate-300 text-sm mt-1">{project.clientPhone}</p>
          )}
        </div>
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Address</h3>
          <p className="text-white">{project.address}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Assigned technician</h3>
          <p className="text-white">
            {project.assignedTechnician?.name ?? project.assignedTechnician?.email ?? "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Estimated cost</h3>
          <p className="text-white">
            {project.estimatedCost != null
              ? `$${project.estimatedCost.toLocaleString()}`
              : "—"}
          </p>
        </div>
      </div>
      {project.description && (
        <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Description</h3>
          <p className="text-white whitespace-pre-wrap">{project.description}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-slate-300 text-sm font-medium">Status:</label>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <a
          href={`/dashboard/projects/${project.id}/edit`}
          className="text-relectrik-orange hover:underline text-sm"
        >
          Edit project
        </a>
      </div>
    </div>
  );
}
