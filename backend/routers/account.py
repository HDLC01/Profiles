"""Current-user profile + per-client shortlist."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import bindparam, text

import config
from db import connect
from deps import current_profile

router = APIRouter(prefix="/api", tags=["account"])


@router.get("/me")
def me(request: Request):
    prof = current_profile(request)
    return {**prof, "assess_base_url": config.ASSESS_BASE_URL}


class ShortlistIn(BaseModel):
    candidate_id: str


@router.get("/shortlist")
def list_shortlist(request: Request):
    prof = current_profile(request)
    with connect() as conn:
        rows = conn.execute(text(
            "select c.id, c.slug, c.full_name, c.role_title, c.photo_url, c.experience_label, "
            "c.price_monthly, c.credential from shortlists sl join candidates c on c.id = sl.candidate_id "
            "where sl.clerk_user_id = :u and c.is_published = true order by sl.created_at desc"
        ), {"u": prof["clerk_user_id"]}).mappings().all()
    return {"items": [{**dict(r), "id": str(r["id"])} for r in rows]}


@router.post("/shortlist")
def add_shortlist(body: ShortlistIn, request: Request):
    prof = current_profile(request)
    with connect() as conn:
        ok = conn.execute(text("select 1 from candidates where id::text = :i and is_published = true"), {"i": body.candidate_id}).scalar()
        if not ok:
            raise HTTPException(status_code=404, detail="Candidate not found")
        conn.execute(text(
            "insert into shortlists (clerk_user_id, candidate_id) values (:u, :c) on conflict do nothing"
        ), {"u": prof["clerk_user_id"], "c": body.candidate_id})
    return {"ok": True}


@router.delete("/shortlist/{candidate_id}")
def remove_shortlist(candidate_id: str, request: Request):
    prof = current_profile(request)
    with connect() as conn:
        conn.execute(text(
            "delete from shortlists where clerk_user_id = :u and candidate_id::text = :c"
        ), {"u": prof["clerk_user_id"], "c": candidate_id})
    return {"ok": True}
