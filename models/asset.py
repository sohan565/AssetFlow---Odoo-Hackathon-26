"""
CRUD operations for the assets and asset_state_log tables.

Provides functions to create, read, update, and search assets, as well as
manage asset lifecycle state transitions with full audit logging.
"""

from datetime import datetime

from database.connection import get_db


VALID_TRANSITIONS = {
    'Available': ['Allocated', 'Reserved', 'Under Maintenance', 'Retired', 'Disposed'],
    'Allocated': ['Available', 'Under Maintenance', 'Lost'],
    'Reserved': ['Available', 'Allocated'],
    'Under Maintenance': ['Available', 'Retired', 'Disposed'],
    'Lost': ['Available', 'Disposed'],
    'Retired': ['Disposed'],
    'Disposed': [],
}


def create_asset(asset_tag, name, category_id, department_id=None, **kwargs):
    """
    Create a new asset record.

    Args:
        asset_tag: Unique asset tag identifier.
        name: Human-readable asset name.
        category_id: ID of the asset category.
        department_id: Optional owning department ID.
        **kwargs: Additional columns — serial_number, model, manufacturer,
                  purchase_date, purchase_cost, warranty_expiry, location, notes.

    Returns:
        dict: The newly created asset record.
    """
    allowed_kwargs = {
        "serial_number", "model", "manufacturer", "purchase_date",
        "purchase_cost", "warranty_expiry", "location", "notes",
    }
    invalid = set(kwargs.keys()) - allowed_kwargs
    if invalid:
        raise ValueError(f"Invalid fields: {invalid}")

    columns = ["asset_tag", "name", "category_id", "department_id"]
    values = [asset_tag, name, category_id, department_id]

    for col in allowed_kwargs:
        if col in kwargs:
            columns.append(col)
            values.append(kwargs[col])

    placeholders = ", ".join("?" for _ in columns)
    col_names = ", ".join(columns)

    with get_db() as db:
        cursor = db.execute(
            f"INSERT INTO assets ({col_names}) VALUES ({placeholders})",
            values,
        )
        row = db.execute(
            "SELECT * FROM assets WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return dict(row)


def get_asset(asset_id):
    """
    Retrieve a single asset by ID.

    Args:
        asset_id: The asset ID.

    Returns:
        dict or None: The asset record, or None if not found.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM assets WHERE id = ?", (asset_id,)
        ).fetchone()
        return dict(row) if row else None


def get_all_assets():
    """
    Retrieve all assets.

    Returns:
        list[dict]: A list of all asset records.
    """
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM assets ORDER BY name"
        ).fetchall()
        return [dict(row) for row in rows]


def get_assets_by_state(state):
    """
    Retrieve all assets in a specific state.

    Args:
        state: The asset state to filter by.

    Returns:
        list[dict]: Assets in the given state.
    """
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM assets WHERE current_state = ? ORDER BY name",
            (state,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_assets_by_department(dept_id):
    """
    Retrieve all assets belonging to a specific department.

    Args:
        dept_id: The department ID.

    Returns:
        list[dict]: Assets in the given department.
    """
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM assets WHERE department_id = ? ORDER BY name",
            (dept_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_assets_by_category(cat_id):
    """
    Retrieve all assets in a specific category.

    Args:
        cat_id: The category ID.

    Returns:
        list[dict]: Assets in the given category.
    """
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM assets WHERE category_id = ? ORDER BY name",
            (cat_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def update_asset(asset_id, **kwargs):
    """
    Update asset fields. Automatically sets updated_at to current timestamp.

    Args:
        asset_id: The asset ID to update.
        **kwargs: Column-value pairs to update.

    Returns:
        dict: The updated asset record.

    Raises:
        ValueError: If no fields provided or asset not found.
    """
    if not kwargs:
        raise ValueError("No fields provided for update.")

    allowed = {
        "asset_tag", "name", "category_id", "department_id", "serial_number",
        "model", "manufacturer", "purchase_date", "purchase_cost",
        "warranty_expiry", "current_state", "location", "notes",
    }
    invalid = set(kwargs.keys()) - allowed
    if invalid:
        raise ValueError(f"Invalid fields: {invalid}")

    kwargs["updated_at"] = datetime.utcnow().isoformat()

    set_clause = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [asset_id]

    with get_db() as db:
        db.execute(
            f"UPDATE assets SET {set_clause} WHERE id = ?", values
        )
        row = db.execute(
            "SELECT * FROM assets WHERE id = ?", (asset_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Asset with id {asset_id} not found.")
        return dict(row)


def transition_state(asset_id, new_state, changed_by, reason=None):
    """
    Transition an asset to a new state with validation and audit logging.

    Validates the transition against VALID_TRANSITIONS, updates the asset's
    current_state and updated_at, and inserts a record into asset_state_log.

    Args:
        asset_id: The asset ID.
        new_state: The target state.
        changed_by: Employee ID performing the transition.
        reason: Optional reason for the transition.

    Returns:
        dict: The updated asset record.

    Raises:
        ValueError: If the asset is not found or the transition is invalid.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM assets WHERE id = ?", (asset_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Asset with id {asset_id} not found.")

        current_state = row["current_state"]

        if current_state not in VALID_TRANSITIONS:
            raise ValueError(
                f"Unknown current state '{current_state}' for asset {asset_id}."
            )

        if new_state not in VALID_TRANSITIONS[current_state]:
            raise ValueError(
                f"Invalid transition from '{current_state}' to '{new_state}'. "
                f"Allowed: {VALID_TRANSITIONS[current_state]}"
            )

        now = datetime.utcnow().isoformat()

        db.execute(
            "UPDATE assets SET current_state = ?, updated_at = ? WHERE id = ?",
            (new_state, now, asset_id),
        )

        db.execute(
            """INSERT INTO asset_state_log
               (asset_id, from_state, to_state, changed_by, reason)
               VALUES (?, ?, ?, ?, ?)""",
            (asset_id, current_state, new_state, changed_by, reason),
        )

        updated = db.execute(
            "SELECT * FROM assets WHERE id = ?", (asset_id,)
        ).fetchone()
        return dict(updated)


def get_state_history(asset_id):
    """
    Retrieve the full state transition history for an asset.

    Args:
        asset_id: The asset ID.

    Returns:
        list[dict]: State log entries ordered by most recent first.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM asset_state_log
               WHERE asset_id = ?
               ORDER BY changed_at DESC""",
            (asset_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_assets_count_by_state():
    """
    Get a count of assets grouped by their current state.

    Returns:
        list[dict]: Each dict has 'current_state' and 'count' keys.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT current_state, COUNT(*) as count
               FROM assets
               GROUP BY current_state"""
        ).fetchall()
        return [dict(row) for row in rows]


def search_assets(query):
    """
    Search assets by name, asset_tag, or serial_number.

    Args:
        query: The search string (uses SQL LIKE with wildcards).

    Returns:
        list[dict]: Matching asset records.
    """
    like_query = f"%{query}%"
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM assets
               WHERE name LIKE ?
                  OR asset_tag LIKE ?
                  OR serial_number LIKE ?
               ORDER BY name""",
            (like_query, like_query, like_query),
        ).fetchall()
        return [dict(row) for row in rows]
