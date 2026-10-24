# Profiles — CLAUDE.md

## What this is

The Cloud Accountant Staffing (CAS) **Profiles** portal: an authenticated client catalog
of offshore accounting candidates plus a staff administration area for intake, taxonomy,
media, résumés, and publication. CAS is Will's separate company, not a Treadwell product.

- Repository: `github.com/HDLC01/Profiles`
- Live domain: `https://profiles.wetreadwell.com`
- VPS directory: `/opt/profiles`
- Brand: Cloud Accountant Staffing — “Build Your Dream Team”

It is a standalone project with its own repository, Postgres database, containers, nginx
configuration, and deployment tooling. Never import from a Treadwell repository; copy or
adapt only a pattern that makes sense for this application's stack and security model.

## Current implementation — verified from source on 2026-07-22

- The site was cut over live on 2026-06-30. The core client portal, staff admin,
  standardized résumé generator, and client-safe personality summary are implemented.
- Frontend: Next.js 16 App Router, React 19, Tailwind v4, and Clerk. Read
  `frontend/AGENTS.md` before editing this version of Next.
- Backend: FastAPI, SQLAlchemy/psycopg, and its own Postgres 16 database. Migrations
  bootstrap core profiles, taxonomies, and personality fields.
- Auth: Clerk RS256 JWT verification through Clerk JWKS. The frontend protects all routes
  except sign-in/sign-up; the API receives a bearer token and independently validates it.
- Production topology: Next.js `127.0.0.1:8900`, FastAPI `127.0.0.1:8901`, Postgres
  internal to Compose. nginx is the public surface.

## Roles and access

- `client` users browse published candidates, manage their own shortlist, and book an
  interview. New client profiles are pending until staff approves them.
- `admin` users manage candidates, intake, publishing, taxonomies, uploads, and résumé
  generation. The API, not just the UI, must enforce this.
- Admin identity is derived from Clerk claims and the configured bootstrap emails/domains.
  Never expose a Clerk secret or accept a client-asserted role.

## Data model and integration boundaries

- `profiles` is the Clerk-user mirror; `candidates` holds public profile data and media
  URLs; skills, software, and assessments are normalized taxonomies with join tables;
  `shortlists` are scoped to the Clerk user; `events` is the audit trail.
- Personality is client-safe: `personality_type` and `personality_summary` display to
  clients. The deep Assess report link is staff-only because Treadwell Assess is
  domain-gated. Do not expose private assessment data to clients.
- Media currently stores on the VPS `media` Docker volume and serves through `/api/media`.
  It is acceptable for development/light images and PDFs but not production video traffic.
  Follow `deploy/MEDIA.md` to migrate images/PDFs to R2 and video to a streaming CDN.
- Resume generation uses server-side rendering; manual upload can override generated output.

## Code map

| Location | Responsibility |
|---|---|
| `backend/main.py`, `db.py`, `migrate.py` | API boot, DB lifecycle, migrations/seed. |
| `backend/clerk_auth.py`, `deps.py` | Clerk JWT validation and role dependencies. |
| `backend/routers/candidates.py` | Client listing/detail plus admin candidate CRUD and résumé action. |
| `backend/routers/account.py` | Current profile and shortlist APIs. |
| `backend/routers/catalog.py`, `uploads.py` | Taxonomy and admin media management. |
| `backend/services/resume_pdf.py` | Standardized résumé output. |
| `frontend/app/(portal)/` | Client pages and admin routes. |
| `frontend/app/components/` | Candidate cards/forms and staff guards/navigation. |
| `frontend/app/lib/api.ts` | Central bearer-token API client. |

## Local development and checks

```powershell
# project root
docker compose up -d db

cd backend
uv run uvicorn main:app --reload --port 8901
python -m pytest

cd ..\frontend
npm run dev
npm run lint
npm run test
npm run build
```

The browser frontend runs on `:3000` in development and uses the API proxy/configuration.
Use private development Clerk/Postgres credentials only; never add `.env` contents,
generated media, logs, or deployment output to source control.

## Deployment and operating rules

- Build images off-box with `deploy/ship.sh`; it ships prebuilt Linux images and waits
  for `:8901/api/health`. Do not run `docker compose --build` on the constrained shared VPS.
- The `media` volume persists local assets. Back it up before destructive maintenance.
- List views paginate at 25; deletion needs a confirmation dialog; mobile views must not
  horizontally overflow.
- Time is billed separately to CAS. Append substantive work to `TIME_LOG.md`; Clockify is
  the authoritative total.
