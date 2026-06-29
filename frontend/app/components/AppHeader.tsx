"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useMe } from "../lib/useMe";

const NAV = [
  { href: "/candidates", label: "Browse", match: (p: string) => p === "/candidates" || p.startsWith("/candidate") },
  { href: "/shortlist", label: "Shortlist", match: (p: string) => p.startsWith("/shortlist") },
  { href: "/book", label: "Book a Call", match: (p: string) => p.startsWith("/book") },
];
const ADMIN_LINK = { href: "/admin/candidates", label: "Admin", match: (p: string) => p.startsWith("/admin") };

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${
        active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AppHeader() {
  const pathname = usePathname() || "";
  const { isAdmin } = useMe();
  const nav = isAdmin ? [...NAV, ADMIN_LINK] : NAV;
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/candidates" className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-sm shadow-blue-600/25">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 8h9" opacity="0.5" />
              <path d="M5 12h6" opacity="0.5" />
              <path d="M5 17l4-4 3 2 6-7" />
            </svg>
          </span>
          <span className="text-[17px] font-extrabold tracking-tight text-slate-900">Ledgerline</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex" aria-label="Primary">
          {nav.map((n) => <NavLink key={n.href} href={n.href} label={n.label} active={n.match(pathname)} />)}
        </nav>

        <div className="flex-1" />
        <div className="rounded-full ring-1 ring-slate-200">
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1.5 sm:hidden" aria-label="Primary">
        {NAV.map((n) => <NavLink key={n.href} href={n.href} label={n.label} active={n.match(pathname)} />)}
      </nav>
    </header>
  );
}
