"""Input validation helpers for the Enterprise Asset & Resource Management System."""

import re
from datetime import datetime


def validate_email(email: str) -> bool:
    """Validate email format using basic regex pattern.
    
    Args:
        email: Email address string to validate.
    
    Returns:
        True if email matches basic pattern, False otherwise.
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_date(date_str: str) -> bool:
    """Validate date string in ISO format YYYY-MM-DD.
    
    Args:
        date_str: Date string to validate.
    
    Returns:
        True if string is valid ISO date, False otherwise.
    """
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except (ValueError, TypeError):
        return False


def validate_datetime(dt_str: str) -> bool:
    """Validate datetime string in ISO format.
    
    Accepts both 'YYYY-MM-DDTHH:MM:SS' and 'YYYY-MM-DD HH:MM:SS' formats.
    
    Args:
        dt_str: Datetime string to validate.
    
    Returns:
        True if string is valid ISO datetime, False otherwise.
    """
    for fmt in ('%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
        try:
            datetime.strptime(dt_str, fmt)
            return True
        except (ValueError, TypeError):
            continue
    return False


def validate_required(value, field_name: str) -> str:
    """Validate that a value is non-empty after stripping whitespace.
    
    Args:
        value: The value to check.
        field_name: Name of the field for error messages.
    
    Returns:
        The stripped string value.
    
    Raises:
        ValueError: If value is None, empty, or whitespace-only.
    """
    if value is None:
        raise ValueError(f"{field_name} is required.")
    value = str(value).strip()
    if not value:
        raise ValueError(f"{field_name} cannot be empty.")
    return value


def validate_choice(value, choices: list, field_name: str) -> str:
    """Validate that a value is in an allowed list of choices.
    
    Args:
        value: The value to check.
        choices: List of allowed values.
        field_name: Name of the field for error messages.
    
    Returns:
        The validated value as a string.
    
    Raises:
        ValueError: If value is not in the choices list.
    """
    value = str(value).strip()
    if value not in choices:
        raise ValueError(f"{field_name} must be one of: {', '.join(choices)}. Got: '{value}'")
    return value
