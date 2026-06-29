"""Request helpers: the verified Clerk user, the synced DB profile, role gating.

The Clerk token only reliably carries `sub` (+ maybe email), so ROLE is owned by
our `profiles` table — bootstrapped from config.ADMIN_EMAILS, then admin-editable.
"""
from fastapi import HTTPException, Request
from sqlalchemy import text

import config
from db import connect


def current_user(request: Request) -> dict:
    u = getattr(request.state, "user", None)
    if not u or not u.get("sub"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return u


def _sync_profile(conn, user: dict) -> dict:
    sub = user["sub"]
    email = (user.get("email") or "").lower() or None
    is_admin_email = bool(email) and email in config.ADMIN_EMAILS
    row = conn.execute(
        text("select clerk_user_id, email, role, status from profiles where clerk_user_id = :c"),
        {"c": sub},
    ).mappings().first()
    if row is None:
        role = "admin" if is_admin_email else (user.get("role") or "client")
        status = "active" if role == "admin" else "pending"
        conn.execute(
            text("insert into profiles (clerk_user_id, email, role, status) values (:c, :e, :r, :s)"),
            {"c": sub, "e": email, "r": role, "s": status},
        )
        return {"clerk_user_id": sub, "email": email, "role": role, "status": status}
    role, status = row["role"], row["status"]
    if is_admin_email and role != "admin":
        role, status = "admin", "active"
    conn.execute(
        text("update profiles set email = :e, role = :r, status = :s, updated_at = now() where clerk_user_id = :c"),
        {"e": email or row["email"], "r": role, "s": status, "c": sub},
    )
    return {"clerk_user_id": sub, "email": email or row["email"], "role": role, "status": status}


def current_profile(request: Request) -> dict:
    """Verified user + synced DB profile (clerk_user_id, email, role, status)."""
    user = current_user(request)
    with connect() as conn:
        return _sync_profile(conn, user)


def require_admin(request: Request) -> dict:
    prof = current_profile(request)
    if prof["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return prof
