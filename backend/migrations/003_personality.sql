-- Client-safe personality: a label + short summary shown to everyone, so the
-- profile no longer depends on the @wetreadwell-gated Assess report. The Assess
-- deep-link (assess_job_id/candidate_id) stays for staff only.
alter table candidates add column if not exists personality_type text;
alter table candidates add column if not exists personality_summary text;
