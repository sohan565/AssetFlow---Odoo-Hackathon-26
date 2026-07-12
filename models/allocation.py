"""
CRUD operations for the asset_allocations table.

Provides functions to allocate and return assets, query active and overdue
allocations, and retrieve allocation history.
"""

from datetime import datetime

from database.connection import get_db
from models.asset import transition_state


def allocate_asset(asset_id, employee_id, allocated_by,
                   department_id=None, expected_return=None, notes=None):
    """
    Allocate an asset to an employee.

    Creates an allocation record and transitions the asset state to 'Allocated'.

    Args:
        asset_id: The asset to allocate.
        employee_id: The employee receiving the asset.
        allocated_by: The employee performing the allocation.
        department_id: Optional department for the allocation.
        expected_return: Optional expected return date (ISO format string).
        notes: Optional allocation notes.

    Returns:
        dict: The newly created allocation record.
    """
    # Transition the asset state to 'Allocated'
    transition_state(asset_id, 'Allocated', allocated_by,
                     reason='Asset allocated')

    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO asset_allocations
               (asset_id, employee_id, department_id, allocated_by,
                expected_return, notes)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (asset_id, employee_id, department_id, allocated_by,
             expected_return, notes),
        )
        row = db.execute(
            "SELECT * FROM asset_allocations WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return dict(row)


def return_asset(allocation_id, returned_by=None):
    """
    Return an allocated asset.

    Sets the returned_at timestamp and transitions the asset back to 'Available'.

    Args:
        allocation_id: The allocation record ID.
        returned_by: Optional employee ID performing the return.

    Returns:
        dict: The updated allocation record.

    Raises:
        ValueError: If the allocation is not found.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM asset_allocations WHERE id = ?",
            (allocation_id,),
        ).fetchone()
        if not row:
            raise ValueError(
                f"Allocation with id {allocation_id} not found."
            )

        asset_id = row["asset_id"]
        now = datetime.utcnow().isoformat()

        db.execute(
            "UPDATE asset_allocations SET returned_at = ? WHERE id = ?",
            (now, allocation_id),
        )

    # Transition asset back to 'Available'
    changed_by = returned_by or row["allocated_by"]
    transition_state(asset_id, 'Available', changed_by,
                     reason='Asset returned')

    with get_db() as db:
        updated = db.execute(
            "SELECT * FROM asset_allocations WHERE id = ?",
            (allocation_id,),
        ).fetchone()
        return dict(updated)


def get_active_allocations():
    """
    Retrieve all active (un-returned) allocations with asset and employee info.

    Returns:
        list[dict]: Active allocations joined with asset and employee details.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT aa.*,
                      a.name AS asset_name,
                      a.asset_tag,
                      e.first_name,
                      e.last_name
               FROM asset_allocations aa
               JOIN assets a ON aa.asset_id = a.id
               JOIN employees e ON aa.employee_id = e.id
               WHERE aa.returned_at IS NULL
               ORDER BY aa.allocated_at DESC"""
        ).fetchall()
        return [dict(row) for row in rows]


def get_allocation(alloc_id):
    """
    Retrieve a single allocation by ID.

    Args:
        alloc_id: The allocation ID.

    Returns:
        dict or None: The allocation record, or None if not found.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM asset_allocations WHERE id = ?", (alloc_id,)
        ).fetchone()
        return dict(row) if row else None


def get_allocations_by_employee(emp_id):
    """
    Retrieve all allocations for a specific employee.

    Args:
        emp_id: The employee ID.

    Returns:
        list[dict]: Allocation records for the employee.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM asset_allocations
               WHERE employee_id = ?
               ORDER BY allocated_at DESC""",
            (emp_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_overdue_allocations():
    """
    Retrieve all overdue allocations (past expected return, not yet returned).

    Returns:
        list[dict]: Overdue allocation records.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM asset_allocations
               WHERE returned_at IS NULL
                 AND expected_return < date('now')
               ORDER BY expected_return ASC"""
        ).fetchall()
        return [dict(row) for row in rows]


def get_allocation_history(asset_id=None, employee_id=None):
    """
    Retrieve allocation history, optionally filtered by asset or employee.

    Args:
        asset_id: Optional asset ID to filter by.
        employee_id: Optional employee ID to filter by.

    Returns:
        list[dict]: Matching allocation records ordered by most recent first.
    """
    query = "SELECT * FROM asset_allocations WHERE 1=1"
    params = []

    if asset_id is not None:
        query += " AND asset_id = ?"
        params.append(asset_id)
    if employee_id is not None:
        query += " AND employee_id = ?"
        params.append(employee_id)

    query += " ORDER BY allocated_at DESC"

    with get_db() as db:
        rows = db.execute(query, params).fetchall()
        return [dict(row) for row in rows]
