"""Profiles API (Cloud Accountant Staffing) — FastAPI.

A Clerk-gated API over a dockerized Postgres. Middleware verifies the Clerk JWT
on every /api/* call (except public paths) and stashes the user on request.state;
routers add candidate browse + admin CRUD, taxonomy CRUD, the shortlist, and
admin media upload.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

import clerk_auth
import config
from routers import account, candidates, catalog, uploads

log = logging.getLogger("profiles")

# Exact public paths + the read-only media prefix (so <img>/<video> load without
# a bearer token). Everything else under /api/* requires a valid Clerk token.
PUBLIC_PATHS = {"/api/health", "/api/healthz"}


def _is_public(path: str) -> bool:
    return path in PUBLIC_PATHS or path.startswith("/api/media/")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if config.RUN_MIGRATIONS:
        try:
            import migrate
            migrate.run()
        except Exception as exc:  # noqa: BLE001 — never crash startup; /api/health still answers
            log.error("migrations failed: %s", exc)
    yield


app = FastAPI(title="Profiles API", lifespan=lifespan)

os.makedirs(config.MEDIA_ROOT, exist_ok=True)
app.mount("/api/media", StaticFiles(directory=config.MEDIA_ROOT), name="media")


@app.middleware("http")
async def auth_gate(request: Request, call_next):
    path = request.url.path
    if not path.startswith("/api/") or _is_public(path):
        return await call_next(request)
    try:
        request.state.user = clerk_auth.verify_token(request.headers.get("authorization"))
    except clerk_auth.AuthError as exc:
        return JSONResponse(status_code=exc.status, content={"ok": False, "error": exc.detail})
    return await call_next(request)


@app.get("/api/health")
def health():
    return {"ok": True, "service": "profiles-api"}


app.include_router(account.router)
app.include_router(catalog.router)
app.include_router(candidates.router)
app.include_router(uploads.router)
