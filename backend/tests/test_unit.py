"""Pure unit tests — no DB or network. Cover the auth, migration, and candidate
helpers that carry real logic."""
import base64

import pytest

import clerk_auth
import migrate
from routers import candidates


def _make_pk(host: str) -> str:
    return "pk_test_" + base64.b64encode((host + "$").encode()).decode()


# ── clerk_auth ───────────────────────────────────────────────────────────────
def test_issuer_from_pk_decodes_host():
    pk = _make_pk("example-123.clerk.accounts.dev")
    assert clerk_auth._issuer_from_pk(pk) == "https://example-123.clerk.accounts.dev"


def test_issuer_from_pk_garbage_is_empty():
    assert clerk_auth._issuer_from_pk("not-a-key") == ""
    assert clerk_auth._issuer_from_pk("") == ""


def test_verify_token_rejects_missing_and_non_bearer():
    with pytest.raises(clerk_auth.AuthError) as e:
        clerk_auth.verify_token(None)
    assert e.value.status == 401
    with pytest.raises(clerk_auth.AuthError):
        clerk_auth.verify_token("Token abc")


# ── migrate ─────────────────────────────────────────────────────────────────
def test_split_separates_statements_and_strips_comments():
    sql = "create table a (id int); -- a comment ; with semicolon\ninsert into a values (1);"
    stmts = migrate._split(sql)
    assert len(stmts) == 2
    assert stmts[0].startswith("create table a")
    assert "comment" not in stmts[1]


def test_split_ignores_semicolon_inside_string():
    stmts = migrate._split("insert into t (x) values ('a;b'); select 1;")
    assert len(stmts) == 2
    assert "'a;b'" in stmts[0]


# ── candidates ──────────────────────────────────────────────────────────────
def test_slug_is_lowercase_hyphenated_with_suffix():
    s = candidates._slug("Ericka  Dela Cruz!")
    assert s.startswith("ericka-dela-cruz-")
    assert " " not in s
    assert s == s.lower()
    # unique-ish suffix appended
    assert s != candidates._slug("Ericka  Dela Cruz!")


def test_rating_scale_constant():
    assert {"Below average", "Average", "Above average", "Well above average", "Exceptional"} == candidates.RATINGS


# ── résumé PDF ──────────────────────────────────────────────────────────────
def test_resume_pdf_renders_valid_pdf():
    from services.resume_pdf import build_resume_pdf
    pdf = build_resume_pdf({
        "full_name": "Jordan — Tëst", "role_title": "US Accountant/Bookkeeper",
        "about": "Reconciliations & reporting — detail-oriented.", "skills": ["Bookkeeping", "AP"],
        "software": ["QuickBooks Online"], "assessments": [{"name": "Accounting", "rating": "Exceptional"}],
        "price_monthly": 3000, "experience_label": "3-5 years", "credential": "CPA",
    })
    assert pdf[:5] == b"%PDF-"
    assert len(pdf) > 800
