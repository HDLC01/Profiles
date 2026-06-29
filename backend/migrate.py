"""Idempotent migration runner — applies backend/migrations/NNN_*.sql in order.

Tracks applied files in schema_migrations. Splits each file into statements
(quote-aware, strips -- comments) and runs them via the raw driver so SQL `:`
casts aren't misread as bind params. Runs on app startup (FastAPI lifespan).
"""
import glob
import os

from sqlalchemy import text

from db import engine

MIG_DIR = os.path.join(os.path.dirname(__file__), "migrations")


def _strip_line_comments(sql: str) -> str:
    out = []
    for line in sql.splitlines():
        idx = line.find("--")
        out.append(line[:idx] if idx >= 0 else line)
    return "\n".join(out)


def _split(sql: str) -> list[str]:
    sql = _strip_line_comments(sql)
    stmts, buf, in_str = [], [], False
    for ch in sql:
        if ch == "'":
            in_str = not in_str
            buf.append(ch)
        elif ch == ";" and not in_str:
            s = "".join(buf).strip()
            if s:
                stmts.append(s)
            buf = []
        else:
            buf.append(ch)
    tail = "".join(buf).strip()
    if tail:
        stmts.append(tail)
    return stmts


def run() -> None:
    with engine.begin() as conn:
        conn.execute(text(
            "create table if not exists schema_migrations ("
            " filename text primary key, applied_at timestamptz not null default now())"
        ))
        applied = {r[0] for r in conn.execute(text("select filename from schema_migrations"))}

    for path in sorted(glob.glob(os.path.join(MIG_DIR, "*.sql"))):
        fn = os.path.basename(path)
        if fn in applied:
            continue
        with open(path, encoding="utf-8") as fh:
            sql = fh.read()
        with engine.begin() as conn:
            for stmt in _split(sql):
                conn.exec_driver_sql(stmt)
            conn.execute(text("insert into schema_migrations (filename) values (:f)"), {"f": fn})
        print(f"[migrate] applied {fn}")


if __name__ == "__main__":
    run()
