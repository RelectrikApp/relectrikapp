"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Technician = { id: string; name: string | null; email: string };

export function ProjectForm({
  project,
  technicians,
}: {
  project?: {
    id: string;
    clientName: string;
    clientPhone: string | null;
    address: string;
    description: string | null;
    status: string;
    estimatedCost: number | null;
    assignedTechnicianId: string | null;
  };
  technicians?: Technician[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [techList, setTechList] = useState<Technician[]>(technicians ?? []);
  const [form, setForm] = useState({
    clientName: project?.clientName ?? "",
    clientPhone: project?.clientPhone ?? "",
    address: project?.address ?? "",
    description: project?.description ?? "",
    estimatedCost: project?.estimatedCost?.toString() ?? "",
    assignedTechnicianId: project?.assignedTechnicianId ?? "",
  });

  useEffect(() => {
    if (technicians?.length) return;
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        const techs = Array.isArray(data) ? data.filter((u: { role: string }) => u.role === "TECHNICIAN") : [];
        setTechList(techs);
      })
      .catch(() => {});
  }, [technicians?.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = {
        clientName: form.clientName,
        clientPhone: form.clientPhone || undefined,
        address: form.address,
        description: form.description || undefined,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        assignedTechnicianId: form.assignedTechnicianId || null,
      };
      if (project) {
        const res = await fetch(`/api/projects/${project.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Error saving");
          return;
        }
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Error creating project");
          return;
        }
      }
      router.push("/dashboard/projects");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Client
        </label>
        <input
          type="text"
          value={form.clientName}
          onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
          required
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Client phone
        </label>
        <input
          type="text"
          value={form.clientPhone}
          onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Address
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          required
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Estimated cost
        </label>
        <input
          type="number"
          step="0.01"
          value={form.estimatedCost}
          onChange={(e) => setForm((f) => ({ ...f, estimatedCost: e.target.value }))}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Assigned technician
        </label>
        <select
          value={form.assignedTechnicianId}
          onChange={(e) => setForm((f) => ({ ...f, assignedTechnicianId: e.target.value }))}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
        >
          <option value="">Unassigned</option>
          {techList.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name ?? t.email}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-relectrik-orange text-black font-medium hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Saving…" : project ? "Save" : "Create project"}
      </button>
    </form>
  );
}
