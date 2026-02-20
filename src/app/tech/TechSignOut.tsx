"use client";

import { signOut } from "next-auth/react";

export function TechSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/tech/login" })}
      className="text-sm text-slate-400 hover:text-white"
    >
      Sign out
    </button>
  );
}
