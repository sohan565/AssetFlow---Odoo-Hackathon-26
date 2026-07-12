"""
CRUD operations for the shared_resources and resource_bookings tables.

Provides functions to manage shared resources and their time-slot bookings
with overlap prevention in the Enterprise Asset & Resource Management System.
"""

from datetime import datetime, timedelta

from database.connection import get_db


def create_resource(name, resource_type, capacity=1, location=None):
    """
    Create a new shared resource.

    Args:
        name: Resource name.
        resource_type: Type of resource ('room', 'equipment', 'vehicle').
        capacity: Resource capacity. Defaults to 1.
        location: Optional location description.

    Returns:
        dict: The newly created resource record.
    """
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO shared_resources
               (name, resource_type, capacity, location)
               VALUES (?, ?, ?, ?)""",
            (name, resource_type, capacity, location),
        )
        row = db.execute(
            "SELECT * FROM shared_resources WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return dict(row)


def get_resource(resource_id):
    """
    Retrieve a single shared resource by ID.

    Args:
        resource_id: The resource ID.

    Returns:
        dict or None: The resource record, or None if not found.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM shared_resources WHERE id = ?", (resource_id,)
        ).fetchone()
        return dict(row) if row else None


def get_all_resources():
    """
    Retrieve all shared resources.

    Returns:
        list[dict]: A list of all resource records.
    """
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM shared_resources ORDER BY name"
        ).fetchall()
        return [dict(row) for row in rows]


def create_booking(resource_id, booked_by, start_time, end_time,
                   purpose=None):
    """
    Create a new resource booking after checking for time-slot overlaps.

    Args:
        resource_id: The resource to book.
        booked_by: Employee ID making the booking.
        start_time: Booking start time (ISO format string).
        end_time: Booking end time (ISO format string).
        purpose: Optional booking purpose.

    Returns:
        dict: The newly created booking record.

    Raises:
        ValueError: If the booking overlaps with an existing confirmed booking.
    """
    with get_db() as db:
        # Check for overlapping confirmed bookings
        overlap = db.execute(
            """SELECT id FROM resource_bookings
               WHERE resource_id = ?
                 AND status = 'Confirmed'
                 AND start_time < ?
                 AND end_time > ?""",
            (resource_id, end_time, start_time),
        ).fetchone()

        if overlap:
            raise ValueError(
                f"Booking overlaps with existing booking (id={overlap['id']})."
            )

        cursor = db.execute(
            """INSERT INTO resource_bookings
               (resource_id, booked_by, start_time, end_time, purpose)
               VALUES (?, ?, ?, ?, ?)""",
            (resource_id, booked_by, start_time, end_time, purpose),
        )
        row = db.execute(
            "SELECT * FROM resource_bookings WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        return dict(row)


def cancel_booking(booking_id):
    """
    Cancel a booking by setting its status to 'Cancelled'.

    Args:
        booking_id: The booking ID to cancel.

    Returns:
        dict: The updated booking record.

    Raises:
        ValueError: If the booking is not found.
    """
    with get_db() as db:
        db.execute(
            "UPDATE resource_bookings SET status = 'Cancelled' WHERE id = ?",
            (booking_id,),
        )
        row = db.execute(
            "SELECT * FROM resource_bookings WHERE id = ?", (booking_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Booking with id {booking_id} not found.")
        return dict(row)


def get_bookings_for_resource(resource_id, date=None):
    """
    Retrieve bookings for a specific resource, optionally filtered by date.

    Args:
        resource_id: The resource ID.
        date: Optional date string (YYYY-MM-DD) to filter bookings.

    Returns:
        list[dict]: Booking records for the resource.
    """
    with get_db() as db:
        if date:
            rows = db.execute(
                """SELECT * FROM resource_bookings
                   WHERE resource_id = ?
                     AND start_time LIKE ?
                   ORDER BY start_time""",
                (resource_id, f"{date}%"),
            ).fetchall()
        else:
            rows = db.execute(
                """SELECT * FROM resource_bookings
                   WHERE resource_id = ?
                   ORDER BY start_time""",
                (resource_id,),
            ).fetchall()
        return [dict(row) for row in rows]


def get_bookings_for_employee(emp_id):
    """
    Retrieve all bookings made by a specific employee.

    Args:
        emp_id: The employee ID.

    Returns:
        list[dict]: Booking records for the employee.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM resource_bookings
               WHERE booked_by = ?
               ORDER BY start_time DESC""",
            (emp_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_upcoming_bookings(hours=24):
    """
    Retrieve confirmed bookings starting within the next N hours.

    Args:
        hours: Number of hours ahead to look. Defaults to 24.

    Returns:
        list[dict]: Upcoming confirmed booking records.
    """
    now = datetime.utcnow().isoformat()
    end = (datetime.utcnow() + timedelta(hours=hours)).isoformat()

    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM resource_bookings
               WHERE status = 'Confirmed'
                 AND start_time >= ?
                 AND start_time <= ?
               ORDER BY start_time""",
            (now, end),
        ).fetchall()
        return [dict(row) for row in rows]
