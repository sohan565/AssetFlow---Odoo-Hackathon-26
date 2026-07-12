import sqlite3
from models.asset import AssetModel

class AuditModel:
    @staticmethod
    def create_audit_cycle(conn, cycle_name: str, start_date: str, end_date: str, created_by: int) -> int:
        """Creates a new audit cycle. Default status is 'Planned'."""
        cursor = conn.cursor()
        try:
            cursor.execute(
                """INSERT INTO audit_cycles (cycle_name, start_date, end_date, created_by, status) 
                   VALUES (?, ?, ?, ?, 'Planned')""",
                (cycle_name, start_date, end_date, created_by)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error creating audit cycle: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def create_audit_assignment(conn, audit_cycle_id: int, auditor_id: int, 
                                department_id: int = None, category_id: int = None) -> int:
        """Assigns an auditor to a specific scope (department and/or category)."""
        cursor = conn.cursor()
        try:
            cursor.execute(
                """INSERT INTO audit_assignments (audit_cycle_id, auditor_id, department_id, category_id, status) 
                   VALUES (?, ?, ?, ?, 'Assigned')""",
                (audit_cycle_id, auditor_id, department_id, category_id)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error creating audit assignment: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def record_audit_finding(conn, audit_cycle_id: int, asset_id: int, auditor_id: int, 
                             actual_state: str, actual_location: str, notes: str = "") -> int:
        """
        Records an audit finding.
        Auto-generates discrepancy types if the state or location doesn't match database records.
        """
        cursor = conn.cursor()
        
        # Get expected data from asset record
        asset = AssetModel.get_asset(conn, asset_id)
        if not asset:
            raise ValueError("Asset does not exist.")
            
        expected_state = asset["current_state"]
        expected_location = asset["location"]
        
        # Determine discrepancy
        discrepancy_type = None
        if actual_state == "Missing":
            discrepancy_type = "Missing"
        elif expected_state != actual_state and expected_location != actual_location:
            discrepancy_type = "State & Location Mismatch"
        elif expected_state != actual_state:
            discrepancy_type = "State Mismatch"
        elif expected_location != actual_location:
            discrepancy_type = "Location Mismatch"

        try:
            cursor.execute(
                """INSERT INTO audit_findings (audit_cycle_id, asset_id, auditor_id, expected_state, 
                   actual_state, expected_location, actual_location, discrepancy_type, notes) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (audit_cycle_id, asset_id, auditor_id, expected_state, 
                 actual_state, expected_location, actual_location, discrepancy_type, notes)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error recording audit finding: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def close_audit_cycle(conn, audit_cycle_id: int):
        """
        Locks the audit cycle (changes status to Completed).
        Updates all assets flagged as 'Missing' in the findings to 'Lost' status.
        """
        cursor = conn.cursor()
        
        # Verify cycle exists and is active
        cursor.execute("SELECT status FROM audit_cycles WHERE id = ?", (audit_cycle_id,))
        cycle = cursor.fetchone()
        if not cycle:
            raise ValueError("Audit cycle does not exist.")
        if cycle["status"] == "Completed":
            raise ValueError("Audit cycle is already closed.")

        try:
            # 1. Update cycle status
            cursor.execute("UPDATE audit_cycles SET status = 'Completed' WHERE id = ?", (audit_cycle_id,))
            
            # 2. Find all findings with 'Missing' state
            cursor.execute(
                "SELECT asset_id FROM audit_findings WHERE audit_cycle_id = ? AND actual_state = 'Missing'",
                (audit_cycle_id,)
            )
            missing_assets = cursor.fetchall()
            
            # 3. Update those assets' current status to 'Lost'
            for row in missing_assets:
                AssetModel.update_asset_state(
                    conn, row["asset_id"], "Lost", None, 
                    f"Confirmed missing and marked Lost during Audit Cycle ID {audit_cycle_id}."
                )
                
            conn.commit()
            print(f"Audit cycle {audit_cycle_id} closed. Updated {len(missing_assets)} assets to 'Lost'.")
        except sqlite3.Error as e:
            print(f"Error closing audit cycle: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def list_audit_cycles(conn):
        """Lists all audit cycles."""
        cursor = conn.cursor()
        cursor.execute(
            """SELECT c.*, e.first_name || ' ' || e.last_name as creator_name
               FROM audit_cycles c
               JOIN employees e ON c.created_by = e.id
               ORDER BY c.created_at DESC"""
        )
        return cursor.fetchall()

    @staticmethod
    def get_audit_discrepancies(conn, audit_cycle_id: int):
        """Returns all findings with a discrepancy inside a specific cycle."""
        cursor = conn.cursor()
        cursor.execute(
            """SELECT f.*, ast.name as asset_name, ast.asset_tag, e.first_name || ' ' || e.last_name as auditor_name
               FROM audit_findings f
               JOIN assets ast ON f.asset_id = ast.id
               JOIN employees e ON f.auditor_id = e.id
               WHERE f.audit_cycle_id = ? AND f.discrepancy_type IS NOT NULL""",
            (audit_cycle_id,)
        )
        return cursor.fetchall()
