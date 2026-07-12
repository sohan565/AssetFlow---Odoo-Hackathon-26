import sqlite3

class AssetCategoryModel:
    @staticmethod
    def create_category(conn, name: str, parent_id: int = None, description: str = None,
                        depreciation_rate: float = 0.0) -> int:
        """Create a new asset category in the database."""
        cursor = conn.cursor()
        try:
            cursor.execute(
                """INSERT INTO asset_categories
                   (name, parent_id, description, depreciation_rate)
                   VALUES (?, ?, ?, ?)""",
                (name, parent_id, description, depreciation_rate)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error creating category: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def get_category(conn, cat_id: int):
        """Retrieve a single asset category by ID."""
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM asset_categories WHERE id = ?", (cat_id,))
        return cursor.fetchone()

    @staticmethod
    def get_all_categories(conn):
        """Retrieve all asset categories."""
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM asset_categories ORDER BY name")
        return cursor.fetchall()

    @staticmethod
    def update_category(conn, cat_id: int, **kwargs):
        """Update asset category fields."""
        if not kwargs:
            raise ValueError("No fields provided for update.")

        allowed = {"name", "parent_id", "description", "depreciation_rate"}
        invalid = set(kwargs.keys()) - allowed
        if invalid:
            raise ValueError(f"Invalid fields: {invalid}")

        set_clause = ", ".join(f"{k} = ?" for k in kwargs)
        values = list(kwargs.values()) + [cat_id]

        cursor = conn.cursor()
        try:
            cursor.execute(
                f"UPDATE asset_categories SET {set_clause} WHERE id = ?", values
            )
            conn.commit()
            cursor.execute("SELECT * FROM asset_categories WHERE id = ?", (cat_id,))
            row = cursor.fetchone()
            if not row:
                raise ValueError(f"Category with id {cat_id} not found.")
            return row
        except sqlite3.Error as e:
            print(f"Error updating category: {e}")
            conn.rollback()
            raise e
