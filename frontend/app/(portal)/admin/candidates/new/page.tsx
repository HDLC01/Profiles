"use client";

import Link from "next/link";
import AdminTabs from "../../../../components/AdminTabs";
import CandidateForm from "../../../../components/CandidateForm";

export default function NewCandidate() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <AdminTabs />
        <Link href="/admin/candidates" className="text-sm font-semibold text-slate-500 hover:text-slate-900">← Back</Link>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">New candidate</h1>
      <CandidateForm />
    </div>
  );
}
