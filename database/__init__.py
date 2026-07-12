"""
Database package for the Enterprise Asset & Resource Management System.

Provides connection management, schema initialization, and data seeding utilities.
"""

from database.connection import get_connection, get_db
from database.schema import initialize_database

__all__ = ['get_connection', 'get_db', 'initialize_database']
