# TIME_LOG — Profiles (Cloud Accountant Staffing)

Time spent on this project, billed separately to Will as a different-company engagement.
One row per work session. Hanz = the developer.

| Date | Hours | Who | Summary |
|------|-------|-----|---------|
| 2026-06-29 | 1.0 | Hanz | Kickoff: Playwright baseline of portal.cloudaccountantstaffing.com (list + profile data model), architecture exploration of reusable Treadwell patterns (proposal-tool PDF, Assess archetypes, VPS ports/deploy), wrote the build plan, scaffolded the repo (folder, CLAUDE.md, base config), started the Clerk auth spike. |
| 2026-06-29 | 2.0 | Hanz | Phase 0 finish (Clerk init + sign-in verified live, repo pushed) + Phase 1 backend: Postgres schema/migrations/seed, FastAPI + Clerk JWKS auth gate, candidate/taxonomy/shortlist CRUD with role gating. Verified locally: migrations applied, auth 401s, full CRUD round-trip, live JWKS fetch. |

| 2026-06-29 | 1.5 | Hanz | Added Profiles to the Treadwell roadmap (external system floor, 6 phases / 20 tasks, deployed live). Phase 2 client portal: Clerk-token API client, nav, candidate grid (search/sort/pagination), full profile page (assessments + personality→Assess link, skills, software, details), shortlist, Calendly booking page. Build/lint green; gate verified (307→sign-in); seeded 3 demo candidates. |

| 2026-06-30 | 1.5 | Hanz | Verified client portal end-to-end live (Clerk sign-in → grid → profile, 3 demo candidates). UI revamp via ui-ux-pro-max: original "Ledgerline" brand + logomark, navy/blue palette, Plus Jakarta Sans, premium cards/profile, original copy (removed reference wording + "Create Next App" title). Added unit tests (pytest 7 + vitest 4), GitHub Actions CI (backend + frontend), and a staging branch — CI green on main + staging. |

<!-- Append a new row each session. Keep "Hours" as a decimal (e.g. 0.5, 2.0). Total below. -->

**Running total:** 6.0 h
