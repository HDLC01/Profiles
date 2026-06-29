"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApi, type CandidateCard as Card } from "../../lib/api";
import CandidateCard from "../../components/CandidateCard";

export default function ShortlistPage() {
  const api = useApi();
  const [items, setItems] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.listShortlist()
      .then((d) => { if (active) setItems(d.items); })
      .catch((e) => { if (active) setError(e?.message || "Failed to load"); });
    return () => { active = false; };
  }, [api]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">My Shortlist</h1>
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {items === null ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">Your shortlist is empty</p>
          <p className="mt-1 text-xs text-slate-500">Star candidates from their profile to compare them here.</p>
          <Link href="/candidates" className="mt-3 inline-block text-sm font-bold text-sky-700">Browse candidates →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((c, i) => <CandidateCard key={c.id} c={c} index={i} />)}</div>
      )}
    </div>
  );
}
