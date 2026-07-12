import re
from datetime import datetime

def validate_email(email: str) -> bool:
    """Verifies if an email matches a simple standard pattern."""
    if not email:
        return False
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(pattern, email))

def validate_date(date_string: str) -> bool:
    """Validates if a date string is in the format YYYY-MM-DD."""
    if not date_string:
        return False
    try:
        datetime.strptime(date_string, "%Y-%m-%d")
        return True
    except ValueError:
        return False

def validate_datetime(datetime_string: str) -> bool:
    """Validates if a datetime string matches the format YYYY-MM-DD HH:MM:SS or ISO 8601."""
    if not datetime_string:
        return False
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            datetime.strptime(datetime_string, fmt)
            return True
        except ValueError:
            continue
    return False
