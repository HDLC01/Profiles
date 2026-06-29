"use client";

// Client-side API helper. Calls go to /api/* (Next rewrites to the FastAPI
// backend) with the Clerk session token as a Bearer header — the backend
// verifies it via JWKS. Use the useApi() hook from a client component.

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ── types (mirror the FastAPI responses) ────────────────────────────────────
export type Rating = "Below average" | "Average" | "Above average" | "Well above average" | "Exceptional";

export interface CandidateCard {
  id: string;
  slug: string;
  full_name: string;
  role_title: string;
  photo_url: string | null;
  experience_label: string | null;
  price_monthly: number | null;
  credential: string | null;
  status: string;
  is_published: boolean;
  is_new: boolean;
  skills: string[];
}

export interface CandidatesEnvelope {
  items: CandidateCard[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface CandidateFull {
  id: string;
  slug: string;
  full_name: string;
  role_title: string;
  about: string | null;
  experience_label: string | null;
  price_monthly: number | null;
  availability: string | null;
  location: string | null;
  credential: string | null;
  photo_url: string | null;
  intro_video_url: string | null;
  resume_url: string | null;
  status: string;
  is_published: boolean;
  assess_job_id: string | null;
  assess_candidate_id: string | null;
  skills: string[];
  software: string[];
  skill_ids: string[];
  software_ids: string[];
  assessments: { assessment_id: string; name: string; rating: string }[];
}

export interface CatalogItem { id: string; name: string; active: boolean; ordering: number }
export interface Catalog { skills: CatalogItem[]; software: CatalogItem[]; assessments: CatalogItem[] }
export type CatalogKind = "skills" | "software" | "assessments";
export interface Me { clerk_user_id: string; email: string | null; role: string; status: string; assess_base_url: string }
export type Sort = "new" | "alpha" | "price_asc" | "price_desc";

export interface CandidateInput {
  full_name: string;
  role_title?: string | null;
  about?: string | null;
  experience_label?: string | null;
  price_monthly?: number | null;
  availability?: string | null;
  location?: string | null;
  credential?: string | null;
  photo_url?: string | null;
  intro_video_url?: string | null;
  resume_url?: string | null;
  status?: string;
  is_published?: boolean;
  assess_job_id?: string | null;
  assess_candidate_id?: string | null;
  skill_ids: string[];
  software_ids: string[];
  assessments: { assessment_id: string; rating: string }[];
}

function createApi(getToken: () => Promise<string | null>) {
  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken();
    const resp = await fetch(`/api${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });
    if (!resp.ok) {
      let detail = resp.statusText;
      try { detail = (await resp.json()).error || (await resp.json()).detail || detail; } catch { /* keep */ }
      throw new ApiError(resp.status, detail);
    }
    if (resp.status === 204) return undefined as T;
    return resp.json() as Promise<T>;
  }

  return {
    me: () => req<Me>("/me"),
    listCandidates: (p: { q?: string; sort?: Sort; page?: number; status?: string } = {}) => {
      const sp = new URLSearchParams();
      if (p.q) sp.set("q", p.q);
      if (p.sort) sp.set("sort", p.sort);
      if (p.page) sp.set("page", String(p.page));
      if (p.status) sp.set("status", p.status);
      const qs = sp.toString();
      return req<CandidatesEnvelope>(`/candidates${qs ? `?${qs}` : ""}`);
    },
    getCandidate: (id: string) => req<CandidateFull>(`/candidates/${id}`),
    listShortlist: () => req<{ items: CandidateCard[] }>("/shortlist"),
    addShortlist: (candidate_id: string) => req<{ ok: boolean }>("/shortlist", { method: "POST", body: JSON.stringify({ candidate_id }) }),
    removeShortlist: (candidate_id: string) => req<{ ok: boolean }>(`/shortlist/${candidate_id}`, { method: "DELETE" }),
    catalog: () => req<Catalog>("/catalog"),
    // admin (Phase 3)
    createCandidate: (body: CandidateInput) => req<CandidateFull>("/candidates", { method: "POST", body: JSON.stringify(body) }),
    updateCandidate: (id: string, body: CandidateInput) => req<CandidateFull>(`/candidates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    deleteCandidate: (id: string) => req<{ ok: boolean }>(`/candidates/${id}`, { method: "DELETE" }),
    generateResume: (id: string) => req<{ resume_url: string }>(`/candidates/${id}/resume`, { method: "POST" }),
    createCatalogItem: (kind: CatalogKind, body: { name: string; active?: boolean; ordering?: number }) =>
      req<CatalogItem>(`/catalog/${kind}`, { method: "POST", body: JSON.stringify(body) }),
    updateCatalogItem: (kind: CatalogKind, id: string, body: { name: string; active: boolean; ordering: number }) =>
      req<CatalogItem>(`/catalog/${kind}/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    deleteCatalogItem: (kind: CatalogKind, id: string) =>
      req<{ ok: boolean }>(`/catalog/${kind}/${id}`, { method: "DELETE" }),
    async upload(file: File): Promise<{ url: string }> {
      const token = await getToken();
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch(`/api/uploads`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
      if (!resp.ok) {
        let detail = resp.statusText;
        try { detail = (await resp.json()).detail || detail; } catch { /* keep */ }
        throw new ApiError(resp.status, detail);
      }
      return resp.json();
    },
  };
}

export type ApiClient = ReturnType<typeof createApi>;

export function useApi(): ApiClient {
  const { getToken } = useAuth();
  return useMemo(() => createApi(getToken), [getToken]);
}
