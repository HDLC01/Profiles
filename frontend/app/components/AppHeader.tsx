"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/candidates", label: "All Candidates", match: (p: string) => p === "/candidates" || p.startsWith("/candidate") },
  { href: "/shortlist", label: "My Shortlist", match: (p: string) => p.startsWith("/shortlist") },
  { href: "/book", label: "Book a Call", match: (p: string) => p.startsWith("/book") },
];

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AppHeader() {
  const pathname = usePathname() || "";
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/candidates" className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white">C</span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-indigo-500">Cloud Accountant Staffing</span>
            <span className="block text-sm font-extrabold tracking-tight text-slate-900">Candidate Portal</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex" aria-label="Primary">
          {NAV.map((n) => <NavLink key={n.href} href={n.href} label={n.label} active={n.match(pathname)} />)}
        </nav>

        <div className="flex-1" />
        <UserButton />
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1.5 sm:hidden" aria-label="Primary">
        {NAV.map((n) => <NavLink key={n.href} href={n.href} label={n.label} active={n.match(pathname)} />)}
      </nav>
    </header>
  );
}
