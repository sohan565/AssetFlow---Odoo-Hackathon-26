"""
CRUD operations for the notifications table.

Provides functions to create, read, and manage in-app notifications
for employees in the Enterprise Asset & Resource Management System.
"""

from database.connection import get_db


def create_notification(recipient_id, type, title, message,
                        reference_type=None, reference_id=None):
    """
    Create a new notification.

    Args:
        recipient_id: The employee ID to notify.
        type: Notification type ('overdue_return', 'booking_reminder',
              'maintenance_update', 'audit_assigned', 'approval_needed').
        title: Notification title.
        message: Notification message body.
        reference_type: Optional reference entity type (e.g., 'asset', 'booking').
        reference_id: Optional reference entity ID.

    Returns:
        dict: The newly created notification record.
    """
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO notifications
               (recipient_id, type, title, message, reference_type, reference_id)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (recipient_id, type, title, message, reference_type, reference_id),
        )
        row = db.execute(
            "SELECT * FROM notifications WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return dict(row)


def get_notifications(recipient_id, unread_only=False):
    """
    Retrieve notifications for a specific recipient.

    Args:
        recipient_id: The employee ID.
        unread_only: If True, return only unread notifications.

    Returns:
        list[dict]: Notification records ordered by most recent first.
    """
    with get_db() as db:
        if unread_only:
            rows = db.execute(
                """SELECT * FROM notifications
                   WHERE recipient_id = ? AND is_read = 0
                   ORDER BY created_at DESC""",
                (recipient_id,),
            ).fetchall()
        else:
            rows = db.execute(
                """SELECT * FROM notifications
                   WHERE recipient_id = ?
                   ORDER BY created_at DESC""",
                (recipient_id,),
            ).fetchall()
        return [dict(row) for row in rows]


def mark_as_read(notification_id):
    """
    Mark a single notification as read.

    Args:
        notification_id: The notification ID.

    Returns:
        dict: The updated notification record.

    Raises:
        ValueError: If the notification is not found.
    """
    with get_db() as db:
        db.execute(
            "UPDATE notifications SET is_read = 1 WHERE id = ?",
            (notification_id,),
        )
        row = db.execute(
            "SELECT * FROM notifications WHERE id = ?", (notification_id,)
        ).fetchone()
        if not row:
            raise ValueError(
                f"Notification with id {notification_id} not found."
            )
        return dict(row)


def mark_all_read(recipient_id):
    """
    Mark all unread notifications as read for a specific recipient.

    Args:
        recipient_id: The employee ID.

    Returns:
        dict: A dict with 'updated' key indicating number of rows affected.
    """
    with get_db() as db:
        cursor = db.execute(
            """UPDATE notifications
               SET is_read = 1
               WHERE recipient_id = ? AND is_read = 0""",
            (recipient_id,),
        )
        return {"updated": cursor.rowcount}


def get_unread_count(recipient_id):
    """
    Get the count of unread notifications for a recipient.

    Args:
        recipient_id: The employee ID.

    Returns:
        int: Number of unread notifications.
    """
    with get_db() as db:
        row = db.execute(
            """SELECT COUNT(*) as count FROM notifications
               WHERE recipient_id = ? AND is_read = 0""",
            (recipient_id,),
        ).fetchone()
        return row["count"]


def get_recent_notifications(limit=10):
    """
    Retrieve the most recent notifications across all recipients.

    Args:
        limit: Maximum number of notifications to return. Defaults to 10.

    Returns:
        list[dict]: Recent notification records.
    """
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]


def notification_exists_today(recipient_id, type, reference_type=None,
                              reference_id=None):
    """
    Check if a notification of a given type was already created today
    for a specific recipient and optional reference.

    Useful for preventing duplicate daily notifications.

    Args:
        recipient_id: The employee ID.
        type: The notification type.
        reference_type: Optional reference entity type.
        reference_id: Optional reference entity ID.

    Returns:
        bool: True if such a notification exists today, False otherwise.
    """
    with get_db() as db:
        query = """SELECT id FROM notifications
                   WHERE recipient_id = ?
                     AND type = ?
                     AND date(created_at) = date('now')"""
        params = [recipient_id, type]

        if reference_type is not None and reference_id is not None:
            query += " AND reference_type = ? AND reference_id = ?"
            params.extend([reference_type, reference_id])

        row = db.execute(query, params).fetchone()
        return row is not None
