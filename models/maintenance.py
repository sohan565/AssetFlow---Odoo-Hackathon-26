import sqlite3
from models.asset import AssetModel
from utils.code_generator import generate_maintenance_code

class MaintenanceModel:
    @staticmethod
    def create_maintenance_request(conn, asset_id: int, requested_by: int, 
                                   issue_description: str, priority: str = "Medium", 
                                   estimated_cost: float = 0.0) -> int:
        """Submits a new maintenance request. Code auto-generated."""
        cursor = conn.cursor()
        request_code = generate_maintenance_code(conn)
        
        # Verify asset exists
        asset = AssetModel.get_asset(conn, asset_id)
        if not asset:
            raise ValueError("Asset does not exist.")

        try:
            cursor.execute(
                """INSERT INTO maintenance_requests (request_code, asset_id, requested_by, 
                   issue_description, priority, estimated_cost, status) 
                   VALUES (?, ?, ?, ?, ?, ?, 'Pending Approval')""",
                (request_code, asset_id, requested_by, issue_description, priority, estimated_cost)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error creating maintenance request: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def approve_maintenance_request(conn, request_id: int, approver_id: int, 
                                    decision: str, comments: str = ""):
        """
        Approves or Rejects a maintenance request.
        If Approved: Updates request status to 'Approved' and sets asset state to 'Under Maintenance'.
        If Rejected: Updates request status to 'Rejected'.
        """
        cursor = conn.cursor()
        
        # Fetch request details
        cursor.execute("SELECT asset_id, status FROM maintenance_requests WHERE id = ?", (request_id,))
        req = cursor.fetchone()
        if not req:
            raise ValueError("Maintenance request does not exist.")
        if req["status"] != "Pending Approval":
            raise ValueError("Maintenance request has already been processed.")

        asset_id = req["asset_id"]
        new_status = "Approved" if decision == "Approved" else "Rejected"

        try:
            # Insert approval log
            cursor.execute(
                """INSERT INTO maintenance_approvals (request_id, approver_id, decision, comments) 
                   VALUES (?, ?, ?, ?)""",
                (request_id, approver_id, decision, comments)
            )
            
            # Update request status
            cursor.execute(
                "UPDATE maintenance_requests SET status = ? WHERE id = ?",
                (new_status, request_id)
            )
            
            # If approved, flip asset status to Under Maintenance
            if decision == "Approved":
                AssetModel.update_asset_state(
                    conn, asset_id, "Under Maintenance", approver_id, 
                    f"Maintenance Approved. Request Code: {request_id}"
                )
            
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error approving maintenance request: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def assign_technician_and_start(conn, request_id: int, technician: str):
        """Assigns a technician and shifts status to 'In Progress'."""
        cursor = conn.cursor()
        try:
            cursor.execute(
                "UPDATE maintenance_requests SET status = 'In Progress', technician = ? WHERE id = ?",
                (technician, request_id)
            )
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error starting maintenance work: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def resolve_maintenance_request(conn, request_id: int, actual_cost: float = 0.0):
        """
        Resolves the maintenance request. Sets resolved_at timestamp, 
        and reverts the asset status back to 'Available'.
        """
        cursor = conn.cursor()
        
        # Fetch request details
        cursor.execute("SELECT asset_id, status FROM maintenance_requests WHERE id = ?", (request_id,))
        req = cursor.fetchone()
        if not req:
            raise ValueError("Maintenance request does not exist.")

        asset_id = req["asset_id"]

        try:
            # Update request
            cursor.execute(
                """UPDATE maintenance_requests 
                   SET status = 'Completed', actual_cost = ?, resolved_at = CURRENT_TIMESTAMP 
                   WHERE id = ?""",
                (actual_cost, request_id)
            )
            
            # Return asset to Available state
            AssetModel.update_asset_state(
                conn, asset_id, "Available", None, "Maintenance completed. Reverted to Available."
            )
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error resolving maintenance request: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def list_maintenance_requests(conn):
        """Lists all maintenance requests."""
        cursor = conn.cursor()
        cursor.execute(
            """SELECT m.*, ast.name as asset_name, ast.asset_tag, e.first_name || ' ' || e.last_name as requester_name
               FROM maintenance_requests m
               JOIN assets ast ON m.asset_id = ast.id
               JOIN employees e ON m.requested_by = e.id
               ORDER BY m.submitted_at DESC"""
        )
        return cursor.fetchall()
