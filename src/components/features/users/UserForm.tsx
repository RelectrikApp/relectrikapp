"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  department: string | null;
};

export function UserForm({ user }: { user?: User }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "TECHNICIAN",
    status: user?.status ?? "ACTIVE",
    department: user?.department ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (user) {
        const body: Record<string, string> = {
          name: form.name,
          role: form.role,
          status: form.status,
          department: form.department,
        };
        if (form.password) body.password = form.password;
        const res = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error?.password?.[0] ?? data.error ?? "Error saving");
          return;
        }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            department: form.department || undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Error creating user");
          return;
        }
      }
      router.push("/dashboard/users");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Email
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          disabled={!!user}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent disabled:opacity-60"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Password {user && "(leave blank to keep unchanged)"}
        </label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required={!user}
          minLength={8}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Role
        </label>
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
        >
          <option value="TECHNICIAN">Technician</option>
          <option value="ADMIN">Admin</option>
          <option value="CEO">CEO</option>
        </select>
      </div>
      {user && (
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
          >
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      )}
      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Department
        </label>
        <input
          type="text"
          value={form.department}
          onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
          className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-relectrik-orange text-black font-medium hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Saving…" : user ? "Save" : "Create user"}
      </button>
    </form>
  );
}
