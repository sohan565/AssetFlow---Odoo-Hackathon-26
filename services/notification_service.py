"""Notification scanning and KPI dashboard service.

Provides automated checks for overdue returns, upcoming bookings, stale
maintenance requests, and aggregates system-wide KPIs for the dashboard.
"""

from datetime import datetime, timedelta

from database.connection import get_db
from models import allocation, booking, maintenance, notification, asset


def check_overdue_returns():
    """Check for overdue asset allocations and create notifications.

    Scans for allocations past their expected return date, and creates
    'overdue_return' notifications for the responsible employees. Avoids
    duplicate notifications by checking if one was already sent today.

    Returns:
        list[dict]: List of overdue allocations that were notified.
    """
    overdue = allocation.get_overdue_allocations()
    notified = []

    for alloc in overdue:
        emp_id = alloc.get('employee_id')
        if not emp_id:
            continue

        # Check if notification was already sent today for this allocation
        if notification.notification_exists_today(
            recipient_id=emp_id,
            type='overdue_return',
            reference_type='allocation',
            reference_id=alloc['id']
        ):
            continue

        asset_tag = alloc.get('asset_tag', '')
        asset_name = alloc.get('asset_name', f"Asset #{alloc.get('asset_id', '?')}")
        expected = alloc.get('expected_return', 'N/A')

        notification.create_notification(
            recipient_id=emp_id,
            type='overdue_return',
            title='Asset Return Overdue',
            message=f"Your allocated asset '{asset_name}' ({asset_tag}) "
                    f"was expected to be returned by {expected}. Please return it promptly.",
            reference_type='allocation',
            reference_id=alloc['id']
        )
        notified.append(alloc)

    return notified


def check_upcoming_bookings_reminders():
    """Send reminders for bookings starting within the next 2 hours.

    Creates 'booking_reminder' notifications for employees with upcoming bookings.
    Avoids duplicates by checking existing notifications for today.

    Returns:
        list[dict]: List of bookings that were reminded.
    """
    upcoming = booking.get_upcoming_bookings(hours=2)
    reminded = []

    for b in upcoming:
        emp_id = b.get('booked_by')
        if not emp_id:
            continue

        if notification.notification_exists_today(
            recipient_id=emp_id,
            type='booking_reminder',
            reference_type='booking',
            reference_id=b['id']
        ):
            continue

        notification.create_notification(
            recipient_id=emp_id,
            type='booking_reminder',
            title='Upcoming Booking Reminder',
            message=f"Reminder: You have a booking starting at {b.get('start_time', 'N/A')}."
                    + (f" Purpose: {b['purpose']}" if b.get('purpose') else ""),
            reference_type='booking',
            reference_id=b['id']
        )
        reminded.append(b)

    return reminded


def check_pending_maintenance():
    """Check for maintenance requests stuck in 'Pending Approval' for >48 hours.

    Creates reminder notifications for the relevant approvers.

    Returns:
        list[dict]: List of stale maintenance requests that were reminded about.
    """
    stale = maintenance.get_stale_pending_requests(hours=48)
    reminded = []

    for req in stale:
        # Find the approver — this would be the department head
        # For simplicity, we notify whoever should approve
        from models import employee as emp_model, department as dept_model

        requester = emp_model.get_employee(req.get('requested_by'))
        if not requester or not requester.get('department_id'):
            continue

        dept = dept_model.get_department(requester['department_id'])
        if not dept or not dept.get('head_employee_id'):
            continue

        approver_id = dept['head_employee_id']
        request_code = req.get('request_code', f"#{req['id']}")

        if notification.notification_exists_today(
            recipient_id=approver_id,
            type='approval_needed',
            reference_type='maintenance',
            reference_id=req['id']
        ):
            continue

        notification.create_notification(
            recipient_id=approver_id,
            type='approval_needed',
            title='Pending Maintenance Reminder',
            message=f"Maintenance request {request_code} has been pending approval "
                    f"for more than 48 hours. Please review.",
            reference_type='maintenance',
            reference_id=req['id']
        )
        reminded.append(req)

    return reminded


def get_dashboard_kpis():
    """Aggregate all dashboard KPI data.

    Returns a comprehensive dict with system-wide metrics for the dashboard.

    Returns:
        dict: KPI data with keys:
            - assets_by_state: dict mapping state to count
            - total_assets: total number of assets
            - overdue_returns: count of overdue allocations
            - active_bookings: count of confirmed upcoming bookings
            - open_maintenance: count of open maintenance requests
            - pending_approvals: count of pending approval requests
            - recent_audit_discrepancies: count of recent audit discrepancies
            - department_asset_values: list of dicts with dept_name, total_value, asset_count
    """
    # Assets by state
    state_counts = asset.get_assets_count_by_state()
    assets_by_state = {}
    total_assets = 0
    for row in state_counts:
        assets_by_state[row['current_state']] = row['count']
        total_assets += row['count']

    # Overdue returns
    overdue = allocation.get_overdue_allocations()
    overdue_returns = len(overdue)

    # Active bookings (upcoming confirmed)
    upcoming = booking.get_upcoming_bookings(hours=168)  # Next 7 days
    active_bookings = len(upcoming)

    # Open maintenance requests
    with get_db() as db:
        row = db.execute(
            "SELECT COUNT(*) as count FROM maintenance_requests "
            "WHERE status NOT IN ('Completed', 'Closed', 'Rejected')"
        ).fetchone()
        open_maintenance = row['count'] if row else 0

    # Pending approvals
    pending = maintenance.get_requests_by_status('Pending Approval')
    pending_approvals = len(pending)

    # Recent audit discrepancies
    with get_db() as db:
        row = db.execute(
            "SELECT COUNT(*) as count FROM audit_findings WHERE discrepancy_type IS NOT NULL"
        ).fetchone()
        recent_audit_discrepancies = row['count'] if row else 0

    # Department asset values
    with get_db() as db:
        rows = db.execute(
            "SELECT d.name as dept_name, "
            "COALESCE(SUM(a.purchase_cost), 0) as total_value, "
            "COUNT(a.id) as asset_count "
            "FROM departments d "
            "LEFT JOIN assets a ON a.department_id = d.id "
            "GROUP BY d.name "
            "ORDER BY total_value DESC"
        ).fetchall()
        department_asset_values = [dict(r) for r in rows]

    return {
        'assets_by_state': assets_by_state,
        'total_assets': total_assets,
        'overdue_returns': overdue_returns,
        'active_bookings': active_bookings,
        'open_maintenance': open_maintenance,
        'pending_approvals': pending_approvals,
        'recent_audit_discrepancies': recent_audit_discrepancies,
        'department_asset_values': department_asset_values
    }
