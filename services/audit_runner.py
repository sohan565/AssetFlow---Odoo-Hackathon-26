"""Audit orchestration service.

Manages the full audit lifecycle: creating cycles with assignments, recording
findings with automatic discrepancy detection, generating summary reports,
and completing audit cycles.
"""

from models import audit, notification


def create_and_assign_audit(cycle_name, start_date, end_date, created_by, assignments):
    """Create an audit cycle with assignments and notify all auditors.

    Args:
        cycle_name: Name of the audit cycle (e.g., 'Q3 2026 Audit').
        start_date: Cycle start date (ISO format YYYY-MM-DD).
        end_date: Cycle end date (ISO format YYYY-MM-DD).
        created_by: ID of the employee creating the audit.
        assignments: List of assignment dicts, each containing:
                     {'auditor_id': int, 'department_id': int, 'category_id': int}

    Returns:
        dict: Created audit cycle with 'cycle' and 'assignments' keys.
    """
    # Create the audit cycle
    cycle = audit.create_cycle(
        cycle_name=cycle_name,
        start_date=start_date,
        end_date=end_date,
        created_by=created_by
    )

    # Create assignments and notify auditors
    created_assignments = []
    notified_auditors = set()

    for assignment in assignments:
        a = audit.create_assignment(
            audit_cycle_id=cycle['id'],
            auditor_id=assignment['auditor_id'],
            department_id=assignment.get('department_id'),
            category_id=assignment.get('category_id')
        )
        created_assignments.append(a)

        # Notify each auditor (only once per auditor)
        auditor_id = assignment['auditor_id']
        if auditor_id not in notified_auditors:
            notification.create_notification(
                recipient_id=auditor_id,
                type='audit_assigned',
                title='Audit Assignment',
                message=f"You have been assigned to audit cycle '{cycle_name}' "
                        f"({start_date} to {end_date}). Please review your assignments.",
                reference_type='audit_cycle',
                reference_id=cycle['id']
            )
            notified_auditors.add(auditor_id)

    return {
        'cycle': cycle,
        'assignments': created_assignments
    }


def start_audit(cycle_id):
    """Start an audit cycle by transitioning its status to 'In Progress'.

    Args:
        cycle_id: ID of the audit cycle.

    Returns:
        dict: The updated audit cycle record.
    """
    return audit.update_cycle_status(cycle_id, 'In Progress')


def submit_finding(cycle_id, asset_id, auditor_id, actual_state, actual_location, notes=None):
    """Submit an audit finding for an asset.

    Records the auditor's observation and automatically detects discrepancies
    by comparing against the system's recorded state and location.

    Args:
        cycle_id: ID of the audit cycle.
        asset_id: ID of the asset being audited.
        auditor_id: ID of the auditor submitting the finding.
        actual_state: The state observed by the auditor.
        actual_location: The location observed by the auditor.
        notes: Optional additional notes.

    Returns:
        dict: The recorded audit finding, including any detected discrepancy.
    """
    return audit.record_finding(
        audit_cycle_id=cycle_id,
        asset_id=asset_id,
        auditor_id=auditor_id,
        actual_state=actual_state,
        actual_location=actual_location,
        notes=notes
    )


def generate_discrepancy_report(cycle_id):
    """Generate a discrepancy summary report for an audit cycle.

    Computes summary statistics including total assets audited, discrepancies
    found, and breakdown by discrepancy type.

    Args:
        cycle_id: ID of the audit cycle.

    Returns:
        dict: Structured report with keys:
              - cycle: audit cycle info
              - total_audited: number of assets audited
              - total_discrepancies: number of discrepancies
              - discrepancy_rate: percentage of discrepancies
              - by_type: dict mapping discrepancy_type to count
              - findings: list of all findings
              - discrepancies: list of findings with discrepancies
    """
    cycle = audit.get_cycle(cycle_id)
    findings = audit.get_findings(cycle_id)
    discrepancies = audit.get_discrepancies(cycle_id)

    # Breakdown by discrepancy type
    by_type = {}
    for d in discrepancies:
        dtype = d.get('discrepancy_type', 'Unknown')
        by_type[dtype] = by_type.get(dtype, 0) + 1

    total_audited = len(findings)
    total_discrepancies = len(discrepancies)
    discrepancy_rate = (total_discrepancies / total_audited * 100) if total_audited > 0 else 0.0

    return {
        'cycle': cycle,
        'total_audited': total_audited,
        'total_discrepancies': total_discrepancies,
        'discrepancy_rate': round(discrepancy_rate, 2),
        'by_type': by_type,
        'findings': findings,
        'discrepancies': discrepancies
    }


def complete_audit(cycle_id):
    """Complete an audit cycle by transitioning its status to 'Completed'.

    Locks the cycle and updates affected asset statuses (e.g. transitions
    confirmed-missing items to the 'Lost' state).

    Args:
        cycle_id: ID of the audit cycle.

    Returns:
        dict: The updated audit cycle record.
    """
    cycle = audit.get_cycle(cycle_id)
    if not cycle:
        raise ValueError(f"Audit cycle {cycle_id} not found.")

    created_by = cycle.get('created_by') or 1
    findings = audit.get_findings(cycle_id)

    from models import asset as asset_model

    for finding in findings:
        asset_id = finding['asset_id']
        actual = finding.get('actual_state')
        discrepancy = finding.get('discrepancy_type')

        # If flagged as missing or explicitly marked as Lost/Disposed
        if actual == 'Lost' or actual == 'Disposed' or discrepancy == 'Missing':
            try:
                target_state = 'Lost'
                if actual in ['Lost', 'Disposed']:
                    target_state = actual

                # Enforce state machine transition
                asset_model.transition_state(
                    asset_id=asset_id,
                    new_state=target_state,
                    changed_by=created_by,
                    reason=f"Confirmed missing/flagged in audit cycle '{cycle['cycle_name']}'."
                )
            except Exception as e:
                # If state machine prevents it (e.g. already disposed), ignore and proceed
                pass

    return audit.update_cycle_status(cycle_id, 'Completed')
