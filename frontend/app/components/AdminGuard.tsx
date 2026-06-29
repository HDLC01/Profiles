"use client";

import Link from "next/link";
import { useMe } from "../lib/useMe";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { loading, isAdmin } = useMe();
  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />;
  if (!isAdmin)
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm font-semibold text-slate-700">Admin access required</p>
        <p className="mt-1 text-xs text-slate-500">This area is for Ledgerline staff.</p>
        <Link href="/candidates" className="mt-3 inline-block text-sm font-bold text-sky-700">← Back to browse</Link>
      </div>
    );
  return <>{children}</>;
}
