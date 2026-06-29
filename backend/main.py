"""Profiles API (Cloud Accountant Staffing) — FastAPI.

Phase 0: a Clerk-gated skeleton. A middleware verifies the Clerk JWT on every
/api/* call (except public paths) and stashes the user on request.state. Later
phases add Postgres, candidate/taxonomy CRUD, media, and resume generation.
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

import clerk_auth

app = FastAPI(title="Profiles API")

# Paths reachable without a Clerk token.
PUBLIC_PATHS = {"/api/health", "/api/healthz"}


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


@app.get("/api/me")
def me(request: Request):
    """Echo the verified Clerk identity — proves end-to-end token verification."""
    u = request.state.user
    return {"sub": u["sub"], "email": u["email"], "role": u["role"]}


@app.get("/api/admin/ping")
def admin_ping(request: Request):
    """Role gate demo: admin-only."""
    u = request.state.user
    if u["role"] != "admin":
        return JSONResponse(status_code=403, content={"ok": False, "error": "Admin only."})
    return {"ok": True, "admin": u["email"]}
