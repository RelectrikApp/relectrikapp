"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RightElectrikLogo } from "@/components/ui/RightElectrikLogo";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorText("Missing verification link");
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setStatus("success");
        else {
          setStatus("error");
          setErrorText(data.error || "Invalid or expired link");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorText("Network error");
      });
  }, [token]);

  return (
    <main className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-xl text-center">
          <div className="flex justify-center mb-6">
            <RightElectrikLogo width={160} height={67} />
          </div>
          {status === "loading" && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Verifying your email</h1>
              <p className="text-slate-400 text-sm">Please wait…</p>
            </>
          )}
          {status === "success" && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Account activated</h1>
              <p className="text-slate-400 text-sm mb-6">Your email is verified. You can sign in now.</p>
              <Link
                href="/tech/login"
                className="block w-full py-3 rounded-lg bg-relectrik-orange text-black font-semibold text-center hover:opacity-90"
              >
                Sign in
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Verification failed</h1>
              <p className="text-red-400 text-sm mb-6">{errorText}</p>
              <Link href="/tech/register" className="text-relectrik-orange font-medium hover:underline">Sign up again</Link>
              <p className="mt-4">
                <Link href="/tech/login" className="text-sm text-white/80 hover:text-white">← Back to Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1a1a1a] rounded-2xl p-8 shadow-xl text-center">
            <div className="flex justify-center mb-6">
              <RightElectrikLogo width={160} height={67} />
            </div>
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
