"use client";

import Link from "next/link";

export default function MaterialPurchasePage() {
  return (
    <main className="min-h-screen bg-[#0f172a] p-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link
            href="/tech"
            className="text-slate-400 hover:text-white text-sm inline-flex items-center gap-1"
          >
            ← Back to home
          </Link>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-white mb-2">Add Purchase</h1>
          <p className="text-slate-400 text-sm mb-6">
            Log material purchases for your current job. You must be <strong className="text-slate-300">Punched In</strong> and have a project assigned to record a purchase.
          </p>
          <p className="text-slate-500 text-sm">
            This form is not yet implemented. Return to the home screen and ensure you are punched in with an assigned project; the full purchase form will be available in a future update.
          </p>
          <Link
            href="/tech"
            className="mt-6 inline-block px-6 py-3 bg-relectrik-orange text-black rounded-lg font-medium hover:opacity-90"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
