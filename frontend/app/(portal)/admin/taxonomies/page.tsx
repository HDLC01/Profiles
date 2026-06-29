"use client";

import { useEffect, useState } from "react";
import { useApi, type Catalog, type CatalogItem, type CatalogKind } from "../../../lib/api";
import AdminTabs from "../../../components/AdminTabs";

function Section({ kind, title, items, reload }: { kind: CatalogKind; title: string; items: CatalogItem[]; reload: () => void }) {
  const api = useApi();
  const [adding, setAdding] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!adding.trim() || busy) return;
    setBusy(true);
    try { await api.createCatalogItem(kind, { name: adding.trim() }); setAdding(""); reload(); }
    finally { setBusy(false); }
  }
  async function patch(it: CatalogItem, changes: Partial<CatalogItem>) {
    await api.updateCatalogItem(kind, it.id, { name: changes.name ?? it.name, active: changes.active ?? it.active, ordering: changes.ordering ?? it.ordering });
    reload();
  }
  async function del(it: CatalogItem) {
    if (!window.confirm(`Delete "${it.name}"? It will be removed from every candidate that has it.`)) return;
    await api.deleteCatalogItem(kind, it.id);
    reload();
  }

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h2 className="mb-3 text-base font-bold text-slate-900">{title} <span className="text-xs font-medium text-slate-400">({items.length})</span></h2>
      <div className="mb-3 flex gap-2">
        <input value={adding} onChange={(e) => setAdding(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={`Add ${title.toLowerCase().replace(/s$/, "")}…`} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25" />
        <button onClick={add} disabled={!adding.trim() || busy} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50">Add</button>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-2 py-1.5">
            <input
              defaultValue={it.name}
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== it.name) patch(it, { name: v }); }}
              className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-sm text-slate-800 hover:border-slate-200 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
            />
            <label className="flex items-center gap-1 text-[11px] font-medium text-slate-500" title="Active (shown in filters + the intake form)">
              <input type="checkbox" checked={it.active} onChange={(e) => patch(it, { active: e.target.checked })} className="h-3.5 w-3.5 accent-sky-600" />
              active
            </label>
            <button onClick={() => del(it)} aria-label={`Delete ${it.name}`} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6" /></svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Taxonomies() {
  const api = useApi();
  const [cat, setCat] = useState<Catalog | null>(null);
  const [key, setKey] = useState(0);
  const reload = () => setKey((k) => k + 1);

  useEffect(() => {
    let active = true;
    (async () => {
      try { const c = await api.catalog(); if (active) setCat(c); } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, [api, key]);

  return (
    <div className="space-y-5">
      <AdminTabs />
      <p className="text-sm text-slate-500">Manage the skills, software, and assessments available across candidate profiles and filters.</p>
      {!cat ? (
        <div className="h-64 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200" />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Section kind="skills" title="Skills" items={cat.skills} reload={reload} />
          <Section kind="software" title="Software" items={cat.software} reload={reload} />
          <Section kind="assessments" title="Assessments" items={cat.assessments} reload={reload} />
        </div>
      )}
    </div>
  );
}
