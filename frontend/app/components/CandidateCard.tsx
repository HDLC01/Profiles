"use client";

import Link from "next/link";
import type { CandidateCard as Card } from "../lib/api";
import { formatRate, initials } from "../lib/format";

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className="h-48 w-full object-cover" />;
  }
  return (
    <div className="grid h-48 w-full place-items-center bg-gradient-to-br from-slate-100 to-slate-200 text-3xl font-extrabold text-slate-400">
      {initials(name)}
    </div>
  );
}

export default function CandidateCard({ c, index = 0 }: { c: Card; index?: number }) {
  return (
    <Link
      href={`/candidate/${c.id}`}
      style={{ animationDelay: `${Math.min(index, 11) * 40}ms` }}
      className="group animate-rise flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5 hover:ring-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
    >
      <div className="relative">
        <Avatar src={c.photo_url} name={c.full_name} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900/55 to-transparent" />
        {c.is_new && (
          <span className="absolute left-3 top-3 rounded-full bg-sky-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">New</span>
        )}
        {c.credential && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-sm ring-1 ring-slate-200 backdrop-blur">{c.credential}</span>
        )}
        {c.skills.length > 0 && (
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1">
            {c.skills.slice(0, 2).map((s) => (
              <span key={s} className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur">{s}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{c.full_name}</h3>
        <p className="text-sm font-semibold text-sky-700">{c.role_title}</p>
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Experience</p>
            <p className="text-sm font-bold text-slate-800">{c.experience_label || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Rate</p>
            <p className="tnum text-sm font-bold text-slate-800">{formatRate(c.price_monthly)}{c.price_monthly != null && <span className="text-xs font-medium text-slate-400">/mo</span>}</p>
          </div>
        </div>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-sky-700 transition-[gap] group-hover:gap-2">
          View profile
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </Link>
  );
}
