"""
CRUD operations for the departments table.

Provides functions to create, read, update, and deactivate departments
in the Enterprise Asset & Resource Management System.
"""

from database.connection import get_db


def create_department(name, code, parent_id=None):
    """
    Create a new department.

    Args:
        name: Department name (must be unique).
        code: Department code (must be unique).
        parent_id: Optional parent department ID for hierarchy.

    Returns:
        dict: The newly created department record.
    """
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO departments (name, code, parent_id)
               VALUES (?, ?, ?)""",
            (name, code, parent_id),
        )
        row = db.execute(
            "SELECT * FROM departments WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return dict(row)


def get_department(dept_id):
    """
    Retrieve a single department by ID.

    Args:
        dept_id: The department ID.

    Returns:
        dict or None: The department record, or None if not found.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM departments WHERE id = ?", (dept_id,)
        ).fetchone()
        return dict(row) if row else None


def get_all_departments():
    """
    Retrieve all departments.

    Returns:
        list[dict]: A list of all department records.
    """
    with get_db() as db:
        rows = db.execute("SELECT * FROM departments ORDER BY name").fetchall()
        return [dict(row) for row in rows]


def update_department(dept_id, **kwargs):
    """
    Update department fields.

    Args:
        dept_id: The department ID to update.
        **kwargs: Column-value pairs to update (e.g., name='New Name').

    Returns:
        dict: The updated department record.

    Raises:
        ValueError: If no fields are provided or department not found.
    """
    if not kwargs:
        raise ValueError("No fields provided for update.")

    allowed = {"name", "code", "parent_id", "head_employee_id", "is_active"}
    invalid = set(kwargs.keys()) - allowed
    if invalid:
        raise ValueError(f"Invalid fields: {invalid}")

    set_clause = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [dept_id]

    with get_db() as db:
        db.execute(
            f"UPDATE departments SET {set_clause} WHERE id = ?", values
        )
        row = db.execute(
            "SELECT * FROM departments WHERE id = ?", (dept_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Department with id {dept_id} not found.")
        return dict(row)


def set_department_head(dept_id, employee_id):
    """
    Set the head employee for a department.

    Args:
        dept_id: The department ID.
        employee_id: The employee ID to set as head.

    Returns:
        dict: The updated department record.
    """
    with get_db() as db:
        db.execute(
            "UPDATE departments SET head_employee_id = ? WHERE id = ?",
            (employee_id, dept_id),
        )
        row = db.execute(
            "SELECT * FROM departments WHERE id = ?", (dept_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Department with id {dept_id} not found.")
        return dict(row)


def deactivate_department(dept_id):
    """
    Deactivate a department by setting is_active to 0.

    Args:
        dept_id: The department ID to deactivate.

    Returns:
        dict: The updated department record.
    """
    with get_db() as db:
        db.execute(
            "UPDATE departments SET is_active = 0 WHERE id = ?", (dept_id,)
        )
        row = db.execute(
            "SELECT * FROM departments WHERE id = ?", (dept_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Department with id {dept_id} not found.")
        return dict(row)
