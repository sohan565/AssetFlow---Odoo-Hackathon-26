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
        try:
            start_dt = datetime.strptime(start_time_str, "%Y-%m-%d %H:%M:%S")
            end_dt = datetime.strptime(end_time_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise ValueError("Dates must be in format YYYY-MM-DD HH:MM:SS")

        if start_dt >= end_dt:
            raise ValueError("Start time must be before end time.")
            
        if start_dt < datetime.now():
            raise ValueError("Cannot book resources in the past.")

        # 2. Try to write booking (models.booking handles overlap query check)
        booking_id = BookingModel.create_booking(conn, resource_id, booked_by, start_time_str, end_time_str, purpose)

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
            message=f"Your booking for {resource_name} from {start_time_str} to {end_time_str} is confirmed.",
            reference_type="booking",
            reference_id=booking_id
        )

        return booking_id
