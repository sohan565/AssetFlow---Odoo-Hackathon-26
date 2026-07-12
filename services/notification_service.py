from datetime import datetime
from models.notification import NotificationModel

class NotificationService:
    @staticmethod
    def check_and_notify_overdue_returns(conn) -> int:
        """
        Scans active allocations for overdue returns.
        Dispatches alerts to the holders and the Asset Managers.
        Returns the number of overdue alerts dispatched.
        """
        cursor = conn.cursor()
        current_date_str = datetime.now().strftime("%Y-%m-%d")
        
        # Query active allocations past expected return date
        cursor.execute(
            """SELECT a.*, ast.name as asset_name, ast.asset_tag, e.id as employee_id, e.first_name || ' ' || e.last_name as employee_name
               FROM asset_allocations a
               JOIN assets ast ON a.asset_id = ast.id
               JOIN employees e ON a.employee_id = e.id
               WHERE a.returned_at IS NULL 
                 AND a.expected_return IS NOT NULL 
                 AND a.expected_return < ?""",
            (current_date_str,)
        )
        overdue_records = cursor.fetchall()

        if not overdue_records:
            return 0

        # Fetch all active Asset Managers (role = 'manager')
        cursor.execute("SELECT id FROM employees WHERE role = 'manager' AND is_active = 1")
        managers = cursor.fetchall()

        alerts_sent = 0
        for rec in overdue_records:
            # 1. Alert the employee holding the asset
            NotificationModel.create_notification(
                conn,
                recipient_id=rec["employee_id"],
                type="overdue_return",
                title="Overdue Asset Return Warning",
                message=f"Your allocation for {rec['asset_name']} ({rec['asset_tag']}) was due on {rec['expected_return']}. Please return it immediately.",
                reference_type="allocation",
                reference_id=rec["id"]
            )
            alerts_sent += 1

            # 2. Alert all Asset Managers
            msg = f"Asset '{rec['asset_name']}' ({rec['asset_tag']}) held by {rec['employee_name']} is overdue since {rec['expected_return']}."
            for mgr in managers:
                NotificationModel.create_notification(
                    conn,
                    recipient_id=mgr["id"],
                    type="overdue_return_manager",
                    title="Asset Overdue Alert (Admin)",
                    message=msg,
                    reference_type="allocation",
                    reference_id=rec["id"]
                )
                alerts_sent += 1

        return alerts_sent
