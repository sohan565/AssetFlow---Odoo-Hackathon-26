import sqlite3
from datetime import datetime

class TransferModel:
    @staticmethod
    def create_transfer_request(conn, asset_id: int, from_employee_id: int, 
                                to_employee_id: int, requested_by: int) -> int:
        """Create a new asset transfer request in the database."""
        cursor = conn.cursor()
        try:
            cursor.execute(
                """INSERT INTO transfer_requests 
                   (asset_id, from_employee_id, to_employee_id, requested_by)
                   VALUES (?, ?, ?, ?)""",
                (asset_id, from_employee_id, to_employee_id, requested_by)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error creating transfer request: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def get_transfer_request(conn, transfer_id: int):
        """Retrieve a transfer request by ID."""
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transfer_requests WHERE id = ?", (transfer_id,))
        return cursor.fetchone()

    @staticmethod
    def get_pending_transfers(conn):
        """Retrieve all pending transfer requests."""
        cursor = conn.cursor()
        cursor.execute(
            """SELECT t.*, a.name as asset_name, a.asset_tag,
                      e1.first_name || ' ' || e1.last_name as from_employee_name,
                      e2.first_name || ' ' || e2.last_name as to_employee_name
               FROM transfer_requests t
               JOIN assets a ON t.asset_id = a.id
               JOIN employees e1 ON t.from_employee_id = e1.id
               JOIN employees e2 ON t.to_employee_id = e2.id
               WHERE t.status = 'Pending'"""
        )
        return cursor.fetchall()

    @staticmethod
    def approve_transfer(conn, transfer_id: int, decided_by: int, comments: str = None):
        """
        Approve an asset transfer request.
        Closes current active allocation, opens new allocation, logs transition, and updates status.
        """
        cursor = conn.cursor()
        
        # Get transfer request
        cursor.execute("SELECT * FROM transfer_requests WHERE id = ?", (transfer_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"Transfer request {transfer_id} not found.")
        req = dict(row)
        
        if req['status'] != 'Pending':
            raise ValueError(f"Transfer request is already resolved (status: {req['status']}).")
            
        asset_id = req['asset_id']
        from_emp = req['from_employee_id']
        to_emp = req['to_employee_id']
        
        # Get recipient department ID
        cursor.execute("SELECT department_id FROM employees WHERE id = ?", (to_emp,))
        emp_row = cursor.fetchone()
        dept_id = emp_row["department_id"] if emp_row else None
        
        # Check active allocation for this asset
        cursor.execute(
            "SELECT * FROM asset_allocations WHERE asset_id = ? AND returned_at IS NULL",
            (asset_id,)
        )
        alloc_row = cursor.fetchone()
        
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        try:
            if alloc_row:
                alloc_rec = dict(alloc_row)
                # 1. Close current allocation
                cursor.execute(
                    "UPDATE asset_allocations SET returned_at = ? WHERE id = ?",
                    (now_str, alloc_rec['id'])
                )
            
            # 2. Create new active allocation
            cursor.execute(
                """INSERT INTO asset_allocations (asset_id, employee_id, department_id, allocated_by, allocated_at, notes)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (asset_id, to_emp, dept_id, decided_by, now_str, f"Transferred from Emp #{from_emp} via request #{transfer_id}")
            )
            
            # 3. Write asset state log update
            cursor.execute(
                """INSERT INTO asset_state_log (asset_id, from_state, to_state, changed_by, reason)
                   VALUES (?, ?, ?, ?, ?)""",
                (asset_id, 'Allocated', 'Allocated', decided_by, f"Transferred to Emp #{to_emp} via approved request #{transfer_id}")
            )
            
            # 4. Update request status
            cursor.execute(
                """UPDATE transfer_requests
                   SET status = 'Approved', decided_at = ?, decided_by = ?, comments = ?
                   WHERE id = ?""",
                (now_str, decided_by, comments, transfer_id)
            )
            
            # Notify the recipient
            from models.notification import NotificationModel
            NotificationModel.create_notification(
                conn,
                recipient_id=to_emp,
                type='maintenance_update', 
                title='Asset Transfer Approved',
                message=f"Your request to transfer asset ID {asset_id} has been approved and assigned to you.",
                reference_type='transfer',
                reference_id=transfer_id
            )
            
            conn.commit()
            cursor.execute("SELECT * FROM transfer_requests WHERE id = ?", (transfer_id,))
            return cursor.fetchone()
        except sqlite3.Error as e:
            print(f"Error approving transfer: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def reject_transfer(conn, transfer_id: int, decided_by: int, comments: str = None):
        """Reject an asset transfer request."""
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM transfer_requests WHERE id = ?", (transfer_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"Transfer request {transfer_id} not found.")
        req = dict(row)
        
        if req['status'] != 'Pending':
            raise ValueError("Transfer request is already resolved.")
            
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            cursor.execute(
                """UPDATE transfer_requests
                   SET status = 'Rejected', decided_at = ?, decided_by = ?, comments = ?
                   WHERE id = ?""",
                (now_str, decided_by, comments, transfer_id)
            )
            
            # Notify the requester
            from models.notification import NotificationModel
            NotificationModel.create_notification(
                conn,
                recipient_id=req['to_employee_id'],
                type='maintenance_update',
                title='Asset Transfer Rejected',
                message=f"Your request to transfer asset ID {req['asset_id']} has been rejected.",
                reference_type='transfer',
                reference_id=transfer_id
            )
            conn.commit()
            cursor.execute("SELECT * FROM transfer_requests WHERE id = ?", (transfer_id,))
            return cursor.fetchone()
        except sqlite3.Error as e:
            print(f"Error rejecting transfer: {e}")
            conn.rollback()
            raise e
