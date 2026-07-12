"""
Database connection manager for the Enterprise Asset & Resource Management System.

Provides functions to obtain configured SQLite connections with WAL mode,
foreign key enforcement, and a context manager for transactional access.
"""

import sqlite3
from contextlib import contextmanager

from config import DB_PATH


def get_connection() -> sqlite3.Connection:
    """
    Create and return a configured SQLite database connection.

    The connection is configured with:
        - WAL (Write-Ahead Logging) journal mode for improved concurrency.
        - Foreign key constraint enforcement enabled.
        - Row factory set to sqlite3.Row for dict-like row access.

    Returns:
        sqlite3.Connection: A fully configured database connection.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    """
    Context manager that yields a configured database connection.

    Automatically commits on successful completion of the block,
    rolls back on any exception, and always closes the connection.

    Yields:
        sqlite3.Connection: A configured database connection.

    Example:
        with get_db() as db:
            db.execute("INSERT INTO departments (name, code) VALUES (?, ?)", ('Engineering', 'ENG'))
    """
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
