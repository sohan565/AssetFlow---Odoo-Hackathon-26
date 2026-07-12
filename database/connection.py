import sqlite3
from config import DB_PATH

class DatabaseConnection:
    @staticmethod
    def get_connection():
        """
        Creates and returns a connection to the SQLite database.
        Enforces foreign key checks and sets rows to act like dictionaries.
        """
        try:
            conn = sqlite3.connect(DB_PATH)
            # Enforce foreign key constraints
            conn.execute("PRAGMA foreign_keys = ON;")
            # Enable WAL (Write-Ahead Logging) mode for concurrent access
            conn.execute("PRAGMA journal_mode = WAL;")
            # Set row factory to access columns by name
            conn.row_factory = sqlite3.Row
            return conn
        except sqlite3.Error as e:
            print(f"Database connection error: {e}")
            raise e
