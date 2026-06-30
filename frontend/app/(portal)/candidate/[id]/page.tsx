"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApi, type CandidateFull } from "../../../lib/api";
import { useMe } from "../../../lib/useMe";

const ASSESS_BASE = "https://assess.wetreadwell.com";

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{children}</span>;
}

function ActionBtn({ href, onClick, children, primary }: { href?: string; onClick?: () => void; children: React.ReactNode; primary?: boolean }) {
  const cls = `inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 ${primary ? "bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-sm shadow-blue-600/25 hover:brightness-110" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}

export default function CandidateProfile() {
  const api = useApi();
  const { isAdmin } = useMe();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [c, setC] = useState<CandidateFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [cand, sl] = await Promise.all([api.getCandidate(id), api.listShortlist().catch(() => ({ items: [] }))]);
        if (!active) return;
        setC(cand);
        setShortlisted(sl.items.some((i) => i.id === cand.id));
      } catch (e) {
        const err = e as { status?: number; message?: string };
        if (active) setError(err?.status === 404 ? "Candidate not found." : (err?.message || "Failed to load"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [api, id]);

  const toggleShortlist = useCallback(async () => {
    if (!c || busy) return;
    setBusy(true);
    try {
      if (shortlisted) { await api.removeShortlist(c.id); setShortlisted(false); }
      else { await api.addShortlist(c.id); setShortlisted(true); }
    } finally { setBusy(false); }
  }, [api, c, shortlisted, busy]);

  if (loading) return <div className="h-96 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />;
  if (error || !c) return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
      <p className="text-sm font-semibold text-slate-700">{error || "Not found"}</p>
      <Link href="/candidates" className="mt-2 inline-block text-sm font-bold text-sky-700">← Back to candidates</Link>
    </div>
  );

  const first = c.full_name.split(" ")[0];
  const assessUrl = c.assess_job_id && c.assess_candidate_id ? `${ASSESS_BASE}/hire/${c.assess_job_id}/candidate/${c.assess_candidate_id}` : null;

  return (
    <div className="animate-rise space-y-6">
      <Link href="/candidates" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        Back to browse
      </Link>

      {/* hero */}
      <div className="flex flex-col gap-5 rounded-2xl bg-white p-5 ring-1 ring-slate-200 sm:flex-row">
        {c.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.photo_url} alt={c.full_name} className="h-40 w-40 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200" />
          : <div className="grid h-40 w-40 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-4xl font-extrabold text-slate-400">{c.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>}
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{c.full_name}</h1>
            {c.credential && <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-700 ring-1 ring-sky-100">{c.credential}</span>}
          </div>
          <p className="text-base font-semibold text-sky-700">{c.role_title}</p>
          <div className="flex flex-wrap gap-2">
            {c.intro_video_url && <ActionBtn href={c.intro_video_url}>Intro video</ActionBtn>}
            {c.resume_url && <ActionBtn href={c.resume_url}>Résumé</ActionBtn>}
            <ActionBtn onClick={toggleShortlist}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={shortlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={shortlisted ? "text-amber-500" : ""}><path d="m12 17.3-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.8 1.6 7z" /></svg>
              {shortlisted ? "Shortlisted" : "Shortlist"}
            </ActionBtn>
            <ActionBtn href="/book" primary>Book an interview →</ActionBtn>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Experience</p>
              <p className="text-xl font-extrabold text-slate-900">{c.experience_label || "—"}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Monthly rate</p>
              <p className="tnum text-xl font-extrabold text-slate-900">{c.price_monthly ? `$${c.price_monthly.toLocaleString()}` : "—"}<span className="text-sm font-medium text-slate-400">/mo</span></p>
            </div>
          </div>
          {c.about && (
            <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="mb-2 text-lg font-bold text-slate-900">About {first}</h2>
              <p className="max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{c.about}</p>
            </section>
          )}
          {c.skills.length > 0 && (
            <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="mb-3 text-lg font-bold text-slate-900">Skills</h2>
              <div className="flex flex-wrap gap-2">{c.skills.map((s) => <Chip key={s}>{s}</Chip>)}</div>
            </section>
          )}
          {c.software.length > 0 && (
            <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="mb-3 text-lg font-bold text-slate-900">Software</h2>
              <div className="flex flex-wrap gap-2">{c.software.map((s) => <Chip key={s}>{s}</Chip>)}</div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {c.assessments.length > 0 && (
            <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600" aria-hidden><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                Assessments
              </h2>
              <dl className="divide-y divide-slate-100">
                {c.assessments.map((a) => (
                  <div key={a.name} className="flex items-center justify-between py-2">
                    <dt className="text-sm text-slate-600">{a.name}</dt>
                    <dd className="text-sm font-bold text-slate-900">{a.rating}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {(c.personality_type || c.personality_summary || (isAdmin && assessUrl)) && (
            <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
              <h2 className="mb-2 text-lg font-bold text-slate-900">Personality</h2>
              {c.personality_type && <p className="text-base font-bold text-slate-900">{c.personality_type}</p>}
              {c.personality_summary && <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.personality_summary}</p>}
              {isAdmin && assessUrl && (
                <a href={assessUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-sky-700 hover:underline">View full Assess report ↗</a>
              )}
            </section>
          )}
          <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Availability</dt><dd className="font-semibold text-slate-800">{c.availability || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Location</dt><dd className="font-semibold text-slate-800">{c.location || "—"}</dd></div>
            </dl>
          </section>
        </div>
      </div>

      {/* CTA — original copy */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
        <h2 className="text-xl font-extrabold tracking-tight">Ready to meet {first}?</h2>
        <p className="mt-1 text-sm text-slate-300">Book an interview and we&apos;ll coordinate a call that works for your team.</p>
        <Link href="/book" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110">Book an interview →</Link>
      </div>
    </div>
  );
}
