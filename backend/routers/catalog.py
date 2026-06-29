"""Taxonomy CRUD: skills / software / assessments. Read for any signed-in user
(powers filters + the intake form); writes are admin-only."""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text

from db import connect
from deps import current_user, require_admin

router = APIRouter(prefix="/api", tags=["catalog"])

TABLES = {"skills": "skills", "software": "software", "assessments": "assessments"}


def _table(kind: str) -> str:
    if kind not in TABLES:
        raise HTTPException(status_code=404, detail="Unknown catalog type")
    return TABLES[kind]


def _list(conn, table: str) -> list[dict]:
    rows = conn.execute(text(
        f"select id, name, active, ordering from {table} order by ordering, name"
    )).mappings().all()
    return [{"id": str(r["id"]), "name": r["name"], "active": r["active"], "ordering": r["ordering"]} for r in rows]


@router.get("/catalog")
def catalog(request: Request):
    current_user(request)
    with connect() as conn:
        return {k: _list(conn, t) for k, t in TABLES.items()}


class CatalogItem(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    active: bool = True
    ordering: int = 0


@router.post("/catalog/{kind}")
def create_item(kind: str, body: CatalogItem, request: Request):
    require_admin(request)
    table = _table(kind)
    with connect() as conn:
        row = conn.execute(text(
            f"insert into {table} (name, active, ordering) values (:n, :a, :o) "
            "on conflict (name) do update set active = excluded.active, ordering = excluded.ordering "
            "returning id, name, active, ordering"
        ), {"n": body.name.strip(), "a": body.active, "o": body.ordering}).mappings().first()
    return {"id": str(row["id"]), "name": row["name"], "active": row["active"], "ordering": row["ordering"]}


@router.patch("/catalog/{kind}/{item_id}")
def update_item(kind: str, item_id: str, body: CatalogItem, request: Request):
    require_admin(request)
    table = _table(kind)
    with connect() as conn:
        row = conn.execute(text(
            f"update {table} set name = :n, active = :a, ordering = :o where id::text = :i "
            "returning id, name, active, ordering"
        ), {"n": body.name.strip(), "a": body.active, "o": body.ordering, "i": item_id}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": str(row["id"]), "name": row["name"], "active": row["active"], "ordering": row["ordering"]}


@router.delete("/catalog/{kind}/{item_id}")
def delete_item(kind: str, item_id: str, request: Request):
    require_admin(request)
    table = _table(kind)
    with connect() as conn:
        conn.execute(text(f"delete from {table} where id::text = :i"), {"i": item_id})
    return {"ok": True}
