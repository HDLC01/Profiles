"use client";

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || "";

export default function BookPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Book a Call</h1>
        <p className="mt-0.5 text-sm text-slate-500">Pick a time and we&apos;ll walk you through the candidates you&apos;re interested in.</p>
      </div>
      {CALENDLY_URL ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <iframe src={CALENDLY_URL} title="Book a call" className="h-[70dvh] w-full" />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm font-semibold text-slate-700">Booking link not configured yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">Set <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_CALENDLY_URL</code> to embed the Calendly scheduler here.</p>
        </div>
      )}
    </div>
  );
}
