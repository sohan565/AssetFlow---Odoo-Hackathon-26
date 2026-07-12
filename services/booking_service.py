"""Booking orchestration service.

Handles resource booking lifecycle including validation, conflict detection,
slot availability calculations, and upcoming booking notifications.
"""

from datetime import datetime, timedelta

from models import booking, notification
from utils.validators import validate_datetime


def book_resource(resource_id, employee_id, start_time, end_time, purpose=None):
    """Book a shared resource with validation and confirmation notification.

    Validates datetime formats, ensures start < end, delegates to the model
    layer for overlap checking, and sends a confirmation notification.

    Args:
        resource_id: ID of the shared resource to book.
        employee_id: ID of the employee making the booking.
        start_time: Booking start (ISO datetime format).
        end_time: Booking end (ISO datetime format).
        purpose: Optional description of the booking purpose.

    Returns:
        dict: The created booking record.

    Raises:
        ValueError: If datetime formats are invalid or start >= end.
    """
    # Validate datetime formats
    if not validate_datetime(start_time):
        raise ValueError(f"Invalid start_time format: '{start_time}'. Use YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM:SS.")
    if not validate_datetime(end_time):
        raise ValueError(f"Invalid end_time format: '{end_time}'. Use YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM:SS.")

    # Validate start < end
    if start_time >= end_time:
        raise ValueError("Start time must be before end time.")

    # Create booking (model handles overlap check)
    new_booking = booking.create_booking(
        resource_id=resource_id,
        booked_by=employee_id,
        start_time=start_time,
        end_time=end_time,
        purpose=purpose
    )

    # Get resource details for notification
    resource = booking.get_resource(resource_id)
    resource_name = resource['name'] if resource else f"Resource #{resource_id}"

    # Send confirmation notification
    notification.create_notification(
        recipient_id=employee_id,
        type='booking_reminder',
        title='Booking Confirmed',
        message=f"Your booking for '{resource_name}' from {start_time} to {end_time} has been confirmed."
                + (f" Purpose: {purpose}" if purpose else ""),
        reference_type='booking',
        reference_id=new_booking['id']
    )

    return new_booking


def cancel_resource_booking(booking_id):
    """Cancel a resource booking.

    Args:
        booking_id: ID of the booking to cancel.

    Returns:
        dict: The updated booking record with status 'Cancelled'.
    """
    return booking.cancel_booking(booking_id)


def get_available_slots(resource_id, date):
    """Calculate available time slots for a resource on a given date.

    Examines all confirmed bookings for the specified date and identifies
    gaps within business hours (09:00-18:00).

    Args:
        resource_id: ID of the shared resource.
        date: Date string in YYYY-MM-DD format.

    Returns:
        list[dict]: Available slots, each with 'start' and 'end' keys.
                    Example: [{'start': '09:00', 'end': '10:30'}, ...]
    """
    # Get all bookings for that date
    bookings = booking.get_bookings_for_resource(resource_id, date=date)

    # Business hours
    biz_start = datetime.strptime(f"{date} 09:00", "%Y-%m-%d %H:%M")
    biz_end = datetime.strptime(f"{date} 18:00", "%Y-%m-%d %H:%M")

    # Collect booked intervals (only confirmed ones)
    booked_intervals = []
    for b in bookings:
        if b.get('status') != 'Confirmed':
            continue
        # Parse start/end times - handle multiple formats
        for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M'):
            try:
                s = datetime.strptime(b['start_time'], fmt)
                break
            except ValueError:
                continue
        else:
            continue

        for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M'):
            try:
                e = datetime.strptime(b['end_time'], fmt)
                break
            except ValueError:
                continue
        else:
            continue

        # Clip to business hours
        s = max(s, biz_start)
        e = min(e, biz_end)
        if s < e:
            booked_intervals.append((s, e))

    # Sort by start time
    booked_intervals.sort(key=lambda x: x[0])

    # Find gaps
    available = []
    current = biz_start

    for start, end in booked_intervals:
        if current < start:
            available.append({
                'start': current.strftime('%H:%M'),
                'end': start.strftime('%H:%M')
            })
        current = max(current, end)

    if current < biz_end:
        available.append({
            'start': current.strftime('%H:%M'),
            'end': biz_end.strftime('%H:%M')
        })

    return available


def check_upcoming_bookings():
    """Get bookings starting within the next 24 hours.

    Returns:
        list[dict]: Upcoming confirmed bookings.
    """
    return booking.get_upcoming_bookings(hours=24)
