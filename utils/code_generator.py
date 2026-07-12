"""Sequential code generators for assets, employees, and maintenance requests.

Each generator queries the database for the current maximum code and increments
the sequence number. Handles the case where no codes exist yet (starts at 1).
"""

import re
from datetime import datetime

from database.connection import get_db


def generate_asset_tag() -> str:
    """Generate next sequential asset tag.
    
    Format: 'AF-NNNN' where NNNN is a zero-padded sequential number.
    Queries the database for the maximum existing tag and increments.
    
    Returns:
        A new unique asset tag string (e.g., 'AF-0001').
    """
    prefix = "AF-"
    
    with get_db() as db:
        row = db.execute(
            "SELECT asset_tag FROM assets WHERE asset_tag LIKE ? ORDER BY asset_tag DESC LIMIT 1",
            (f"{prefix}%",)
        ).fetchone()
    
    if row:
        # Extract the numeric part and increment
        match = re.search(r'(\d+)$', row['asset_tag'])
        next_num = int(match.group(1)) + 1 if match else 1
    else:
        next_num = 1
    
    return f"{prefix}{next_num:04d}"



def generate_employee_code() -> str:
    """Generate next sequential employee code.
    
    Format: 'EMP-NNNNN' where NNNNN is zero-padded sequential number.
    Queries the database for the maximum existing code and increments.
    
    Returns:
        A new unique employee code string (e.g., 'EMP-00001').
    """
    with get_db() as db:
        row = db.execute(
            "SELECT employee_code FROM employees ORDER BY employee_code DESC LIMIT 1"
        ).fetchone()
    
    if row:
        match = re.search(r'(\d+)$', row['employee_code'])
        next_num = int(match.group(1)) + 1 if match else 1
    else:
        next_num = 1
    
    return f"EMP-{next_num:05d}"


def generate_maintenance_code() -> str:
    """Generate next sequential maintenance request code.
    
    Format: 'MR-YYYY-NNNN' where YYYY is current year and NNNN is zero-padded.
    Sequential per year — resets count for each new year.
    
    Returns:
        A new unique maintenance request code (e.g., 'MR-2026-0001').
    """
    year = datetime.now().year
    prefix = f"MR-{year}-"
    
    with get_db() as db:
        row = db.execute(
            "SELECT request_code FROM maintenance_requests WHERE request_code LIKE ? ORDER BY request_code DESC LIMIT 1",
            (f"{prefix}%",)
        ).fetchone()
    
    if row:
        match = re.search(r'(\d+)$', row['request_code'])
        next_num = int(match.group(1)) + 1 if match else 1
    else:
        next_num = 1
    
    return f"{prefix}{next_num:04d}"
