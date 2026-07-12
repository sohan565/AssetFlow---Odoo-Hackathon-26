from models.audit import AuditModel
from models.notification import NotificationModel

class AuditRunnerService:
    @staticmethod
    def start_audit_cycle(conn, cycle_name: str, start_date: str, end_date: str, 
                          creator_id: int, assignments: list) -> int:
        """
        Starts an audit cycle and alerts the assigned auditors of their scope.
        Each assignment in the list should be a dictionary: {"auditor_id": int, "department_id": int, "category_id": int}
        """
        cycle_id = AuditModel.create_audit_cycle(conn, cycle_name, start_date, end_date, creator_id)

        for assign in assignments:
            auditor_id = assign["auditor_id"]
            dept_id = assign.get("department_id")
            cat_id = assign.get("category_id")
            
            # Create assignment row
            AuditModel.create_audit_assignment(conn, cycle_id, auditor_id, dept_id, cat_id)

            # Notify the auditor
            scope_desc = []
            if dept_id:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM departments WHERE id = ?", (dept_id,))
                scope_desc.append(f"Department: {cursor.fetchone()['name']}")
            if cat_id:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM asset_categories WHERE id = ?", (cat_id,))
                scope_desc.append(f"Category: {cursor.fetchone()['name']}")
                
            scope_str = ", ".join(scope_desc) if scope_desc else "All assets"

            NotificationModel.create_notification(
                conn,
                recipient_id=auditor_id,
                type="audit_assigned",
                title="Audit Cycle Assigned",
                message=f"You have been assigned to audit cycle '{cycle_name}'. Scope: {scope_str}.",
                reference_type="audit",
                reference_id=cycle_id
            )

        return cycle_id

    @staticmethod
    def close_and_conclude_audit(conn, audit_cycle_id: int):
        """
        Closes the audit cycle, changes status of missing assets to 'Lost', 
        and alerts managers of discrepancies.
        """
        # Call model to close cycle and update missing assets to Lost
        AuditModel.close_audit_cycle(conn, audit_cycle_id)

        # Get all discrepancies
        discrepancies = AuditModel.get_audit_discrepancies(conn, audit_cycle_id)

        # Alert all Asset Managers (role = 'manager')
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM employees WHERE role = 'manager' AND is_active = 1")
        managers = cursor.fetchall()

        for disc in discrepancies:
            msg = (
                f"Discrepancy in Audit Cycle {audit_cycle_id} for asset '{disc['asset_name']}' ({disc['asset_tag']}). "
                f"Type: {disc['discrepancy_type']}. Notes: {disc['notes']}"
            )
            for mgr in managers:
                NotificationModel.create_notification(
                    conn,
                    recipient_id=mgr["id"],
                    type="audit_discrepancy",
                    title="Audit Discrepancy Flagged",
                    message=msg,
                    reference_type="audit",
                    reference_id=audit_cycle_id
                )
