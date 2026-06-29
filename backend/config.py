"""Runtime settings from env."""
import os


def _bool(v: str | None, default: bool = False) -> bool:
    if v is None:
        return default
    return v.strip().lower() in {"1", "true", "yes", "on"}


POSTGRES_HOST = os.environ.get("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.environ.get("POSTGRES_PORT", "5437")
POSTGRES_DB = os.environ.get("POSTGRES_DB", "profiles")
POSTGRES_USER = os.environ.get("POSTGRES_USER", "profiles")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "profiles-dev-password")

DATABASE_URL = os.environ.get("DATABASE_URL") or (
    f"postgresql+psycopg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

RUN_MIGRATIONS = _bool(os.environ.get("RUN_MIGRATIONS"), True)
RUN_SEED = _bool(os.environ.get("RUN_SEED"), True)

PAGE_SIZE = 25  # house rule: lists paginate at 25/page
ASSESS_BASE_URL = os.environ.get("ASSESS_BASE_URL", "https://assess.wetreadwell.com")

# Media: VPS-local for now (abstract behind this path; swap to a CDN before prod
# traffic). Served read-only at /api/media; uploads are admin-gated.
MEDIA_ROOT = os.environ.get("MEDIA_ROOT") or os.path.join(os.path.dirname(__file__), "_media")
MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "50"))

# Admin bootstrap: emails that should be treated as admin on first profile sync.
ADMIN_EMAILS = {
    e.strip().lower()
    for e in (os.environ.get("ADMIN_EMAILS", "hanz@wetreadwell.com,kyle@wetreadwell.com")).split(",")
    if e.strip()
}
