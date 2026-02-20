"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RightElectrikLogo } from "@/components/ui/RightElectrikLogo";

export default function TechRegisterPage() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          lastName,
          email,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error;
        setError(
          typeof msg === "string"
            ? msg
            : msg && typeof msg === "object" && !Array.isArray(msg)
              ? Object.entries(msg)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                  .join("; ") || "Error creating account."
              : "Error creating account."
        );
        return;
      }
      router.push("/tech/login?registered=1");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <RightElectrikLogo width={160} height={67} />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-6">
            Create account
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-white text-sm font-medium mb-1">
                  First name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-white text-sm font-medium mb-1">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-white text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-white text-sm font-medium mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-[#3a3a3a] bg-[#2a2a2a] text-relectrik-orange focus:ring-relectrik-orange"
              />
              <span className="text-white text-sm">Remember me</span>
            </label>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-relectrik-orange text-black font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-relectrik-orange focus:ring-offset-2 focus:ring-offset-[#1a1a1a] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>
          <p className="text-center text-white text-sm mt-6">
            Already have an account?{" "}
            <Link href="/tech/login" className="text-relectrik-orange font-medium hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-center mt-4">
            <Link
              href="/"
              className="text-sm text-white/80 hover:text-white inline-flex items-center gap-1"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
