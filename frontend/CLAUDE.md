# Profiles frontend context

Read `../CLAUDE.md` first. This is the Next.js client for the Cloud Accountant Staffing
Profiles portal — a separate application from every Treadwell product.

## Working map

- `app/(portal)/` — authenticated client experience: candidates, candidate detail,
  shortlist, booking, and staff admin pages.
- `app/components/` — shared header, candidate cards/forms, and admin guards/tabs.
- `app/lib/api.ts` — bearer-token API client; keep authorization handling centralized.
- `proxy.ts` — Clerk request protection.

## Commands

- `npm run dev` — Next.js development server.
- `npm run build` — production build.
- `npm run lint` — lint.
- `npm run test` — Vitest unit tests.

The frontend uses Next.js 16, React 19, Tailwind v4, and Clerk. It calls the separate
FastAPI API on port 8901 locally; do not put database or Clerk-secret logic in the client.
For production media and role rules, defer to the parent context and `deploy/MEDIA.md`.

@AGENTS.md
