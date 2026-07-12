"""
CRUD operations and workflows for the transfer_requests table.

Handles creating transfer requests, fetching pending transfers, and executing the
approval/rejection workflow, including automated reallocation transitions.
"""

from datetime import datetime
import sqlite3
from database.connection import get_db
from models import allocation, asset, notification

def create_transfer_request(asset_id, from_employee_id, to_employee_id, requested_by):
    """
    Create a new asset transfer request.

    Args:
        asset_id: ID of the asset to transfer.
        from_employee_id: ID of the employee currently holding the asset.
        to_employee_id: ID of the employee requesting the asset.
        requested_by: ID of the employee raising the request.

    Returns:
        dict: The newly created transfer request.
    """
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO transfer_requests 
               (asset_id, from_employee_id, to_employee_id, requested_by)
               VALUES (?, ?, ?, ?)""",
            (asset_id, from_employee_id, to_employee_id, requested_by),
        )
        row = db.execute(
            "SELECT * FROM transfer_requests WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return dict(row)

def get_transfer_request(transfer_id):
    """
    Retrieve a transfer request by ID.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM transfer_requests WHERE id = ?", (transfer_id,)
        ).fetchone()
        return dict(row) if row else None

def get_pending_transfers():
    """
    Retrieve all pending transfer requests.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT t.*, a.name as asset_name, a.asset_tag,
                      e1.first_name || ' ' || e1.last_name as from_employee_name,
                      e2.first_name || ' ' || e2.last_name as to_employee_name
               FROM transfer_requests t
               JOIN assets a ON t.asset_id = a.id
               JOIN employees e1 ON t.from_employee_id = e1.id
               JOIN employees e2 ON t.to_employee_id = e2.id
               WHERE t.status = 'Pending'"""
        ).fetchall()
        return [dict(row) for row in rows]

def approve_transfer(transfer_id, decided_by, comments=None):
    """
    Approve an asset transfer request.
    
    This closes the current active allocation for the old owner, opens a new
    active allocation for the new owner, transitions the asset tag/history,
    and updates the status of the transfer request to 'Approved'.
    """
    with get_db() as db:
        # Get transfer request
        row = db.execute(
            "SELECT * FROM transfer_requests WHERE id = ?", (transfer_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Transfer request {transfer_id} not found.")
        req = dict(row)
        
        if req['status'] != 'Pending':
            raise ValueError(f"Transfer request is already resolved (status: {req['status']}).")
            
        asset_id = req['asset_id']
        from_emp = req['from_employee_id']
        to_emp = req['to_employee_id']
        
        # Check active allocation for this asset
        alloc_row = db.execute(
            "SELECT * FROM asset_allocations WHERE asset_id = ? AND returned_at IS NULL",
            (asset_id,)
        ).fetchone()
        
        now_str = datetime.utcnow().isoformat()
        
        if alloc_row:
            alloc_rec = dict(alloc_row)
            # 1. Close current allocation
            db.execute(
                "UPDATE asset_allocations SET returned_at = ? WHERE id = ?",
                (now_str, alloc_rec['id'])
            )
        
        # 2. Create new active allocation
        cursor = db.execute(
            """INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, allocated_at, notes)
               VALUES (?, ?, ?, ?, ?)""",
            (asset_id, to_emp, decided_by, now_str, f"Transferred from Emp #{from_emp} via request #{transfer_id}")
        )
        
        # 3. Write asset state log update
        db.execute(
            """INSERT INTO asset_state_log (asset_id, from_state, to_state, changed_by, reason)
               VALUES (?, ?, ?, ?, ?)""",
            (asset_id, 'Allocated', 'Allocated', decided_by, f"Transferred to Emp #{to_emp} via approved request #{transfer_id}")
        )
        
        # 4. Update request status
        db.execute(
            """UPDATE transfer_requests
               SET status = 'Approved', decided_at = ?, decided_by = ?, comments = ?
               WHERE id = ?""",
            (now_str, decided_by, comments, transfer_id)
        )
        
        # Notify the recipient
        notification.create_notification(
            recipient_id=to_emp,
            type='maintenance_update', # Use as general update category
            title='Asset Transfer Approved',
            message=f"Your request to transfer asset ID {asset_id} has been approved and assigned to you.",
            reference_type='transfer',
            reference_id=transfer_id
        )
        
        updated = db.execute(
            "SELECT * FROM transfer_requests WHERE id = ?", (transfer_id,)
        ).fetchone()
        return dict(updated)

def reject_transfer(transfer_id, decided_by, comments=None):
    """
    Reject an asset transfer request.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM transfer_requests WHERE id = ?", (transfer_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Transfer request {transfer_id} not found.")
        req = dict(row)
        
        if req['status'] != 'Pending':
            raise ValueError(f"Transfer request is already resolved.")
            
        now_str = datetime.utcnow().isoformat()
        db.execute(
            """UPDATE transfer_requests
               SET status = 'Rejected', decided_at = ?, decided_by = ?, comments = ?
               WHERE id = ?""",
            (now_str, decided_by, comments, transfer_id)
        )
        
        # Notify the requester
        notification.create_notification(
            recipient_id=req['to_employee_id'],
            type='maintenance_update',
            title='Asset Transfer Rejected',
            message=f"Your request to transfer asset ID {req['asset_id']} has been rejected.",
            reference_type='transfer',
            reference_id=transfer_id
        )
        
        updated = db.execute(
            "SELECT * FROM transfer_requests WHERE id = ?", (transfer_id,)
        ).fetchone()
        return dict(updated)
