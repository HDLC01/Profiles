# Profiles — CLAUDE.md

## What this is
A candidate portal for **Cloud Accountant Staffing (CAS)** — Will's *other* company (separate from
Treadwell). Clients sign in, browse offshore accounting candidates, read in-depth profiles, build a
shortlist, and book an interview. Staff manage candidates through an intake form and standardized
resumes. Rebuild of `portal.cloudaccountantstaffing.com` that we own and control.

- **Repo:** github.com/HDLC01/Profiles · **Domain:** profiles.wetreadwell.com · **VPS dir:** /opt/profiles
- **Branding:** Cloud Accountant Staffing ("Build Your Dream Team"), offshore candidates.

## SEPARATE SYSTEM — hard boundary
Standalone project: own git repo, own subdomain, own dockerized Postgres, own containers + nginx block.
It does NOT import from or deploy with the Treadwell systems. Proven patterns are **COPIED, never
imported**. Shares only the physical VPS (50.6.110.215) and the deploy tooling conventions.

- **Port map:** web (Next.js) `127.0.0.1:8900` · api (FastAPI) `127.0.0.1:8901` · local-dev Postgres
  `127.0.0.1:5437`. (Taken elsewhere: 8888 proposal · 8890 newsfeed · 8892 roadmap · 8894 connector ·
  8896/8897 assess · 8898/8899 portal · db 5434 assess / 5436 portal.)

## Stack
- **Frontend:** Next.js 16 (App Router) + Tailwind v4 + `@clerk/nextjs` (auth). Public client portal + admin.
- **Backend:** FastAPI (3.12) + SQLAlchemy 2 / psycopg3 + dockerized Postgres 16 (own DB; never Supabase
  for data). FastAPI middleware verifies the **Clerk JWT via Clerk JWKS** (RS256; check `iss`/`azp`),
  extracts user + role. Admin routes require `role=admin`.
- **Resume PDF:** LibreOffice headless docx→PDF + python-docx `{{token}}`/`{{#block}}` fill (ported from
  the Treadwell proposal tool). Generate from intake data; allow manual upload override.
- **Booking:** Calendly embed (configurable URL).
- **Media:** `storage.py` abstraction → VPS Docker volume + nginx `/media` for now; swap to a CDN
  (Cloudflare R2 for images/PDFs, Bunny/Cloudflare Stream for video) before production traffic. The
  1 vCPU / 2 GB VPS must NOT serve production video.

## Auth (Clerk) — roles
- `admin` — staff: candidate CRUD, intake, taxonomy CRUD, user approval.
- `client` — companies: browse, shortlist, book. New sign-ups land `status=pending` until an admin approves.
- Role lives in Clerk `publicMetadata.role`, mirrored into the `profiles` table.

## Personality type → Assess
Each candidate links to their real **Treadwell Assess** report (`assess_job_id` + `assess_candidate_id`).
NOTE: the Assess report is `@wetreadwell.com`-gated, so CAS clients can't open it directly — resolve by
adding a tokenized public "share" view to Assess, or show an inline personality summary in Profiles and
reserve the deep-link for staff. (Open decision — see plan.)

## Golden rules
- **TEST LOCALLY FIRST.** Never deploy until it runs + passes local smoke tests and Hanz approves.
- **Never build Docker images on the VPS** (browns out the box). Build off-box, ship prebuilt via
  `deploy/ship.sh` (docker save | ssh docker load | compose up -d, no --build).
- Destructive actions need confirm dialogs; lists paginate at 25/page (house rules).
- Prose/emails: run stop-slop. UI: ui-ux-pro-max, mobile-first, 0 console errors, no horizontal overflow.
- **Time is billed separately** — log every work session in `TIME_LOG.md`.

## Run locally (target)
- DB:       `docker compose up -d db`            (Postgres on 127.0.0.1:5437)
- Backend:  `cd backend && uv run uvicorn main:app --reload --port 8901`
- Frontend: `cd frontend && npm run dev`         (Next.js on :3000, rewrites /api → :8901)
