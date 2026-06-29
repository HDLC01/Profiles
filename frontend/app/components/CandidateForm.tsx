"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi, type Catalog, type CandidateFull, type CandidateInput, type CatalogKind } from "../lib/api";

const RATINGS = ["Below average", "Average", "Above average", "Well above average", "Exceptional"];
const STATUSES = ["new", "active", "archived"];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25";

function MediaInput({ label, value, onChange, accept, hint }: { label: string; value: string; onChange: (v: string) => void; accept: string; hint?: string }) {
  const api = useApi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload →" />
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setErr(null);
            try {
              const r = await api.upload(f);
              onChange(r.url);
            } catch (ex) {
              setErr((ex as Error)?.message || "Upload failed");
            } finally {
              setBusy(false);
              if (fileRef.current) fileRef.current.value = "";
            }
          }}
        />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      {err && <span className="mt-1 block text-[11px] text-rose-600">{err}</span>}
      {value && accept.startsWith("image") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200" />
      )}
    </Field>
  );
}

function MultiSelect({ kind, label, options, selected, onToggle, onAdded }: {
  kind: CatalogKind; label: string;
  options: { id: string; name: string }[]; selected: Set<string>;
  onToggle: (id: string) => void; onAdded: (item: { id: string; name: string }) => void;
}) {
  const api = useApi();
  const [adding, setAdding] = useState("");
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.has(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${on ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {o.name}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input className={inputCls} value={adding} onChange={(e) => setAdding(e.target.value)} placeholder={`Add a ${label.toLowerCase().replace(/s$/, "")}…`} />
        <button
          type="button"
          disabled={!adding.trim()}
          onClick={async () => {
            const item = await api.createCatalogItem(kind, { name: adding.trim() });
            onAdded({ id: item.id, name: item.name });
            onToggle(item.id);
            setAdding("");
          }}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </Field>
  );
}

export default function CandidateForm({ initial }: { initial?: CandidateFull }) {
  const api = useApi();
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [skillOpts, setSkillOpts] = useState<{ id: string; name: string }[]>([]);
  const [softwareOpts, setSoftwareOpts] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    full_name: initial?.full_name ?? "",
    role_title: initial?.role_title ?? "US Accountant/Bookkeeper",
    about: initial?.about ?? "",
    experience_label: initial?.experience_label ?? "",
    price_monthly: initial?.price_monthly != null ? String(initial.price_monthly) : "",
    availability: initial?.availability ?? "",
    location: initial?.location ?? "Philippines",
    credential: initial?.credential ?? "",
    status: initial?.status ?? "new",
    is_published: initial?.is_published ?? false,
    assess_job_id: initial?.assess_job_id ?? "",
    assess_candidate_id: initial?.assess_candidate_id ?? "",
    photo_url: initial?.photo_url ?? "",
    intro_video_url: initial?.intro_video_url ?? "",
    resume_url: initial?.resume_url ?? "",
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  const [skills, setSkills] = useState<Set<string>>(new Set(initial?.skill_ids ?? []));
  const [software, setSoftware] = useState<Set<string>>(new Set(initial?.software_ids ?? []));
  const [ratings, setRatings] = useState<Record<string, string>>(
    Object.fromEntries((initial?.assessments ?? []).map((a) => [a.assessment_id, a.rating]))
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const c = await api.catalog();
        if (!active) return;
        setCatalog(c);
        setSkillOpts(c.skills.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name })));
        setSoftwareOpts(c.software.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name })));
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, [api]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (id: string) =>
    setter((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const payload: CandidateInput = {
      full_name: f.full_name.trim(),
      role_title: f.role_title || null,
      about: f.about || null,
      experience_label: f.experience_label || null,
      price_monthly: f.price_monthly ? Number(f.price_monthly) : null,
      availability: f.availability || null,
      location: f.location || null,
      credential: f.credential || null,
      photo_url: f.photo_url || null,
      intro_video_url: f.intro_video_url || null,
      resume_url: f.resume_url || null,
      status: f.status,
      is_published: f.is_published,
      assess_job_id: f.assess_job_id || null,
      assess_candidate_id: f.assess_candidate_id || null,
      skill_ids: [...skills],
      software_ids: [...software],
      assessments: Object.entries(ratings).filter(([, r]) => r).map(([assessment_id, rating]) => ({ assessment_id, rating })),
    };
    try {
      if (initial) await api.updateCandidate(initial.id, payload);
      else await api.createCandidate(payload);
      router.push("/admin/candidates");
    } catch (ex) {
      setError((ex as Error)?.message || "Save failed");
      setSaving(false);
    }
  }

  if (!catalog) return <div className="h-96 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />;

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-bold text-slate-900">Basics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name"><input required className={inputCls} value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
          <Field label="Role title"><input className={inputCls} value={f.role_title} onChange={(e) => set("role_title", e.target.value)} /></Field>
          <Field label="Experience" hint="e.g. 3-5 years"><input className={inputCls} value={f.experience_label} onChange={(e) => set("experience_label", e.target.value)} /></Field>
          <Field label="Monthly rate (USD)"><input type="number" min="0" className={inputCls} value={f.price_monthly} onChange={(e) => set("price_monthly", e.target.value)} /></Field>
          <Field label="Availability" hint="e.g. 14 days"><input className={inputCls} value={f.availability} onChange={(e) => set("availability", e.target.value)} /></Field>
          <Field label="Location"><input className={inputCls} value={f.location} onChange={(e) => set("location", e.target.value)} /></Field>
          <Field label="Credential" hint="e.g. CPA (optional)"><input className={inputCls} value={f.credential} onChange={(e) => set("credential", e.target.value)} /></Field>
          <Field label="Status">
            <select className={inputCls} value={f.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="About"><textarea rows={5} className={inputCls} value={f.about} onChange={(e) => set("about", e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={f.is_published} onChange={(e) => set("is_published", e.target.checked)} className="h-4 w-4 accent-sky-600" />
          Published (visible to clients)
        </label>
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-bold text-slate-900">Skills &amp; software</h2>
        <MultiSelect kind="skills" label="Skills" options={skillOpts} selected={skills} onToggle={toggle(setSkills)} onAdded={(i) => setSkillOpts((p) => [...p, i])} />
        <MultiSelect kind="software" label="Software" options={softwareOpts} selected={software} onToggle={toggle(setSoftware)} onAdded={(i) => setSoftwareOpts((p) => [...p, i])} />
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-bold text-slate-900">Assessments</h2>
        <p className="text-xs text-slate-500">Set a rating to include an assessment; leave blank to omit.</p>
        <div className="divide-y divide-slate-100">
          {catalog.assessments.filter((a) => a.active).map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm text-slate-700">{a.name}</span>
              <select
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                value={ratings[a.id] ?? ""}
                onChange={(e) => setRatings((p) => ({ ...p, [a.id]: e.target.value }))}
              >
                <option value="">— not rated —</option>
                {RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h2 className="text-base font-bold text-slate-900">Media &amp; links</h2>
        <MediaInput label="Profile photo" value={f.photo_url} onChange={(v) => set("photo_url", v)} accept="image/*" />
        <MediaInput label="Intro video" value={f.intro_video_url} onChange={(v) => set("intro_video_url", v)} accept="video/*" hint="MP4/WebM, or paste a hosted URL" />
        <MediaInput label="Résumé (PDF)" value={f.resume_url} onChange={(v) => set("resume_url", v)} accept="application/pdf" hint="Phase 4 will auto-generate; upload to override" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Assess job ID" hint="links Personality Type → Assess report"><input className={inputCls} value={f.assess_job_id} onChange={(e) => set("assess_job_id", e.target.value)} /></Field>
          <Field label="Assess candidate ID"><input className={inputCls} value={f.assess_candidate_id} onChange={(e) => set("assess_candidate_id", e.target.value)} /></Field>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.push("/admin/candidates")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={saving || !f.full_name.trim()} className="rounded-lg bg-gradient-to-br from-sky-600 to-blue-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50">
          {saving ? "Saving…" : initial ? "Save changes" : "Create candidate"}
        </button>
      </div>
    </form>
  );
}
