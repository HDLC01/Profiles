"""Profiles API (Cloud Accountant Staffing) — FastAPI.

A Clerk-gated API over a dockerized Postgres. Middleware verifies the Clerk JWT
on every /api/* call (except public paths) and stashes the user on request.state;
routers add candidate browse + admin CRUD, taxonomy CRUD, and the shortlist.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

import clerk_auth
import config
from routers import account, candidates, catalog

log = logging.getLogger("profiles")

PUBLIC_PATHS = {"/api/health", "/api/healthz"}


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


@app.middleware("http")
async def auth_gate(request: Request, call_next):
    path = request.url.path
    if not path.startswith("/api/") or path in PUBLIC_PATHS:
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
