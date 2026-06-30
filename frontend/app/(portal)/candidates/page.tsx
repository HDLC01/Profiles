"use client";

import { useEffect, useState } from "react";
import { useApi, type CandidatesEnvelope, type Sort } from "../../lib/api";
import CandidateCard from "../../components/CandidateCard";

const SORTS: { value: Sort; label: string }[] = [
  { value: "new", label: "Newest first" },
  { value: "alpha", label: "Name (A–Z)" },
  { value: "price_asc", label: "Rate: low to high" },
  { value: "price_desc", label: "Rate: high to low" },
];

export default function CandidatesPage() {
  const api = useApi();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CandidatesEnvelope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await api.listCandidates({ q: debouncedQ || undefined, sort, page });
        if (active) setData(d);
      } catch (e) {
        if (active) setError((e as Error)?.message || "Failed to load candidates");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [api, debouncedQ, sort, page]);

  const hasFilters = q !== "" || sort !== "new";

  return (
    <div className="space-y-6">
      {/* hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-6 py-8 text-white sm:px-10 sm:py-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-200 ring-1 ring-white/15">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Pre-assessed talent
        </span>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Find your next accountant.</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Every candidate is screened on accounting, software, and critical thinking. Review profiles, shortlist your favorites, and book an interview.
        </p>
      </section>

      {/* toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-[2.5rem]">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Candidates</h2>
          {data && (
            <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
              <span className="tnum">{data.items.length}</span> of <span className="tnum">{data.total}</span>
              {hasFilters && (
                <button onClick={() => { setQ(""); setSort("new"); setPage(1); }} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
                  Clear
                </button>
              )}
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or skill…"
              aria-label="Search candidates"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 sm:w-56"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as Sort); setPage(1); }}
            aria-label="Sort candidates"
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 sm:w-auto"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />)}
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">No candidates found</p>
          <p className="mt-1 text-xs text-slate-500">{hasFilters ? "Try clearing your search or filters." : "Candidates will appear here once they're published."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data?.items.map((c, i) => <CandidateCard key={c.id} c={c} index={i} />)}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Prev</button>
          <span className="tnum text-sm text-slate-500">Page {data.page} of {data.total_pages}</span>
          <button disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
