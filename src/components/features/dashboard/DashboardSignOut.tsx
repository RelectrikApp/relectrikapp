"use client";

import { signOut } from "next-auth/react";

export function DashboardSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-slate-500 hover:text-white text-sm"
    >
      Sign out
    </button>
  );
}
