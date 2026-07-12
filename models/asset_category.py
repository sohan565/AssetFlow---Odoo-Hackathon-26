"""
CRUD operations for the asset_categories table.

Provides functions to create, read, and update asset categories
in the Enterprise Asset & Resource Management System.
"""

from database.connection import get_db


def create_category(name, parent_id=None, description=None,
                    depreciation_rate=0.0):
    """
    Create a new asset category.

    Args:
        name: Category name (must be unique).
        parent_id: Optional parent category ID for hierarchy.
        description: Optional category description.
        depreciation_rate: Annual depreciation rate. Defaults to 0.0.

    Returns:
        dict: The newly created category record.
    """
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO asset_categories
               (name, parent_id, description, depreciation_rate)
               VALUES (?, ?, ?, ?)""",
            (name, parent_id, description, depreciation_rate),
        )
        row = db.execute(
            "SELECT * FROM asset_categories WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return dict(row)


def get_category(cat_id):
    """
    Retrieve a single asset category by ID.

    Args:
        cat_id: The category ID.

    Returns:
        dict or None: The category record, or None if not found.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM asset_categories WHERE id = ?", (cat_id,)
        ).fetchone()
        return dict(row) if row else None


def get_all_categories():
    """
    Retrieve all asset categories.

    Returns:
        list[dict]: A list of all category records.
    """
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM asset_categories ORDER BY name"
        ).fetchall()
        return [dict(row) for row in rows]


def update_category(cat_id, **kwargs):
    """
    Update asset category fields.

    Args:
        cat_id: The category ID to update.
        **kwargs: Column-value pairs to update.

    Returns:
        dict: The updated category record.

    Raises:
        ValueError: If no fields provided or category not found.
    """
    if not kwargs:
        raise ValueError("No fields provided for update.")

    allowed = {"name", "parent_id", "description", "depreciation_rate"}
    invalid = set(kwargs.keys()) - allowed
    if invalid:
        raise ValueError(f"Invalid fields: {invalid}")

    set_clause = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [cat_id]

    with get_db() as db:
        db.execute(
            f"UPDATE asset_categories SET {set_clause} WHERE id = ?", values
        )
        row = db.execute(
            "SELECT * FROM asset_categories WHERE id = ?", (cat_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Category with id {cat_id} not found.")
        return dict(row)
