"""
CRUD operations for the audit_cycles, audit_assignments, and audit_findings tables.

Provides functions to manage audit campaigns, assign auditors, record findings,
and detect discrepancies by comparing actual vs. expected asset state/location.
"""

from database.connection import get_db


def create_cycle(cycle_name, start_date, end_date, created_by):
    """
    Create a new audit cycle.

    Args:
        cycle_name: Name of the audit cycle.
        start_date: Start date (ISO format string).
        end_date: End date (ISO format string).
        created_by: Employee ID creating the cycle.

    Returns:
        dict: The newly created audit cycle record.
    """
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO audit_cycles
               (cycle_name, start_date, end_date, created_by)
               VALUES (?, ?, ?, ?)""",
            (cycle_name, start_date, end_date, created_by),
        )
        row = db.execute(
            "SELECT * FROM audit_cycles WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return dict(row)


def get_cycle(cycle_id):
    """
    Retrieve a single audit cycle by ID.

    Args:
        cycle_id: The audit cycle ID.

    Returns:
        dict or None: The cycle record, or None if not found.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM audit_cycles WHERE id = ?", (cycle_id,)
        ).fetchone()
        return dict(row) if row else None


def get_all_cycles():
    """
    Retrieve all audit cycles.

    Returns:
        list[dict]: A list of all audit cycle records.
    """
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM audit_cycles ORDER BY start_date DESC"
        ).fetchall()
        return [dict(row) for row in rows]


def update_cycle_status(cycle_id, status):
    """
    Update the status of an audit cycle.

    Args:
        cycle_id: The audit cycle ID.
        status: The new status ('Planned', 'In Progress', 'Completed').

    Returns:
        dict: The updated cycle record.

    Raises:
        ValueError: If the cycle is not found.
    """
    with get_db() as db:
        db.execute(
            "UPDATE audit_cycles SET status = ? WHERE id = ?",
            (status, cycle_id),
        )
        row = db.execute(
            "SELECT * FROM audit_cycles WHERE id = ?", (cycle_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Audit cycle with id {cycle_id} not found.")
        return dict(row)


def create_assignment(audit_cycle_id, auditor_id, department_id=None,
                      category_id=None):
    """
    Create an audit assignment for an auditor within a cycle.

    Args:
        audit_cycle_id: The audit cycle ID.
        auditor_id: The auditor's employee ID.
        department_id: Optional department scope.
        category_id: Optional asset category scope.

    Returns:
        dict: The newly created assignment record.
    """
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO audit_assignments
               (audit_cycle_id, auditor_id, department_id, category_id)
               VALUES (?, ?, ?, ?)""",
            (audit_cycle_id, auditor_id, department_id, category_id),
        )
        row = db.execute(
            "SELECT * FROM audit_assignments WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return dict(row)


def get_assignments(cycle_id):
    """
    Retrieve all assignments for a specific audit cycle.

    Args:
        cycle_id: The audit cycle ID.

    Returns:
        list[dict]: Assignment records for the cycle.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM audit_assignments
               WHERE audit_cycle_id = ?
               ORDER BY id""",
            (cycle_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def record_finding(audit_cycle_id, asset_id, auditor_id, actual_state,
                   actual_location, notes=None):
    """
    Record an audit finding with automatic discrepancy detection.

    Fetches the asset's current state and location from the assets table,
    compares them with the actual values provided, and determines the
    discrepancy type:
      - 'Missing' if the asset record is not found.
      - 'State Mismatch' if actual_state differs from expected.
      - 'Location Mismatch' if actual_location differs from expected.
      - None if everything matches.

    Args:
        audit_cycle_id: The audit cycle ID.
        asset_id: The asset being audited.
        auditor_id: The auditor's employee ID.
        actual_state: The state observed by the auditor.
        actual_location: The location observed by the auditor.
        notes: Optional notes.

    Returns:
        dict: The newly created finding record.
    """
    with get_db() as db:
        # Fetch the asset's expected state and location
        asset_row = db.execute(
            "SELECT current_state, location FROM assets WHERE id = ?",
            (asset_id,),
        ).fetchone()

        if not asset_row:
            expected_state = None
            expected_location = None
            discrepancy_type = 'Missing'
        else:
            expected_state = asset_row["current_state"]
            expected_location = asset_row["location"]

            if actual_state != expected_state:
                discrepancy_type = 'State Mismatch'
            elif actual_location != expected_location:
                discrepancy_type = 'Location Mismatch'
            else:
                discrepancy_type = None

        cursor = db.execute(
            """INSERT INTO audit_findings
               (audit_cycle_id, asset_id, auditor_id,
                expected_state, actual_state,
                expected_location, actual_location,
                discrepancy_type, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (audit_cycle_id, asset_id, auditor_id,
             expected_state, actual_state,
             expected_location, actual_location,
             discrepancy_type, notes),
        )
        row = db.execute(
            "SELECT * FROM audit_findings WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return dict(row)


def get_findings(cycle_id):
    """
    Retrieve all findings for a specific audit cycle.

    Args:
        cycle_id: The audit cycle ID.

    Returns:
        list[dict]: Finding records for the cycle.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM audit_findings
               WHERE audit_cycle_id = ?
               ORDER BY found_at DESC""",
            (cycle_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_discrepancies(cycle_id):
    """
    Retrieve only findings with discrepancies for a specific audit cycle.

    Args:
        cycle_id: The audit cycle ID.

    Returns:
        list[dict]: Finding records where discrepancy_type is not NULL.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM audit_findings
               WHERE audit_cycle_id = ?
                 AND discrepancy_type IS NOT NULL
               ORDER BY found_at DESC""",
            (cycle_id,),
        ).fetchall()
        return [dict(row) for row in rows]
