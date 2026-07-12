import sqlite3
from datetime import datetime
from utils.code_generator import generate_asset_tag

class AssetModel:
    @staticmethod
    def create_asset(conn, name: str, category_id: int, department_id: int, serial_number: str, 
                     model: str, manufacturer: str, purchase_date: str, purchase_cost: float, 
                     warranty_expiry: str, location: str, notes: str) -> int:
        """Registers a new asset in the system with an auto-generated asset tag."""
        cursor = conn.cursor()
        asset_tag = generate_asset_tag(conn)
        try:
            cursor.execute(
                """INSERT INTO assets (asset_tag, name, category_id, department_id, serial_number, 
                   model, manufacturer, purchase_date, purchase_cost, warranty_expiry, 
                   current_state, location, notes) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available', ?, ?)""",
                (asset_tag, name, category_id, department_id, serial_number, 
                 model, manufacturer, purchase_date, purchase_cost, warranty_expiry, 
                 location, notes)
            )
            asset_id = cursor.lastrowid
            
            # Log initial state
            cursor.execute(
                "INSERT INTO asset_state_log (asset_id, to_state, reason) VALUES (?, 'Available', 'Asset Registered')",
                (asset_id,)
            )
            conn.commit()
            return asset_id
        except sqlite3.Error as e:
            print(f"Error creating asset: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def get_asset(conn, asset_id: int):
        """Retrieves an asset by database ID."""
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM assets WHERE id = ?", (asset_id,))
        return cursor.fetchone()

    @staticmethod
    def get_asset_by_tag(conn, tag: str):
        """Retrieves an asset by its tag (e.g. AST-2026-00001)."""
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM assets WHERE asset_tag = ?", (tag,))
        return cursor.fetchone()

    @staticmethod
    def list_assets(conn, category_id: int = None, status: str = None, search_query: str = None):
        """Lists assets with optional filters for category, status, and tag/name search."""
        cursor = conn.cursor()
        query = "SELECT * FROM assets WHERE 1=1"
        params = []
        
        if category_id:
            query += " AND category_id = ?"
            params.append(category_id)
        if status:
            query += " AND current_state = ?"
            params.append(status)
        if search_query:
            query += " AND (name LIKE ? OR asset_tag LIKE ? OR serial_number LIKE ?)"
            like_param = f"%{search_query}%"
            params.extend([like_param, like_param, like_param])
            
        cursor.execute(query, params)
        return cursor.fetchall()

    @staticmethod
    def update_asset_state(conn, asset_id: int, new_state: str, changed_by: int = None, reason: str = ""):
        """Updates the state of an asset and logs the transition in asset_state_log."""
        cursor = conn.cursor()
        try:
            # Get original state
            cursor.execute("SELECT current_state FROM assets WHERE id = ?", (asset_id,))
            row = cursor.fetchone()
            from_state = row["current_state"] if row else None
            
            # Update state in assets table
            cursor.execute(
                "UPDATE assets SET current_state = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (new_state, asset_id)
            )
            
            # Log transition
            cursor.execute(
                """INSERT INTO asset_state_log (asset_id, from_state, to_state, changed_by, reason) 
                   VALUES (?, ?, ?, ?, ?)""",
                (asset_id, from_state, new_state, changed_by, reason)
            )
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error updating asset state: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def get_asset_history(conn, asset_id: int):
        """Retrieves transition and allocation history logs for a specific asset."""
        cursor = conn.cursor()
        # Fetch transition logs
        cursor.execute(
            """SELECT l.*, e.first_name || ' ' || e.last_name as actor_name 
               FROM asset_state_log l
               LEFT JOIN employees e ON l.changed_by = e.id
               WHERE l.asset_id = ?
               ORDER BY l.changed_at DESC""",
            (asset_id,)
        )
        transitions = cursor.fetchall()
        
        # Fetch allocation history
        cursor.execute(
            """SELECT a.*, e.first_name || ' ' || e.last_name as employee_name, d.name as department_name
               FROM asset_allocations a
               LEFT JOIN employees e ON a.employee_id = e.id
               LEFT JOIN departments d ON a.department_id = d.id
               WHERE a.asset_id = ?
               ORDER BY a.allocated_at DESC""",
            (asset_id,)
        )
        allocations = cursor.fetchall()
        
        return {"transitions": transitions, "allocations": allocations}
