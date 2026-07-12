from models.maintenance import MaintenanceModel
from models.notification import NotificationModel

class ApprovalEngineService:
    @staticmethod
    def submit_maintenance_request(conn, asset_id: int, requested_by: int, 
                                   description: str, priority: str = "Medium", 
                                   estimated_cost: float = 0.0) -> int:
        """
        Submits a repair request and alerts all Asset Managers of the new request.
        """
        req_id = MaintenanceModel.create_maintenance_request(
            conn, asset_id, requested_by, description, priority, estimated_cost
        )

        # Alert all Asset Managers (role = 'manager')
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM employees WHERE role = 'manager' AND is_active = 1")
        managers = cursor.fetchall()
        
        # Get asset name
        cursor.execute("SELECT name, asset_tag FROM assets WHERE id = ?", (asset_id,))
        asset_row = cursor.fetchone()
        asset_name = f"{asset_row['name']} ({asset_row['asset_tag']})"

        for mgr in managers:
            NotificationModel.create_notification(
                conn,
                recipient_id=mgr["id"],
                type="approval_needed",
                title="Repair Approval Required",
                message=f"New maintenance request submitted for {asset_name}. Approval required.",
                reference_type="maintenance",
                reference_id=req_id
            )

        return req_id

    @staticmethod
    def approve_or_reject_request(conn, request_id: int, approver_id: int, 
                                  decision: str, comments: str = ""):
        """
        Processes the approval decision and notifies the requesting employee.
        """
        # Call model to write decision and flip state
        MaintenanceModel.approve_maintenance_request(conn, request_id, approver_id, decision, comments)

        # Fetch requester and asset details
        cursor = conn.cursor()
        cursor.execute(
            """SELECT m.requested_by, m.request_code, ast.name as asset_name 
               FROM maintenance_requests m
               JOIN assets ast ON m.asset_id = ast.id
               WHERE m.id = ?""",
            (request_id,)
        )
        req = cursor.fetchone()
        
        if req:
            NotificationModel.create_notification(
                conn,
                recipient_id=req["requested_by"],
                type="maintenance_update",
                title=f"Repair Request {decision}",
                message=f"Your repair request {req['request_code']} for {req['asset_name']} has been {decision.lower()}.",
                reference_type="maintenance",
                reference_id=request_id
            )
