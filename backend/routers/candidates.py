"""Candidate browse (any signed-in user; clients see published only) + admin CRUD."""
import os
import re
import uuid
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import bindparam, text

import config
from db import connect
from deps import current_profile, require_admin
from services import resume_pdf

router = APIRouter(prefix="/api", tags=["candidates"])

SORTS = {
    "new": "c.created_at desc",
    "alpha": "c.full_name asc",
    "price_asc": "c.price_monthly asc nulls last",
    "price_desc": "c.price_monthly desc nulls last",
}
RATINGS = {"Below average", "Average", "Above average", "Well above average", "Exceptional"}


def _slug(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "candidate"
    return f"{base}-{uuid.uuid4().hex[:6]}"


class CandidateAssessment(BaseModel):
    assessment_id: str
    rating: str


class CandidateIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    role_title: str | None = None
    about: str | None = None
    experience_label: str | None = None
    price_monthly: int | None = Field(default=None, ge=0)
    availability: str | None = None
    location: str | None = None
    credential: str | None = None
    photo_url: str | None = None
    intro_video_url: str | None = None
    resume_url: str | None = None
    status: str = "new"
    is_published: bool = False
    assess_job_id: str | None = None
    assess_candidate_id: str | None = None
    personality_type: str | None = None
    personality_summary: str | None = None
    skill_ids: list[str] = []
    software_ids: list[str] = []
    assessments: list[CandidateAssessment] = []


def _attach(conn, cid, skill_ids, software_ids, assessments):
    conn.execute(text("delete from candidate_skills where candidate_id = :c"), {"c": cid})
    conn.execute(text("delete from candidate_software where candidate_id = :c"), {"c": cid})
    conn.execute(text("delete from candidate_assessments where candidate_id = :c"), {"c": cid})
    for sid in dict.fromkeys(skill_ids):
        conn.execute(text("insert into candidate_skills (candidate_id, skill_id) values (:c, :s) on conflict do nothing"), {"c": cid, "s": sid})
    for sid in dict.fromkeys(software_ids):
        conn.execute(text("insert into candidate_software (candidate_id, software_id) values (:c, :s) on conflict do nothing"), {"c": cid, "s": sid})
    for a in assessments:
        if a.rating not in RATINGS:
            raise HTTPException(status_code=422, detail=f"Invalid rating: {a.rating}")
        conn.execute(text(
            "insert into candidate_assessments (candidate_id, assessment_id, rating) values (:c, :a, :r) "
            "on conflict (candidate_id, assessment_id) do update set rating = excluded.rating"
        ), {"c": cid, "a": a.assessment_id, "r": a.rating})


@router.get("/candidates")
def list_candidates(request: Request, q: str | None = None, sort: str = "new", page: int = 1, status: str | None = None):
    prof = current_profile(request)
    is_admin = prof["role"] == "admin"
    where, params = [], {}
    if not is_admin:
        where.append("c.is_published = true")
    elif status:
        where.append("c.status = :status")
        params["status"] = status
    if q:
        where.append("(c.full_name ilike :q or c.about ilike :q or c.role_title ilike :q)")
        params["q"] = f"%{q}%"
    wsql = ("where " + " and ".join(where)) if where else ""
    order = SORTS.get(sort, SORTS["new"])
    page = max(1, int(page))
    size = config.PAGE_SIZE
    off = (page - 1) * size
    with connect() as conn:
        total = conn.execute(text(f"select count(*) from candidates c {wsql}"), params).scalar()
        rows = conn.execute(text(
            "select c.id, c.slug, c.full_name, c.role_title, c.photo_url, c.experience_label, "
            "c.price_monthly, c.credential, c.status, c.is_published, c.created_at, "
            "(c.created_at > now() - interval '21 days') as is_new "
            f"from candidates c {wsql} order by {order} limit :lim offset :off"
        ), {**params, "lim": size, "off": off}).mappings().all()
        ids = [r["id"] for r in rows]
        skills_by: dict = {}
        if ids:
            stmt = text(
                "select cs.candidate_id, s.name from candidate_skills cs join skills s on s.id = cs.skill_id "
                "where cs.candidate_id in :ids order by s.ordering"
            ).bindparams(bindparam("ids", expanding=True))
            for r in conn.execute(stmt, {"ids": ids}).mappings():
                skills_by.setdefault(r["candidate_id"], []).append(r["name"])
    items = [{
        "id": str(r["id"]), "slug": r["slug"], "full_name": r["full_name"], "role_title": r["role_title"],
        "photo_url": r["photo_url"], "experience_label": r["experience_label"], "price_monthly": r["price_monthly"],
        "credential": r["credential"], "status": r["status"], "is_published": r["is_published"],
        "is_new": r["is_new"], "skills": skills_by.get(r["id"], [])[:3],
    } for r in rows]
    return {"items": items, "page": page, "page_size": size, "total": total, "total_pages": (total + size - 1) // size}


def _full(conn, cid: str, is_admin: bool) -> dict | None:
    c = conn.execute(text("select * from candidates where id::text = :i or slug = :i"), {"i": cid}).mappings().first()
    if not c or (not is_admin and not c["is_published"]):
        return None

    def rows(sql):
        return conn.execute(text(sql), {"c": c["id"]}).mappings()

    skills, skill_ids = [], []
    for r in rows("select s.id, s.name from candidate_skills cs join skills s on s.id=cs.skill_id where cs.candidate_id=:c order by s.ordering, s.name"):
        skill_ids.append(str(r["id"]))
        skills.append(r["name"])
    software, software_ids = [], []
    for r in rows("select s.id, s.name from candidate_software cs join software s on s.id=cs.software_id where cs.candidate_id=:c order by s.ordering, s.name"):
        software_ids.append(str(r["id"]))
        software.append(r["name"])
    assessments = [
        {"assessment_id": str(r["id"]), "name": r["name"], "rating": r["rating"]}
        for r in rows("select a.id, a.name, ca.rating from candidate_assessments ca join assessments a on a.id=ca.assessment_id where ca.candidate_id=:c order by a.ordering, a.name")
    ]
    d = dict(c)
    for k in ("id", "assess_job_id", "assess_candidate_id"):
        if d.get(k) is not None:
            d[k] = str(d[k])
    d["skills"], d["software"] = skills, software
    d["skill_ids"], d["software_ids"] = skill_ids, software_ids
    d["assessments"] = assessments
    return d


def _assess_id(raw: str) -> str:
    """Defensively extract an Assess candidate id from a raw id, a `/r/<id>`
    report link, or an `/api/report/<id>` URL. Strips query/fragment and takes
    the last non-empty path segment. The frontend normally does this, but we
    re-do it server-side because the input is untrusted."""
    raw = (raw or "").strip()
    if not raw:
        raise HTTPException(status_code=422, detail="Missing Assess candidate id")
    candidate = raw
    if "://" in raw or "/" in raw:
        path = urlparse(raw).path if "://" in raw else raw
        segments = [s for s in path.split("/") if s]
        if segments:
            candidate = segments[-1]
    candidate = candidate.split("?")[0].split("#")[0].strip()
    if not candidate:
        raise HTTPException(status_code=422, detail="Could not read an Assess id from that input")
    return candidate


def _resolve_catalog(conn, table: str, names: list) -> tuple[list[str], list[str]]:
    """Match incoming name strings (case-insensitively) against the existing
    catalog table. Returns (matched_ids, all_input_names). Unmatched names are
    surfaced so the staffer can add them via the existing form UI — we never
    create catalog rows here."""
    clean = [n.strip() for n in (names or []) if isinstance(n, str) and n.strip()]
    clean = list(dict.fromkeys(clean))
    if not clean:
        return [], []
    rows = conn.execute(text(
        f"select id, name from {table} where lower(name) in :names"
    ).bindparams(bindparam("names", expanding=True)), {"names": [n.lower() for n in clean]}).mappings().all()
    by_lower = {r["name"].lower(): str(r["id"]) for r in rows}
    matched_ids = [by_lower[n.lower()] for n in clean if n.lower() in by_lower]
    return matched_ids, clean


@router.get("/candidates/assess-import")
def assess_import(request: Request, assess_candidate_id: str):
    """Admin-only: fetch a candidate's PUBLIC Assess report and return a prefill
    object (existing Profiles fields only) for the New-candidate form. Never
    creates anything — pure read + map. Declared before /candidates/{cid} so the
    literal path wins over the path-param route."""
    require_admin(request)
    cid = _assess_id(assess_candidate_id)
    url = f"{config.ASSESS_BASE_URL.rstrip('/')}/api/report/{cid}"
    try:
        resp = httpx.get(url, timeout=10.0, follow_redirects=True)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Could not reach the Assess service. Try again shortly.")
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail=f"No Assess report found for id '{cid}'.")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Assess returned an unexpected status ({resp.status_code}).")
    try:
        report = resp.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Assess returned a response we could not read.")
    if not isinstance(report, dict):
        raise HTTPException(status_code=502, detail="Assess returned an unexpected report shape.")

    cand = report.get("candidate") or {}
    job = report.get("job") or {}
    behavioral = report.get("behavioral") or {}
    ref = (behavioral.get("reference_profile") or {}) if isinstance(behavioral, dict) else {}
    narrative = (behavioral.get("narrative") or {}) if isinstance(behavioral, dict) else {}
    if not isinstance(cand, dict):
        cand = {}
    if not isinstance(job, dict):
        job = {}

    def _s(v):  # coerce to a trimmed string or None
        return v.strip() if isinstance(v, str) and v.strip() else None

    with connect() as conn:
        skill_ids, skill_names = _resolve_catalog(conn, "skills", cand.get("skills"))
        software_ids, software_names = _resolve_catalog(conn, "software", cand.get("software"))

    return {
        "full_name": _s(cand.get("full_name")),
        "role_title": _s(job.get("name")),
        "personality_type": _s(ref.get("name")) if isinstance(ref, dict) else None,
        "personality_summary": _s(narrative.get("summary")) if isinstance(narrative, dict) else None,
        "assess_job_id": _s(str(job.get("id"))) if job.get("id") is not None else None,
        "assess_candidate_id": _s(str(cand.get("id"))) if cand.get("id") is not None else _s(cid),
        # FK chips that already exist in our catalog
        "skill_ids": skill_ids,
        "software_ids": software_ids,
        # raw names from the report (so the staffer sees what came in and can add
        # any that didn't match an existing catalog item)
        "skill_names": skill_names,
        "software_names": software_names,
    }


@router.get("/candidates/{cid}")
def get_candidate(cid: str, request: Request):
    prof = current_profile(request)
    with connect() as conn:
        full = _full(conn, cid, prof["role"] == "admin")
    if not full:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return full


@router.post("/candidates")
def create_candidate(body: CandidateIn, request: Request):
    require_admin(request)
    with connect() as conn:
        cid = conn.execute(text(
            "insert into candidates (slug, full_name, role_title, about, experience_label, price_monthly, "
            "availability, location, credential, photo_url, intro_video_url, resume_url, status, is_published, "
            "assess_job_id, assess_candidate_id, personality_type, personality_summary) "
            "values (:slug, :full_name, coalesce(:role_title, 'US Accountant/Bookkeeper'), "
            ":about, :experience_label, :price_monthly, :availability, coalesce(:location,'Philippines'), :credential, "
            ":photo_url, :intro_video_url, :resume_url, :status, :is_published, :assess_job_id, :assess_candidate_id, "
            ":personality_type, :personality_summary) "
            "returning id"
        ), {**body.model_dump(exclude={"skill_ids", "software_ids", "assessments"}), "slug": _slug(body.full_name)}).scalar()
        _attach(conn, cid, body.skill_ids, body.software_ids, body.assessments)
        full = _full(conn, str(cid), True)
    return full


@router.patch("/candidates/{cid}")
def update_candidate(cid: str, body: CandidateIn, request: Request):
    require_admin(request)
    with connect() as conn:
        exists = conn.execute(text("select id from candidates where id::text = :i"), {"i": cid}).scalar()
        if not exists:
            raise HTTPException(status_code=404, detail="Candidate not found")
        conn.execute(text(
            "update candidates set full_name=:full_name, role_title=coalesce(:role_title,'US Accountant/Bookkeeper'), "
            "about=:about, experience_label=:experience_label, price_monthly=:price_monthly, availability=:availability, "
            "location=coalesce(:location,'Philippines'), credential=:credential, photo_url=:photo_url, "
            "intro_video_url=:intro_video_url, resume_url=:resume_url, status=:status, is_published=:is_published, "
            "assess_job_id=:assess_job_id, assess_candidate_id=:assess_candidate_id, "
            "personality_type=:personality_type, personality_summary=:personality_summary, updated_at=now() where id::text=:i"
        ), {**body.model_dump(exclude={"skill_ids", "software_ids", "assessments"}), "i": cid})
        _attach(conn, exists, body.skill_ids, body.software_ids, body.assessments)
        full = _full(conn, cid, True)
    return full


@router.delete("/candidates/{cid}")
def delete_candidate(cid: str, request: Request):
    require_admin(request)
    with connect() as conn:
        conn.execute(text("delete from candidates where id::text = :i"), {"i": cid})
    return {"ok": True}


@router.post("/candidates/{cid}/resume")
def generate_resume(cid: str, request: Request):
    """Render a standardized résumé PDF from the candidate's data, store it, and
    point resume_url at it (resume_is_generated=true)."""
    require_admin(request)
    with connect() as conn:
        full = _full(conn, cid, True)
        if not full:
            raise HTTPException(status_code=404, detail="Candidate not found")
        pdf = resume_pdf.build_resume_pdf(full)
        os.makedirs(config.MEDIA_ROOT, exist_ok=True)
        name = f"resume-{full['slug']}-{uuid.uuid4().hex[:6]}.pdf"
        with open(os.path.join(config.MEDIA_ROOT, name), "wb") as fh:
            fh.write(pdf)
        url = f"/api/media/{name}"
        conn.execute(text("update candidates set resume_url=:u, resume_is_generated=true, updated_at=now() where id::text=:i"), {"u": url, "i": cid})
    return {"resume_url": url}
