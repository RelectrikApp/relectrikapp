"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RightElectrikLogo } from "@/components/ui/RightElectrikLogo";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<"success" | "error" | null>(null);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!token) setMessage("error");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || password !== confirm || password.length < 8) {
      setErrorText(password.length < 8 ? "Password must be at least 8 characters" : "Passwords do not match");
      setMessage("error");
      return;
    }
    setLoading(true);
    setMessage(null);
    setErrorText("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
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

  if (!token) {
    return (
      <main className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-xl text-center">
            <div className="flex justify-center mb-6">
            <RightElectrikLogo width={160} height={67} />
          </div>
            <h1 className="text-xl font-bold text-white mb-2">Invalid link</h1>
            <p className="text-slate-400 text-sm mb-6">This reset link is missing or invalid. Request a new one from the login page.</p>
            <Link href="/tech/forgot-password" className="text-relectrik-orange font-medium hover:underline">Request new link</Link>
            <p className="mt-4">
              <Link href="/tech/login" className="text-sm text-white/80 hover:text-white">← Back to Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <RightElectrikLogo width={160} height={67} />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Set new password
          </h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            Enter your new password below.
          </p>

          {message === "success" ? (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-200 text-sm text-center">
              Password updated. You can sign in now.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-white text-sm font-medium mb-1">New password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-relectrik-orange"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-white text-sm font-medium mb-1">Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white placeholder-[#888] focus:outline-none focus:ring-2 focus:ring-relectrik-orange"
                />
              </div>
              {message === "error" && <p className="text-red-400 text-sm">{errorText}</p>}
              <button
                type="submit"
                disabled={loading}
                className="block w-full py-3 rounded-lg bg-relectrik-orange text-black font-semibold text-center hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}

          <Link href="/tech/login" className="block w-full py-3 mt-4 rounded-lg border border-slate-600 text-slate-300 text-center hover:bg-slate-800">
            Back to Sign in
          </Link>
          <p className="text-center mt-4">
            <Link href="/" className="text-sm text-white/80 hover:text-white">← Back to home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-xl">
            <div className="flex justify-center mb-6">
              <RightElectrikLogo width={160} height={67} />
            </div>
            <div className="text-white text-center">Loading...</div>
          </div>
        </div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
