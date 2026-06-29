"use client";

import Link from "next/link";
import type { CandidateCard as Card } from "../lib/api";

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className="h-44 w-full rounded-t-2xl object-cover" />;
  }
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="grid h-44 w-full place-items-center rounded-t-2xl bg-gradient-to-br from-indigo-100 to-violet-100 text-3xl font-black text-indigo-400">
      {initials}
    </div>
  );
}

export default function CandidateCard({ c }: { c: Card }) {
  return (
    <Link
      href={`/candidate/${c.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="relative">
        <Avatar src={c.photo_url} name={c.full_name} />
        {c.is_new && (
          <span className="absolute left-3 top-3 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">New</span>
        )}
        {c.skills.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1">
            {c.skills.slice(0, 2).map((s) => (
              <span key={s} className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur">{s}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-900">{c.full_name}</h3>
          {c.credential && <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">{c.credential}</span>}
        </div>
        <p className="text-sm font-semibold text-indigo-600">{c.role_title}</p>
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Experience</p>
            <p className="text-sm font-bold text-slate-800">{c.experience_label || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Price</p>
            <p className="text-sm font-bold text-slate-800">{c.price_monthly ? `$${c.price_monthly.toLocaleString()}` : "—"}<span className="text-xs font-medium text-slate-400">/mo</span></p>
          </div>
        </div>
        <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-indigo-600 group-hover:gap-2 transition-[gap]">
          View Profile
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </Link>
  );
}
