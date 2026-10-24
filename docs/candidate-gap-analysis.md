# Test-candidate gap analysis — Mark Charlie & Cristybeth Atay Cerezo

Source: Will's email thread "New Project – Candidate Online Profile" (Jun 15 kickoff + Jun 17
follow-up with the two candidates). Will's ask: build two test profiles from what we have, and
**identify what's missing to complete each profile to the Cloud Accountant Staffing (CAS) standard.**

"Complete profile" here means every field the Profiles `candidates` table + its joins expect, plus
the reference portal's visible sections.

## What a complete CAS profile requires
- **Identity/hero:** full name, role title (default "US Accountant/Bookkeeper"), professional photo, 60-second intro video
- **Body:** About section, experience label, monthly price, availability, location (+ US timezone overlap), credential (e.g. CPA)
- **Personality:** client-safe personality label + short summary (derived from PI/Assess; the staff-only Assess deep-link is separate)
- **Skills:** mapped to CAS's 14-skill taxonomy — US Bookkeeping/Accounting, Client Communication, US AP, US AR, Bank Reconciliations, Financial Reporting, Payroll, Billing/Invoicing, 1099 Prep, 1040 Prep, 1120s Prep, Team Supervision/Review, Virtual Assistance, Data Analysis & Problem Solving
- **Software:** mapped to CAS's 16-software taxonomy — QuickBooks Online, QuickBooks Desktop, Xero, Bill.com, Hubdoc, Dext, Gusto, Excel, Google Workspace, NetSuite, SAP, Oracle, Salesforce, Workday, Slack, Teams
- **Assessments:** a rating for each of the 5 CAS assessments — Accounting, QuickBooks, Critical Thinking, Communication, Attention to Detail
- **Resume:** a standardized resume (generated from the original or uploaded)

## Missing for BOTH candidates
These block a publish-ready profile for either one:

1. **Professional photo** — no headshot supplied. Needed for the AI-professionalized photo step.
2. **Intro video** — no video supplied. Needs the standardized 60-second intro (background, skills, experience, availability).
3. **The 5 CAS assessment ratings** — we have their PI (personality) results, but PI is not these five. Accounting / QuickBooks / Critical Thinking / Communication / Attention to Detail each still need a rating (from our own assessments, or Treadwell Assess).
4. **Availability** — no notice period, start date, weekly hours, or US timezone overlap for either.
5. **Skills mapped to the CAS taxonomy** — the taxonomy is US-accounting-specific. Their audit/corporate backgrounds don't clearly evidence US bookkeeping, US AP/AR, or US tax prep (1099 / 1040 / 1120s) or payroll. Need confirmation of US-side exposure.
6. **Software fit gap (most important for CAS match)** — both show enterprise ERPs (SAP, MYOB, VISMA, Oracle JD Edwards, SAP Ariba), not the CAS core stack (QuickBooks, Xero, Bill.com, Gusto, Hubdoc/Dext). No QuickBooks/Xero evidence for either. Confirm whether they've used the US SMB tools.
7. **Remote work history** — Will flagged this for both; neither resume confirms prior remote work.
8. **AI / automation tools experience** — Will flagged this for both; neither mentions it.
9. **English / communication proficiency evidence** — relevant for offshore placement; usually demonstrated by the intro video (currently missing).
10. **Personality section content** — we have the PI profile attached, but it still needs converting into the client-safe `personality_type` + `personality_summary`. They took PI, not Treadwell Assess, so `assess_job_id` / `assess_candidate_id` (the staff deep-link) would be empty unless they take Assess or we map PI across.

## Mark Charlie
Rate $6.67/hr ($1,174.51/mo) · 4.5★ · CPA (Philippines), Master in Management, US-CMA candidate · [onlinejobs.ph](https://v2.onlinejobs.ph/jobseekers/info/849537) · [resume (Drive)](https://drive.google.com/file/d/1uubQha74o8v_Rur7XxFBIYF-mz3D8IMi/view)

**Have:** name, resume file, PI profile, rate, 10+ years (external audit, financial accounting, senior reporting), SGV/EY pedigree, enterprise ERP (SAP, MYOB, VISMA), strong budgeting/forecasting/financial statements/tax compliance/mentorship, credential.

**Missing / to confirm (beyond the shared list):**
- **Cognitive results** — Will has none for Mark (has them for Cristybeth). Needed for a complete assessment picture.
- **Current location + timezone** — worked NM Group in Malta (2021–2022) and Sandstone Tech across AU/UK/PH; his present base and working hours are unclear.
- No confirmed remote history; no AI/automation tools (Will's two flags).

## Cristybeth Atay Cerezo
Rate $10.01/hr ($1,761.76/mo) · 4.5★ · Licensed CPA (cum laude), 11 years · [onlinejobs.ph](https://v2.onlinejobs.ph/jobseekers/info/3485972) · [LinkedIn](https://www.linkedin.com/in/cristybeth-atay-cerezo-cpa/)

**Have:** name, PI profile, **cognitive results (available)**, rate, 11 years (full-cycle accounting at SM Investments solar startup; UBS Securities deputy head of finance), enterprise ERP (SAP, Oracle JD Edwards, SAP Ariba), stated interest in remote/autonomous work + process improvement, credential.

**Missing / to confirm (beyond the shared list):**
- **Resume file** — Will listed only a LinkedIn link for her (Mark had a Drive resume). Need the actual resume to generate the standardized version.
- Remote work is an expressed *interest*, not confirmed *history* — confirm any prior remote role.
- No AI/automation tools mention (Will's flag).

## Fastest path to two complete test profiles
Ask Will (or pull from the onlinejobs.ph profiles) for the shared blockers: a headshot, an intro video, availability, and confirmation of US bookkeeping + QuickBooks/Xero exposure. Then Cristybeth's resume file and Mark's cognitive result close the two candidate-specific gaps. Everything else (About, experience label, personality label/summary, skills/software mapping) can be drafted from the resumes and PI profiles for review.
