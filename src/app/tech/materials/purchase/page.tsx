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

export default function MaterialPurchasePage() {
  const [session, setSession] = useState<WorkSession | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [items, setItems] = useState<{ name: string; quantity: string; unitCost: string }[]>([
    { name: "", quantity: "1", unitCost: "" },
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
      if (sessionRes.ok) {
        const d = await sessionRes.json();
        setSession(d.isActive ? d.session : null);
      }
      if (projectsRes.ok) {
        const p = await projectsRes.json();
        setProjects(p);
      }
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setItems([...items, { name: "", quantity: "1", unitCost: "" }]);
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
    const projectId = session.project?.id || projects[0]?.id;
    if (!projectId) {
      setError("No project assigned.");
      return;
    }
    const cost = parseFloat(totalCost);
    if (isNaN(cost) || cost < 0) {
      setError("Invalid total cost.");
      return;
    }
    const parsedItems = items
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: Math.max(1, parseInt(i.quantity) || 1),
        unitCost: i.unitCost ? parseFloat(i.unitCost) : undefined,
      }));
    if (parsedItems.length === 0) {
      setError("Add at least one item.");
      return;
    }

    setSubmitLoading(true);
    setError("");
    try {
      const res = await fetch("/api/material-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          projectId,
          supplierName: supplierName.trim() || undefined,
          supplierAddress: supplierAddress.trim() || undefined,
          items: parsedItems,
          totalCost: cost,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setSuccess(true);
      setItems([{ name: "", quantity: "1", unitCost: "" }]);
      setTotalCost("");
      setSupplierName("");
      setSupplierAddress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record purchase");
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
            <h1 className="text-xl font-semibold text-white mb-2">Add Purchase</h1>
            <p className="text-amber-400 text-sm">
              You must <strong>Punch In</strong> first to record a purchase.
            </p>
            <Link
              href="/tech"
              className="mt-4 inline-block px-6 py-3 bg-relectrik-orange text-black rounded-lg font-medium"
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
          <h1 className="text-xl font-semibold text-white mb-4">Add Purchase</h1>
          {success && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded text-green-200 text-sm">
              Purchase recorded successfully.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-1">Project</label>
              <input
                type="text"
                readOnly
                value={session.project?.clientName || projects[0]?.clientName || "—"}
                className="w-full px-4 py-2 rounded bg-slate-700 text-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Supplier (optional)</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier name"
                className="w-full px-4 py-2 rounded bg-[#2a2a2a] border border-slate-600 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Supplier address (optional)</label>
              <input
                type="text"
                value={supplierAddress}
                onChange={(e) => setSupplierAddress(e.target.value)}
                placeholder="Address"
                className="w-full px-4 py-2 rounded bg-[#2a2a2a] border border-slate-600 text-white"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 text-sm">Items</label>
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
                      placeholder="Item name"
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
                      step="0.01"
                      min="0"
                      placeholder="Unit $"
                      value={item.unitCost}
                      onChange={(e) =>
                        setItems(items.map((it, j) => (j === i ? { ...it, unitCost: e.target.value } : it)))
                      }
                      className="w-20 px-2 py-2 rounded bg-[#2a2a2a] border border-slate-600 text-white text-sm"
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
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Total cost ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 rounded bg-[#2a2a2a] border border-slate-600 text-white"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-3 rounded-lg bg-relectrik-orange text-black font-semibold disabled:opacity-60"
            >
              {submitLoading ? "Saving…" : "Save purchase"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
