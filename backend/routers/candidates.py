"""Candidate browse (any signed-in user; clients see published only) + admin CRUD."""
import re
import uuid

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import bindparam, text

import config
from db import connect
from deps import current_profile, require_admin

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
            "assess_job_id, assess_candidate_id) values (:slug, :full_name, coalesce(:role_title, 'US Accountant/Bookkeeper'), "
            ":about, :experience_label, :price_monthly, :availability, coalesce(:location,'Philippines'), :credential, "
            ":photo_url, :intro_video_url, :resume_url, :status, :is_published, :assess_job_id, :assess_candidate_id) "
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
            "assess_job_id=:assess_job_id, assess_candidate_id=:assess_candidate_id, updated_at=now() where id::text=:i"
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
