"""Maintenance approval routing engine.

Implements the approval workflow for maintenance requests, including
automatic routing to department managers, escalation to admins, and
notification dispatch at each stage.
"""

from models import maintenance, employee, department, notification
from utils.code_generator import generate_maintenance_code


def submit_request(asset_id, requested_by, issue_description, priority='Medium', estimated_cost=None):
    """Submit a new maintenance request with automatic approval routing.

    Generates a unique request code, creates the maintenance request, identifies
    the appropriate approver (department head), and sends an approval notification.

    Args:
        asset_id: ID of the asset requiring maintenance.
        requested_by: ID of the employee submitting the request.
        issue_description: Description of the issue.
        priority: Priority level ('Low', 'Medium', 'High', 'Critical').
        estimated_cost: Optional estimated repair cost.

    Returns:
        dict: The created maintenance request record.
    """
    request_code = generate_maintenance_code()

    request = maintenance.create_request(
        request_code=request_code,
        asset_id=asset_id,
        requested_by=requested_by,
        issue_description=issue_description,
        priority=priority,
        estimated_cost=estimated_cost
    )

    # Find the manager of the requesting employee's department
    emp = employee.get_employee(requested_by)
    if emp and emp.get('department_id'):
        dept = department.get_department(emp['department_id'])
        if dept and dept.get('head_employee_id'):
            manager_id = dept['head_employee_id']
            notification.create_notification(
                recipient_id=manager_id,
                type='approval_needed',
                title='Maintenance Approval Required',
                message=f"Maintenance request {request_code} for asset #{asset_id} "
                        f"requires your approval. Priority: {priority}. "
                        f"Issue: {issue_description[:100]}",
                reference_type='maintenance',
                reference_id=request['id']
            )

    return request


def process_approval(request_id, approver_id, decision, comments=None):
    """Process an approval decision for a maintenance request.

    Records the approval decision and dispatches appropriate notifications:
    - Approved: notifies the requester of approval
    - Rejected: notifies the requester of rejection
    - Escalated: finds an admin-level employee and notifies them

    Args:
        request_id: ID of the maintenance request.
        approver_id: ID of the employee making the decision.
        decision: Decision string ('Approved', 'Rejected', 'Escalated').
        comments: Optional comments about the decision.

    Returns:
        dict: The approval record.
    """
    approval = maintenance.add_approval(
        request_id=request_id,
        approver_id=approver_id,
        decision=decision,
        comments=comments
    )

    # Get the request to find the original requester
    request = maintenance.get_request(request_id)
    if not request:
        return approval

    requester_id = request.get('requested_by')
    request_code = request.get('request_code', f'#{request_id}')

    if decision == 'Approved' and requester_id:
        notification.create_notification(
            recipient_id=requester_id,
            type='maintenance_update',
            title='Maintenance Request Approved',
            message=f"Your maintenance request {request_code} has been approved."
                    + (f" Comments: {comments}" if comments else ""),
            reference_type='maintenance',
            reference_id=request_id
        )
    elif decision == 'Rejected' and requester_id:
        notification.create_notification(
            recipient_id=requester_id,
            type='maintenance_update',
            title='Maintenance Request Rejected',
            message=f"Your maintenance request {request_code} has been rejected."
                    + (f" Reason: {comments}" if comments else ""),
            reference_type='maintenance',
            reference_id=request_id
        )
    elif decision == 'Escalated':
        # Find an admin-level employee for escalation
        admins = employee.get_employees_by_role('admin')
        if admins:
            admin = admins[0]
            notification.create_notification(
                recipient_id=admin['id'],
                type='approval_needed',
                title='Escalated Maintenance Approval',
                message=f"Maintenance request {request_code} has been escalated "
                        f"and requires your review."
                        + (f" Comments: {comments}" if comments else ""),
                reference_type='maintenance',
                reference_id=request_id
            )

    return approval


def begin_work(request_id):
    """Begin maintenance work on a request.

    Transitions the request status to 'In Progress'.

    Args:
        request_id: ID of the maintenance request.

    Returns:
        dict: The updated maintenance request record.
    """
    return maintenance.start_maintenance(request_id)


def finish_work(request_id, actual_cost=None):
    """Complete maintenance work and notify the original requester.

    Marks the request as completed and sends a notification to the
    employee who originally submitted the request.

    Args:
        request_id: ID of the maintenance request.
        actual_cost: Optional actual cost of the repair.

    Returns:
        dict: The updated maintenance request record.
    """
    result = maintenance.complete_maintenance(request_id, actual_cost=actual_cost)

    # Notify the original requester
    request = maintenance.get_request(request_id)
    if request and request.get('requested_by'):
        request_code = request.get('request_code', f'#{request_id}')
        notification.create_notification(
            recipient_id=request['requested_by'],
            type='maintenance_update',
            title='Maintenance Completed',
            message=f"Maintenance request {request_code} has been completed."
                    + (f" Actual cost: ₹{actual_cost:,.2f}" if actual_cost else ""),
            reference_type='maintenance',
            reference_id=request_id
        )

    return result


def get_pending_for_approver(approver_id):
    """Get all maintenance requests pending approval for a specific approver.

    Args:
        approver_id: ID of the approver employee.

    Returns:
        list[dict]: Pending maintenance requests.
    """
    return maintenance.get_pending_approvals(approver_id=approver_id)
