"""Verify Clerk session JWTs on the FastAPI side.

Clerk issues RS256 session tokens signed by the instance's JWKS. We verify the
signature against the Clerk Frontend API JWKS, check the issuer + expiry, and
pull the user id (`sub`), email, and role out of the claims. Role + email are
expected to be added via a Clerk JWT template (custom claims); we fall back to
`client` / None when absent. Pattern adapted (copied, not imported) from the
Treadwell proposal tool's `verify_token`.
"""
from __future__ import annotations

import base64
import os

import jwt
from jwt import PyJWKClient


def _issuer_from_pk(pk: str) -> str:
    """A Clerk publishable key (public) encodes the Frontend API host:
    pk_(test|live)_<base64(host + '$')>. Derive the issuer from it so we don't
    have to configure CLERK_ISSUER separately."""
    try:
        b64 = pk.split("_", 2)[2]
        host = base64.b64decode(b64 + "===").decode("utf-8").rstrip("$")
        return f"https://{host}" if host else ""
    except Exception:
        return ""


CLERK_ISSUER = (
    os.environ.get("CLERK_ISSUER")
    or _issuer_from_pk(os.environ.get("CLERK_PUBLISHABLE_KEY") or os.environ.get("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY") or "")
).rstrip("/")
CLERK_JWKS_URL = os.environ.get("CLERK_JWKS_URL") or (
    f"{CLERK_ISSUER}/.well-known/jwks.json" if CLERK_ISSUER else ""
)


class AuthError(Exception):
    def __init__(self, status: int, detail: str):
        self.status = status
        self.detail = detail
        super().__init__(detail)


_jwk_client: PyJWKClient | None = None


def _client() -> PyJWKClient:
    global _jwk_client
    if not CLERK_JWKS_URL:
        raise AuthError(503, "Clerk auth not configured (set CLERK_ISSUER / CLERK_JWKS_URL).")
    if _jwk_client is None:
        _jwk_client = PyJWKClient(CLERK_JWKS_URL)
    return _jwk_client


def verify_token(authorization: str | None) -> dict:
    """Return {sub, email, role, claims} for a valid Clerk token; raise AuthError."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthError(401, "Missing bearer token.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        key = _client().get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER or None,
            options={"verify_aud": False, "require": ["exp", "iat"]},
            leeway=10,
        )
    except AuthError:
        raise
    except Exception as exc:  # noqa: BLE001 — surface a clean 401
        raise AuthError(401, f"Invalid token: {str(exc)[:140]}")

    meta = claims.get("public_metadata") or claims.get("metadata") or {}
    role = claims.get("role") or (meta.get("role") if isinstance(meta, dict) else None) or "client"
    return {
        "sub": claims.get("sub"),
        "email": (claims.get("email") or "").lower() or None,
        "role": role,
        "claims": claims,
    }
