"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardSignOut } from "./DashboardSignOut";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/technician-connection-times", label: "Connection times" },
  { href: "/dashboard/map", label: "Live Map" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/ai", label: "AI Assistant" },
];

const linkClass =
  "text-slate-300 hover:text-white text-sm block py-2 md:py-0 md:inline";

export function DashboardNav({
  email,
}: {
  email: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="md:hidden p-2 text-slate-400 hover:text-white"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {mobileOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      <nav
        className={`${
          mobileOpen
            ? "flex flex-col absolute top-full left-0 right-0 bg-[#0f172a] border-b border-slate-700 py-4 px-4 shadow-lg"
            : "hidden"
        } md:flex md:flex-row md:static md:border-0 md:shadow-none md:py-0 md:px-0 gap-4 items-center`}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={linkClass}
            onClick={() => setMobileOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <span className="text-slate-500 text-sm truncate max-w-[140px] md:max-w-[200px] px-2 py-2 md:py-0">
          {email}
        </span>
        <div onClick={() => setMobileOpen(false)}>
          <DashboardSignOut />
        </div>
      </nav>
    </>
  );
}
