"""Asset lifecycle orchestration service.

Manages asset state transitions with side effects including notifications,
allocation tracking, and maintenance workflows. Acts as the primary entry
point for all asset state changes in the system.
"""

from models import asset, allocation, notification
from utils.code_generator import generate_asset_tag


def register_new_asset(name, category_id, department_id=None, **kwargs):
    """Register a new asset with auto-generated asset tag.

    Creates a new asset record with a sequentially generated tag in the
    format AST-YYYY-NNNNN.

    Args:
        name: Display name of the asset.
        category_id: ID of the asset category.
        department_id: Optional owning department ID.
        **kwargs: Additional asset fields (serial_number, model, manufacturer,
                  purchase_date, purchase_cost, warranty_expiry, location, notes).

    Returns:
        dict: The newly created asset record.
    """
    asset_tag = generate_asset_tag()
    return asset.create_asset(
        asset_tag=asset_tag,
        name=name,
        category_id=category_id,
        department_id=department_id,
        **kwargs
    )


def allocate_to_employee(asset_id, employee_id, allocated_by, expected_return=None):
    """Allocate an asset to an employee with notification.

    Performs the allocation and sends a notification to the receiving employee.

    Args:
        asset_id: ID of the asset to allocate.
        employee_id: ID of the employee receiving the asset.
        allocated_by: ID of the employee performing the allocation.
        expected_return: Optional expected return date (ISO format YYYY-MM-DD).

    Returns:
        dict: The allocation record.
    """
    alloc = allocation.allocate_asset(
        asset_id=asset_id,
        employee_id=employee_id,
        allocated_by=allocated_by,
        expected_return=expected_return
    )

    # Fetch asset details for the notification message
    asset_info = asset.get_asset(asset_id)
    asset_name = asset_info['name'] if asset_info else f"Asset #{asset_id}"
    asset_tag = asset_info['asset_tag'] if asset_info else ''

    notification.create_notification(
        recipient_id=employee_id,
        type='maintenance_update',
        title='Asset Allocated to You',
        message=f"Asset '{asset_name}' ({asset_tag}) has been allocated to you."
                + (f" Expected return: {expected_return}." if expected_return else ""),
        reference_type='allocation',
        reference_id=alloc['id']
    )

    return alloc


def return_from_employee(allocation_id, returned_by):
    """Return an allocated asset from an employee.

    Marks the allocation as returned and transitions the asset back to Available.

    Args:
        allocation_id: ID of the allocation record.
        returned_by: ID of the employee processing the return.

    Returns:
        dict: The updated allocation record.
    """
    return allocation.return_asset(allocation_id, returned_by=returned_by)


def send_for_maintenance(asset_id, changed_by, reason):
    """Transition an asset to 'Under Maintenance' state.

    Args:
        asset_id: ID of the asset.
        changed_by: ID of the employee initiating the transition.
        reason: Reason for sending to maintenance.

    Returns:
        dict: The updated asset record.
    """
    return asset.transition_state(asset_id, 'Under Maintenance', changed_by, reason)


def complete_repair(asset_id, changed_by):
    """Transition an asset from maintenance back to 'Available'.

    Args:
        asset_id: ID of the asset.
        changed_by: ID of the employee marking repair as complete.

    Returns:
        dict: The updated asset record.
    """
    return asset.transition_state(asset_id, 'Available', changed_by, 'Repair completed')


def report_lost(asset_id, changed_by, reason):
    """Report an asset as lost.

    Args:
        asset_id: ID of the asset.
        changed_by: ID of the employee reporting the loss.
        reason: Description of circumstances.

    Returns:
        dict: The updated asset record.
    """
    return asset.transition_state(asset_id, 'Lost', changed_by, reason)


def retire_asset(asset_id, changed_by, reason):
    """Retire an asset (end of life).

    Args:
        asset_id: ID of the asset.
        changed_by: ID of the employee retiring the asset.
        reason: Reason for retirement.

    Returns:
        dict: The updated asset record.
    """
    return asset.transition_state(asset_id, 'Retired', changed_by, reason)


def dispose_asset(asset_id, changed_by, reason):
    """Dispose of an asset (final write-off).

    Args:
        asset_id: ID of the asset.
        changed_by: ID of the employee disposing the asset.
        reason: Reason for disposal.

    Returns:
        dict: The updated asset record.
    """
    return asset.transition_state(asset_id, 'Disposed', changed_by, reason)


def get_asset_summary():
    """Get a summary of asset counts grouped by state.

    Returns:
        dict: Mapping of state names to their counts.
              Example: {'Available': 5, 'Allocated': 3, ...}
    """
    rows = asset.get_assets_count_by_state()
    summary = {}
    for row in rows:
        summary[row['current_state']] = row['count']
    return summary
