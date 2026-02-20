"use client";

import { useState } from "react";
import Link from "next/link";
import { RightElectrikLogo } from "@/components/ui/RightElectrikLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<"success" | "error" | null>(null);
  const [errorText, setErrorText] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorText("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage("error");
        setErrorText(data.error || "Something went wrong");
        return;
      }
      setMessage("success");
    } catch {
      setMessage("error");
      setErrorText("Network error");
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
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Reset password
          </h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {message === "success" ? (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-200 text-sm text-center">
              If an account exists for that email, you will receive a reset link. Check your inbox and spam folder.
            </div>
          ) : (
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
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-relectrik-orange"
                />
              </div>
              {message === "error" && (
                <p className="text-red-400 text-sm">{errorText}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="block w-full py-3 rounded-lg bg-relectrik-orange text-black font-semibold text-center hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <Link
            href="/tech/login"
            className="block w-full py-3 mt-4 rounded-lg border border-slate-600 text-slate-300 text-center hover:bg-slate-800"
          >
            Back to Sign in
          </Link>
          <p className="text-center mt-4">
            <Link href="/" className="text-sm text-white/80 hover:text-white">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
