"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { RightElectrikLogo } from "@/components/ui/RightElectrikLogo";

export default function TechLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/tech";
  const showRegisteredMessage = searchParams.get("registered") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const blockRes = await fetch("/api/tech/check-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const blockData = await blockRes.json();
      if (blockData.blocked && blockData.blockedUntil) {
        const until = new Date(blockData.blockedUntil);
        setError(`Access blocked until 6:00 AM tomorrow (${until.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}). If you went offline without Punching Out, the app blocks sign-in until then.`);
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Invalid email or password.");
        return;
      }
      await router.refresh();
      router.push(callbackUrl);
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
            Sign in
          </h1>
          {showRegisteredMessage && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-200 text-sm text-center">
              Account created. You can sign in now.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-relectrik-orange focus:border-transparent"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[#3a3a3a] bg-[#2a2a2a] text-relectrik-orange focus:ring-relectrik-orange"
                />
                <span className="text-white text-sm">Remember me</span>
              </label>
              <Link
                href="/tech/forgot-password"
                className="text-sm text-relectrik-orange hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-relectrik-orange text-black font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-relectrik-orange focus:ring-offset-2 focus:ring-offset-[#1a1a1a] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="text-center text-white text-sm mt-6">
            Don't have an account?{" "}
            <Link href="/tech/register" className="text-relectrik-orange font-medium hover:underline">
              Sign up
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
