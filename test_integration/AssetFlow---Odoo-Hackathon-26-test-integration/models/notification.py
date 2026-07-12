import sqlite3

class NotificationModel:
    @staticmethod
    def create_notification(conn, recipient_id: int, type: str, title: str, message: str, 
                            reference_type: str = None, reference_id: int = None) -> int:
        """Logs a new notification alert in the database."""
        cursor = conn.cursor()
        try:
            cursor.execute(
                """INSERT INTO notifications (recipient_id, type, title, message, reference_type, reference_id) 
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (recipient_id, type, title, message, reference_type, reference_id)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error creating notification: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def get_unread_notifications(conn, recipient_id: int):
        """Fetches all unread notifications for a specific employee."""
        cursor = conn.cursor()
        cursor.execute(
            """SELECT * FROM notifications 
               WHERE recipient_id = ? AND is_read = 0 
               ORDER BY created_at DESC""",
            (recipient_id,)
        )
        return cursor.fetchall()

    @staticmethod
    def mark_as_read(conn, notification_id: int):
        """Marks a specific notification as read."""
        cursor = conn.cursor()
        try:
            cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error marking notification as read: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def mark_all_as_read(conn, recipient_id: int):
        """Marks all unread notifications for a recipient as read."""
        cursor = conn.cursor()
        try:
            cursor.execute("UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0", (recipient_id,))
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error marking all notifications as read: {e}")
            conn.rollback()
            raise e
