"""
CRUD operations for the maintenance_requests and maintenance_approvals tables.

Provides functions to manage maintenance request workflows including
submission, approval chains, status updates, and completion tracking.
"""

from datetime import datetime

from database.connection import get_db


def create_request(request_code, asset_id, requested_by, issue_description,
                   priority='Medium', estimated_cost=None):
    """
    Create a new maintenance request.

    Args:
        request_code: Unique request code.
        asset_id: The asset requiring maintenance.
        requested_by: Employee ID submitting the request.
        issue_description: Description of the issue.
        priority: Priority level ('Low', 'Medium', 'High', 'Critical').
                  Defaults to 'Medium'.
        estimated_cost: Optional estimated cost of maintenance.

    Returns:
        dict: The newly created maintenance request record.
    """
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO maintenance_requests
               (request_code, asset_id, requested_by, issue_description,
                priority, estimated_cost)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (request_code, asset_id, requested_by, issue_description,
             priority, estimated_cost),
        )
        row = db.execute(
            "SELECT * FROM maintenance_requests WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return dict(row)


def get_request(request_id):
    """
    Retrieve a single maintenance request by ID.

    Args:
        request_id: The maintenance request ID.

    Returns:
        dict or None: The request record, or None if not found.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM maintenance_requests WHERE id = ?",
            (request_id,),
        ).fetchone()
        return dict(row) if row else None


def get_all_requests():
    """
    Retrieve all maintenance requests.

    Returns:
        list[dict]: A list of all maintenance request records.
    """
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM maintenance_requests ORDER BY submitted_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]


def get_requests_by_status(status):
    """
    Retrieve maintenance requests filtered by status.

    Args:
        status: The status to filter by.

    Returns:
        list[dict]: Matching maintenance request records.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM maintenance_requests
               WHERE status = ?
               ORDER BY submitted_at DESC""",
            (status,),
        ).fetchall()
        return [dict(row) for row in rows]


def update_request_status(request_id, status):
    """
    Update the status of a maintenance request.

    Args:
        request_id: The maintenance request ID.
        status: The new status value.

    Returns:
        dict: The updated request record.

    Raises:
        ValueError: If the request is not found.
    """
    with get_db() as db:
        db.execute(
            "UPDATE maintenance_requests SET status = ? WHERE id = ?",
            (status, request_id),
        )
        row = db.execute(
            "SELECT * FROM maintenance_requests WHERE id = ?",
            (request_id,),
        ).fetchone()
        if not row:
            raise ValueError(
                f"Maintenance request with id {request_id} not found."
            )
        return dict(row)


def add_approval(request_id, approver_id, decision, comments=None,
                 approval_level=1):
    """
    Add an approval decision for a maintenance request.

    Inserts an approval record and updates the maintenance request status
    based on the decision: 'Approved' -> 'Approved', 'Rejected' -> 'Rejected',
    'Escalated' -> 'Escalated'.

    Args:
        request_id: The maintenance request ID.
        approver_id: The approver's employee ID.
        decision: The decision ('Approved', 'Rejected', 'Escalated').
        comments: Optional comments from the approver.
        approval_level: Approval level (default 1).

    Returns:
        dict: The newly created approval record.
    """
    # Map decision to request status
    status_map = {
        'Approved': 'Approved',
        'Rejected': 'Rejected',
        'Escalated': 'Escalated',
    }

    with get_db() as db:
        # Insert the approval record
        cursor = db.execute(
            """INSERT INTO maintenance_approvals
               (request_id, approver_id, decision, comments, approval_level)
               VALUES (?, ?, ?, ?, ?)""",
            (request_id, approver_id, decision, comments, approval_level),
        )

        # Update the request status based on decision
        new_status = status_map.get(decision)
        if new_status:
            db.execute(
                "UPDATE maintenance_requests SET status = ? WHERE id = ?",
                (new_status, request_id),
            )

        row = db.execute(
            "SELECT * FROM maintenance_approvals WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return dict(row)


def start_maintenance(request_id):
    """
    Start maintenance by setting the request status to 'In Progress'.

    Args:
        request_id: The maintenance request ID.

    Returns:
        dict: The updated request record.
    """
    return update_request_status(request_id, 'In Progress')


def complete_maintenance(request_id, actual_cost=None):
    """
    Complete maintenance by setting status to 'Completed' and recording
    the resolution timestamp and optional actual cost.

    Args:
        request_id: The maintenance request ID.
        actual_cost: Optional actual cost of the maintenance.

    Returns:
        dict: The updated request record.

    Raises:
        ValueError: If the request is not found.
    """
    now = datetime.utcnow().isoformat()

    with get_db() as db:
        if actual_cost is not None:
            db.execute(
                """UPDATE maintenance_requests
                   SET status = 'Completed', resolved_at = ?, actual_cost = ?
                   WHERE id = ?""",
                (now, actual_cost, request_id),
            )
        else:
            db.execute(
                """UPDATE maintenance_requests
                   SET status = 'Completed', resolved_at = ?
                   WHERE id = ?""",
                (now, request_id),
            )

        row = db.execute(
            "SELECT * FROM maintenance_requests WHERE id = ?",
            (request_id,),
        ).fetchone()
        if not row:
            raise ValueError(
                f"Maintenance request with id {request_id} not found."
            )
        return dict(row)


def get_pending_approvals(approver_id=None):
    """
    Retrieve all maintenance requests pending approval, joined with asset info.

    Args:
        approver_id: Optional approver ID (reserved for future filtering).

    Returns:
        list[dict]: Pending maintenance requests with asset_name and asset_tag.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT mr.*,
                      a.name AS asset_name,
                      a.asset_tag
               FROM maintenance_requests mr
               JOIN assets a ON mr.asset_id = a.id
               WHERE mr.status = 'Pending Approval'
               ORDER BY mr.submitted_at DESC"""
        ).fetchall()
        return [dict(row) for row in rows]


def get_stale_pending_requests(hours=48):
    """
    Retrieve maintenance requests that have been pending for longer
    than the specified number of hours.

    Args:
        hours: Number of hours to consider a request stale. Defaults to 48.

    Returns:
        list[dict]: Stale pending maintenance request records.
    """
    with get_db() as db:
        rows = db.execute(
            f"""SELECT * FROM maintenance_requests
                WHERE status = 'Pending Approval'
                  AND submitted_at < datetime('now', '-{int(hours)} hours')
                ORDER BY submitted_at ASC"""
        ).fetchall()
        return [dict(row) for row in rows]
