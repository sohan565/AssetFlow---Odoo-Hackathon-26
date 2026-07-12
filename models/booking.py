import sqlite3

class BookingModel:
    @staticmethod
    def check_overlap(conn, resource_id: int, start_time: str, end_time: str) -> int:
        """
        Checks if a conflicting booking exists for a given resource and time frame.
        Returns the number of conflicting bookings found.
        """
        cursor = conn.cursor()
        cursor.execute(
            """SELECT COUNT(*) FROM resource_bookings
               WHERE resource_id = ?
                 AND status = 'Confirmed'
                 AND start_time < ?
                 AND end_time > ?""",
            (resource_id, end_time, start_time)
        )
        return cursor.fetchone()[0]

    @staticmethod
    def create_booking(conn, resource_id: int, booked_by: int, start_time: str, 
                       end_time: str, purpose: str = "") -> int:
        """
        Creates a booking for a shared resource.
        Validates that there are no overlapping confirmed bookings first.
        """
        cursor = conn.cursor()
        
        # Check if resource is active
        cursor.execute("SELECT is_active, name FROM shared_resources WHERE id = ?", (resource_id,))
        resource = cursor.fetchone()
        if not resource or not resource["is_active"]:
            raise ValueError("Resource is inactive or does not exist.")

        # Check for overlapping bookings
        overlaps = BookingModel.check_overlap(conn, resource_id, start_time, end_time)
        if overlaps > 0:
            raise ValueError(f"Conflicting booking exists. Time slot is already booked for {resource['name']}.")

        try:
            cursor.execute(
                """INSERT INTO resource_bookings (resource_id, booked_by, start_time, end_time, purpose, status) 
                   VALUES (?, ?, ?, ?, ?, 'Confirmed')""",
                (resource_id, booked_by, start_time, end_time, purpose)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error creating booking: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def cancel_booking(conn, booking_id: int):
        """Cancels a booking by changing its status to 'Cancelled'."""
        cursor = conn.cursor()
        try:
            cursor.execute("UPDATE resource_bookings SET status = 'Cancelled' WHERE id = ?", (booking_id,))
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error cancelling booking: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def list_resource_bookings(conn, resource_id: int):
        """Lists all bookings associated with a specific resource."""
        cursor = conn.cursor()
        cursor.execute(
            """SELECT b.*, e.first_name || ' ' || e.last_name as employee_name
               FROM resource_bookings b
               JOIN employees e ON b.booked_by = e.id
               WHERE b.resource_id = ?
               ORDER BY b.start_time ASC""",
            (resource_id,)
        )
        return cursor.fetchall()

    @staticmethod
    def list_active_bookings(conn):
        """Lists all upcoming confirmed bookings."""
        cursor = conn.cursor()
        cursor.execute(
            """SELECT b.*, r.name as resource_name, r.resource_type, e.first_name || ' ' || e.last_name as employee_name
               FROM resource_bookings b
               JOIN shared_resources r ON b.resource_id = r.id
               JOIN employees e ON b.booked_by = e.id
               WHERE b.status = 'Confirmed'
               ORDER BY b.start_time ASC"""
        )
        return cursor.fetchall()
