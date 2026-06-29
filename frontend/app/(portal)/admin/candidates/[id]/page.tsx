"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi, type CandidateFull } from "../../../../lib/api";
import AdminTabs from "../../../../components/AdminTabs";
import CandidateForm from "../../../../components/CandidateForm";

export default function EditCandidate() {
  const api = useApi();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [c, setC] = useState<CandidateFull | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const d = await api.getCandidate(id);
        if (active) setC(d);
      } catch (e) {
        if (active) setError((e as Error)?.message || "Failed to load");
      }
    })();
    return () => { active = false; };
  }, [api, id]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <AdminTabs />
        <Link href="/admin/candidates" className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Back</Link>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{c ? `Edit ${c.full_name}` : "Edit candidate"}</h1>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {c ? <CandidateForm initial={c} /> : !error && <div className="h-96 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />}
    </div>
  );
}
