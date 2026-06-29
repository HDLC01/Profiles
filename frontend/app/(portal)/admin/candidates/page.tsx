"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useApi, type CandidatesEnvelope } from "../../../lib/api";
import AdminTabs from "../../../components/AdminTabs";
import { formatRate, initials } from "../../../lib/format";

const STATUS_FILTERS = ["", "new", "active", "archived"];
const STATUS_STYLE: Record<string, string> = {
  new: "bg-sky-50 text-sky-700 ring-sky-100",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  archived: "bg-slate-100 text-slate-500 ring-slate-200",
};

export default function AdminCandidates() {
  const api = useApi();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CandidatesEnvelope | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setError(null);
      try {
        const d = await api.listCandidates({ status: status || undefined, q: q || undefined, page });
        if (active) setData(d);
      } catch (e) {
        if (active) setError((e as Error)?.message || "Failed to load");
      }
    })();
    return () => { active = false; };
  }, [api, status, q, page, reloadKey]);

  const togglePublish = useCallback(async (id: string) => {
    setBusyId(id);
    try {
      const full = await api.getCandidate(id);
      await api.updateCandidate(id, {
        full_name: full.full_name, role_title: full.role_title, about: full.about,
        experience_label: full.experience_label, price_monthly: full.price_monthly,
        availability: full.availability, location: full.location, credential: full.credential,
        photo_url: full.photo_url, intro_video_url: full.intro_video_url, resume_url: full.resume_url,
        status: full.status, is_published: !full.is_published,
        assess_job_id: full.assess_job_id, assess_candidate_id: full.assess_candidate_id,
        skill_ids: full.skill_ids, software_ids: full.software_ids,
        assessments: full.assessments.map((a) => ({ assessment_id: a.assessment_id, rating: a.rating })),
      });
      setReloadKey((k) => k + 1);
    } finally { setBusyId(null); }
  }, [api]);

  const remove = useCallback(async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This permanently removes the candidate and cannot be undone.`)) return;
    setBusyId(id);
    try { await api.deleteCandidate(id); setReloadKey((k) => k + 1); }
    finally { setBusyId(null); }
  }, [api]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AdminTabs />
        <Link href="/admin/candidates/new" className="rounded-lg bg-gradient-to-br from-sky-600 to-blue-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110">+ New candidate</Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button key={s || "all"} onClick={() => { setStatus(s); setPage(1); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${status === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search…" className="ml-auto w-48 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25" />
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {data?.items.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No candidates. <Link href="/admin/candidates/new" className="font-bold text-sky-700">Add one →</Link></p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data?.items.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                {c.photo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.photo_url} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
                  : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">{initials(c.full_name)}</span>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{c.full_name} {c.credential && <span className="text-[10px] font-bold text-sky-700">· {c.credential}</span>}</p>
                  <p className="truncate text-xs text-slate-500">{c.role_title} · <span className="tnum">{formatRate(c.price_monthly)}</span>/mo</p>
                </div>
                <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 sm:inline ${STATUS_STYLE[c.status] || "bg-slate-100 text-slate-500 ring-slate-200"}`}>{c.status}</span>
                <button onClick={() => togglePublish(c.id)} disabled={busyId === c.id} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50 ${c.is_published ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {c.is_published ? "Published" : "Draft"}
                </button>
                <Link href={`/admin/candidates/${c.id}`} className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</Link>
                <button onClick={() => remove(c.id, c.full_name)} disabled={busyId === c.id} aria-label={`Delete ${c.full_name}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6M10 11v6M14 11v6" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-40">Prev</button>
          <span className="tnum text-sm text-slate-500">Page {data.page} of {data.total_pages}</span>
          <button disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
