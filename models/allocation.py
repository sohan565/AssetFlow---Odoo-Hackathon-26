import sqlite3
from models.asset import AssetModel

class AllocationModel:
    @staticmethod
    def get_active_allocation(conn, asset_id: int):
        """Retrieves the active allocation details of an asset if it is currently checked out."""
        cursor = conn.cursor()
        cursor.execute(
            """SELECT a.*, e.first_name || ' ' || e.last_name as employee_name, d.name as department_name
               FROM asset_allocations a
               LEFT JOIN employees e ON a.employee_id = e.id
               LEFT JOIN departments d ON a.department_id = d.id
               WHERE a.asset_id = ? AND a.returned_at IS NULL""",
            (asset_id,)
        )
        return cursor.fetchone()

    @staticmethod
    def allocate_asset(conn, asset_id: int, employee_id: int, department_id: int, 
                       allocated_by: int, expected_return: str = None, notes: str = "") -> int:
        """
        Allocates an asset to an employee or department.
        Validates availability first. Updates asset status to 'Allocated'.
        """
        cursor = conn.cursor()
        
        # Check if asset exists and is Available
        asset = AssetModel.get_asset(conn, asset_id)
        if not asset:
            raise ValueError("Asset does not exist.")
        if asset["current_state"] != "Available":
            # Find who currently holds it
            active_alloc = AllocationModel.get_active_allocation(conn, asset_id)
            holder = active_alloc["employee_name"] if active_alloc else "another entity"
            raise ValueError(f"Asset is not available. Currently held by {holder}.")

        try:
            # Insert allocation
            cursor.execute(
                """INSERT INTO asset_allocations (asset_id, employee_id, department_id, allocated_by, expected_return, notes) 
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (asset_id, employee_id, department_id, allocated_by, expected_return, notes)
            )
            alloc_id = cursor.lastrowid
            
            # Update asset state to Allocated
            AssetModel.update_asset_state(conn, asset_id, "Allocated", allocated_by, f"Allocated. Due date: {expected_return}")
            conn.commit()
            return alloc_id
        except sqlite3.IntegrityError as e:
            # Handles double-allocation index collision as a secondary safety guard
            print(f"Database constraint blocked allocation: {e}")
            conn.rollback()
            raise ValueError("Database blocked allocation: This asset is already allocated.")
        except sqlite3.Error as e:
            print(f"Error allocating asset: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def return_asset(conn, asset_id: int, return_notes: str = ""):
        """
        Marks an asset as returned, sets returned_at timestamp, 
        and updates the asset status back to 'Available'.
        """
        cursor = conn.cursor()
        active_alloc = AllocationModel.get_active_allocation(conn, asset_id)
        if not active_alloc:
            raise ValueError("No active allocation found for this asset.")

        try:
            # Update allocation record
            cursor.execute(
                """UPDATE asset_allocations 
                   SET returned_at = CURRENT_TIMESTAMP, notes = notes || '\nReturn notes: ' || ?
                   WHERE id = ?""",
                (return_notes, active_alloc["id"])
            )
            
            # Revert asset state to Available
            AssetModel.update_asset_state(conn, asset_id, "Available", None, "Asset returned. State reverted to Available.")
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error returning asset: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def list_active_allocations(conn):
        """Lists all currently active allocations."""
        cursor = conn.cursor()
        cursor.execute(
            """SELECT a.*, ast.name as asset_name, ast.asset_tag, e.first_name || ' ' || e.last_name as employee_name
               FROM asset_allocations a
               JOIN assets ast ON a.asset_id = ast.id
               LEFT JOIN employees e ON a.employee_id = e.id
               WHERE a.returned_at IS NULL"""
        )
        return cursor.fetchall()
