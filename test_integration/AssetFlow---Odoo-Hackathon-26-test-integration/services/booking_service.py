from datetime import datetime
from models.booking import BookingModel
from models.notification import NotificationModel

class BookingService:
    @staticmethod
    def book_resource(conn, resource_id: int, booked_by: int, start_time_str: str, 
                      end_time_str: str, purpose: str = "") -> int:
        """
        Orchestrates shared resource booking.
        Validates date ordering and dispatches a notification upon success.
        """
        # 1. Parse and validate time sequence
        start_dt = None
        end_dt = None
        
        # Try multiple formats including ISO 8601 variations
        formats = (
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M",
            "%Y-%m-%d %H:%M",
            "%Y-%m-%d"
        )
        
        for fmt in formats:
            if not start_dt:
                try:
                    start_dt = datetime.strptime(start_time_str, fmt)
                except ValueError:
                    pass
            if not end_dt:
                try:
                    end_dt = datetime.strptime(end_time_str, fmt)
                except ValueError:
                    pass

        if not start_dt or not end_dt:
            raise ValueError("Dates must be in a valid format (e.g. YYYY-MM-DD HH:MM:SS)")

        if start_dt >= end_dt:
            raise ValueError("Start time must be before end time.")
            
        if start_dt < datetime.now():
            raise ValueError("Cannot book resources in the past.")

        # Normalize dates for SQLite query comparisons
        norm_start_str = start_dt.strftime("%Y-%m-%d %H:%M:%S")
        norm_end_str = end_dt.strftime("%Y-%m-%d %H:%M:%S")

        # 2. Try to write booking (models.booking handles overlap query check)
        booking_id = BookingModel.create_booking(conn, resource_id, booked_by, norm_start_str, norm_end_str, purpose)

        # 3. Get Resource details for notification text
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM shared_resources WHERE id = ?", (resource_id,))
        resource_name = cursor.fetchone()["name"]

        # 4. Generate notification
        NotificationModel.create_notification(
            conn,
            recipient_id=booked_by,
            type="booking_confirmed",
            title="Booking Confirmed",
            message=f"Your booking for {resource_name} from {norm_start_str} to {norm_end_str} is confirmed.",
            reference_type="booking",
            reference_id=booking_id
        )

        return booking_id
