"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface WorkSession {
  id: string;
  project?: { id: string; clientName: string };
}
interface Project {
  id: string;
  clientName: string;
}

export default function MaterialUsagePage() {
  const [session, setSession] = useState<WorkSession | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [items, setItems] = useState<{ name: string; quantity: string; returned: string }[]>([
    { name: "", quantity: "1", returned: "0" },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [sessionRes, projectsRes] = await Promise.all([
        fetch("/api/work-sessions/current"),
        fetch("/api/projects/assigned"),
      ]);
      let sess: WorkSession | null = null;
      if (sessionRes.ok) {
        const d = await sessionRes.json();
        sess = d.isActive ? d.session : null;
        setSession(sess);
      }
      let projs: Project[] = [];
      if (projectsRes.ok) {
        const p = await projectsRes.json();
        projs = p;
        setProjects(p);
      }
      if (sess?.project?.id) setSelectedProjectId(sess.project.id);
      else if (projs[0]) setSelectedProjectId((prev) => prev || projs[0].id);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setItems([...items, { name: "", quantity: "1", returned: "0" }]);
  }
  function removeItem(i: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.id) {
      setError("Punch in first.");
      return;
    }
    const projectId = selectedProjectId || session.project?.id || projects[0]?.id;
    if (!projectId) {
      setError("Select a project.");
      return;
    }
    const parsedItems = items
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: Math.max(1, parseInt(i.quantity) || 1),
        returned: Math.max(0, parseInt(i.returned) || 0),
      }));
    if (parsedItems.length === 0) {
      setError("Add at least one item.");
      return;
    }

    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch("/api/material-usages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          projectId,
          itemsUsed: parsedItems,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setSuccess(true);
      setItems([{ name: "", quantity: "1", returned: "0" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record usage");
    } finally {
      setSubmitLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f172a] p-4 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#0f172a] p-4">
        <div className="max-w-lg mx-auto">
          <Link href="/tech" className="text-slate-400 hover:text-white text-sm">
            ← Back
          </Link>
          <div className="bg-slate-800 rounded-lg p-6 mt-4">
            <h1 className="text-xl font-semibold text-white mb-2">Record Usage</h1>
            <p className="text-amber-400 text-sm">
              You must <strong>Punch In</strong> first to record material usage.
            </p>
            <Link
              href="/tech"
              className="mt-4 inline-block px-6 py-3 border border-slate-600 text-slate-300 rounded-lg font-medium hover:bg-slate-700"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f172a] p-4">
      <div className="max-w-lg mx-auto">
        <Link href="/tech" className="text-slate-400 hover:text-white text-sm">
          ← Back to home
        </Link>
        <div className="bg-slate-800 rounded-lg p-6 mt-4">
          <h1 className="text-xl font-semibold text-white mb-4">Record Usage</h1>
          {success && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-200 text-sm">
              Usage recorded successfully.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-1">Project *</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="w-full px-4 py-2 rounded bg-[#2a2a2a] border border-slate-600 text-white"
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.clientName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 text-sm">Materials used</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-relectrik-orange hover:underline"
                >
                  + Add item
                </button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      placeholder="Material name"
                      value={item.name}
                      onChange={(e) =>
                        setItems(items.map((it, j) => (j === i ? { ...it, name: e.target.value } : it)))
                      }
                      className="flex-1 px-3 py-2 rounded bg-[#2a2a2a] border border-slate-600 text-white text-sm"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        setItems(items.map((it, j) => (j === i ? { ...it, quantity: e.target.value } : it)))
                      }
                      className="w-16 px-2 py-2 rounded bg-[#2a2a2a] border border-slate-600 text-white text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Ret"
                      value={item.returned}
                      onChange={(e) =>
                        setItems(items.map((it, j) => (j === i ? { ...it, returned: e.target.value } : it)))
                      }
                      className="w-14 px-2 py-2 rounded bg-[#2a2a2a] border border-slate-600 text-white text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-red-400 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">Ret = returned quantity</p>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-3 rounded-lg border border-slate-600 text-slate-300 font-semibold hover:bg-slate-700 disabled:opacity-60"
            >
              {submitLoading ? "Saving…" : "Save usage"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
