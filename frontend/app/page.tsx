import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

// Protected by proxy.ts (auth.protect on all non-public routes), so this only
// renders for a signed-in user. Minimal CAS-branded home for the auth spike;
// the real candidate grid lands in Phase 2 at /candidates.
export default async function Home() {
  const user = await currentUser();
  const name = user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "there";

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black">
            C
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">Cloud Accountant Staffing</p>
            <p className="text-sm font-bold text-slate-900">Candidate Portal</p>
          </div>
        </div>
        <UserButton />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-6 py-16">
        <p className="text-sm font-semibold text-indigo-600">Welcome back, {name}</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Build your dream team.</h1>
        <p className="max-w-md text-lg text-slate-600">
          Browse our offshore accounting candidates, read in-depth profiles, build a shortlist, and book
          an interview.
        </p>
        <Link
          href="/candidates"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          Browse candidates
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        <p className="text-xs text-slate-400">Auth spike — Clerk sign-in active. Candidate grid arrives in Phase 2.</p>
      </main>
    </div>
  );
}
