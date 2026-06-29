"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/taxonomies", label: "Taxonomies" },
];

export default function AdminTabs() {
  const p = usePathname() || "";
  return (
    <div className="flex items-center gap-1">
      {TABS.map((t) => {
        const active = p.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
