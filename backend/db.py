"""SQLAlchemy engine + a transactional connect() context manager.

Mirrors the Treadwell Assess data pattern (core + text()), psycopg3 driver.
"""
from contextlib import contextmanager

from sqlalchemy import create_engine

import config

engine = create_engine(config.DATABASE_URL, pool_pre_ping=True, future=True)


@contextmanager
def connect():
    """Yield a connection inside a transaction; commit on success, rollback on error."""
    with engine.begin() as conn:
        yield conn
