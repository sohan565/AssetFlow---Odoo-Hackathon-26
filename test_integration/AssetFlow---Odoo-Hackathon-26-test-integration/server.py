import uvicorn
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database.connection import DatabaseConnection
from models.employee import EmployeeModel
from models.asset import AssetModel
from models.allocation import AllocationModel
from models.booking import BookingModel
from models.maintenance import MaintenanceModel
from models.audit import AuditModel
from models.notification import NotificationModel
from models.transfer import TransferModel
from models.asset_category import AssetCategoryModel

from services.asset_lifecycle import AssetLifecycleService
from services.booking_service import BookingService
from services.approval_engine import ApprovalEngineService
from services.audit_runner import AuditRunnerService
from services.notification_service import NotificationService

app = FastAPI(title="AssetFlow API Server")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return RedirectResponse(url="/docs")

# ---------------------------------------------------------------------------
# Helper functions for database mappings
# ---------------------------------------------------------------------------

def get_dept_heads(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT head_employee_id FROM departments WHERE head_employee_id IS NOT NULL AND is_active = 1")
    return {row["head_employee_id"] for row in cursor.fetchall()}

def get_category_name_map(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM asset_categories")
    return {row["id"]: row["name"] for row in cursor.fetchall()}

def get_department_name_map(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM departments")
    return {row["id"]: row["name"] for row in cursor.fetchall()}

def get_employee_name_map(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT id, first_name || ' ' || last_name as name FROM employees")
    return {row["id"]: row["name"] for row in cursor.fetchall()}

def get_asset_tag_map(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT id, asset_tag FROM assets")
    return {row["id"]: row["asset_tag"] for row in cursor.fetchall()}

def get_asset_name_map(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM assets")
    return {row["id"]: row["name"] for row in cursor.fetchall()}

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/state")
def get_state(x_user_role: Optional[str] = Header(None)):
    conn = DatabaseConnection.get_connection()
    try:
        # Load all master maps
        dept_heads = get_dept_heads(conn)
        cat_map = get_category_name_map(conn)
        dept_map = get_department_name_map(conn)
        emp_map = get_employee_name_map(conn)
        tag_map = get_asset_tag_map(conn)
        asset_map = get_asset_name_map(conn)

        # 1. Employees
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM employees WHERE is_active = 1")
        db_employees = cursor.fetchall()
        employees = []
        for emp in db_employees:
            role = "Employee"
            if emp["role"] == "admin":
                role = "Admin"
            elif emp["role"] == "manager":
                role = "Asset Manager"
            elif emp["id"] in dept_heads:
                role = "Department Head"
            elif emp["role"] == "auditor":
                role = "Asset Manager"  # auditor functions as asset manager in frontend UI
            
            employees.append({
                "id": str(emp["id"]),
                "name": f"{emp['first_name']} {emp['last_name']}",
                "role": role,
                "department": dept_map.get(emp["department_id"], "Unassigned")
            })

        # 2. Assets
        cursor.execute("SELECT * FROM assets")
        db_assets = cursor.fetchall()
        assets = []
        for a in db_assets:
            # Map category
            cat_name = cat_map.get(a["category_id"], "Hardware")
            if cat_name == "Electronics":
                cat_name = "Hardware"
            elif cat_name not in ["Hardware", "Software", "Furniture", "Vehicles", "Facilities"]:
                cat_name = "Hardware"
                
            # Map status
            status = "Available"
            if a["current_state"] == "Allocated":
                status = "Allocated"
            elif a["current_state"] == "Under Maintenance":
                status = "Maintenance"
            elif a["current_state"] in ["Lost", "Retired", "Disposed"]:
                status = "Retired"
                
            assets.append({
                "id": str(a["id"]),
                "assetTag": a["asset_tag"],
                "name": a["name"],
                "category": cat_name,
                "status": status,
                "purchaseValue": a["purchase_cost"] or 0,
                "location": a["location"] or "Unknown"
            })

        # 3. Allocations
        # Determine expected return status
        cursor.execute("SELECT * FROM asset_allocations")
        db_allocations = cursor.fetchall()
        allocations = []
        for al in db_allocations:
            status = "Active"
            if al["returned_at"]:
                status = "Returned"
            else:
                # If expected return date exists and is in the past
                if al["expected_return"]:
                    try:
                        due_date = datetime.strptime(al["expected_return"], "%Y-%m-%d").date()
                        if due_date < datetime.now().date():
                            status = "Overdue"
                    except ValueError:
                        pass
            
            allocations.append({
                "id": str(al["id"]),
                "assetId": str(al["asset_id"]),
                "employeeId": str(al["employee_id"]),
                "allocatedDate": al["allocated_at"].split(" ")[0] if al["allocated_at"] else "",
                "expectedReturnDate": al["expected_return"] or "",
                "status": status
            })

        # 4. Bookings
        # In DB resource bookings maps to shared_resources.
        # We will expose shared resources as "assets" for the bookings module, or map resource bookings directly.
        cursor.execute("""
            SELECT b.*, r.name as resource_name 
            FROM resource_bookings b
            JOIN shared_resources r ON b.resource_id = r.id
        """)
        db_bookings = cursor.fetchall()
        bookings = []
        for bk in db_bookings:
            status = "Pending"
            if bk["status"] == "Confirmed":
                status = "Approved"
            elif bk["status"] == "Cancelled":
                status = "Rejected"
            
            bookings.append({
                "id": str(bk["id"]),
                "assetId": str(bk["resource_id"]),
                "requestedBy": str(bk["booked_by"]),
                "startDate": bk["start_time"],
                "endDate": bk["end_time"],
                "status": status
            })

        # Expose shared resources as assets so that ResourceBooking can display them in dropdowns.
        cursor.execute("SELECT * FROM shared_resources WHERE is_active = 1")
        db_resources = cursor.fetchall()
        for r in db_resources:
            # We add them to assets with category "Facilities" or "Vehicles"
            cat = "Facilities"
            if r["resource_type"] == "vehicle":
                cat = "Vehicles"
            elif r["resource_type"] == "equipment":
                cat = "Hardware"
                
            assets.append({
                "id": str(r["id"]),
                "assetTag": f"RES-{r['id']}",
                "name": r["name"],
                "category": cat,
                "status": "Available",
                "purchaseValue": 0,
                "location": r["location"] or "HQ"
            })

        # 5. Maintenance Tickets
        cursor.execute("SELECT * FROM maintenance_requests")
        db_tickets = cursor.fetchall()
        tickets = []
        for t in db_tickets:
            status = "Reported"
            if t["status"] in ["Approved", "In Progress"]:
                status = "In Progress"
            elif t["status"] in ["Completed", "Closed", "Rejected"]:
                status = "Resolved"
                
            priority = "Medium"
            if t["priority"] in ["Low", "Medium", "High"]:
                priority = t["priority"]
            elif t["priority"] == "Critical":
                priority = "High"

            tickets.append({
                "id": str(t["id"]),
                "assetId": str(t["asset_id"]),
                "issue": t["issue_description"],
                "priority": priority,
                "status": status,
                "reportedBy": str(t["requested_by"])
            })

        # 6. Notifications
        cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC")
        db_notifications = cursor.fetchall()
        notifications = []
        for n in db_notifications:
            notifications.append({
                "id": str(n["id"]),
                "title": n["title"],
                "message": n["message"],
                "type": n["type"] if n["type"] in ["alert", "warning", "success"] else "warning",
                "timestamp": n["created_at"].split(" ")[1] if " " in n["created_at"] else "12:00 PM",
                "read": bool(n["is_read"])
            })

        # 7. Audit Entries
        cursor.execute("SELECT * FROM audit_findings ORDER BY found_at DESC")
        db_findings = cursor.fetchall()
        audit_entries = []
        for f in db_findings:
            condition = "Good"
            if f["actual_state"] == "Damaged":
                condition = "Damaged"
            elif f["actual_state"] in ["Missing", "Lost"]:
                condition = "Missing"

            # Resolve auditor name
            auditor_name = emp_map.get(f["auditor_id"], "Auditor")

            audit_entries.append({
                "id": str(f["id"]),
                "assetTag": tag_map.get(f["asset_id"], "AST-000"),
                "condition": condition,
                "note": f["notes"] or "",
                "auditor": auditor_name,
                "time": f["found_at"].split(" ")[0] if f["found_at"] else ""
            })

        return {
            "employees": employees,
            "assets": assets,
            "allocations": allocations,
            "bookings": bookings,
            "tickets": tickets,
            "notifications": notifications,
            "auditEntries": audit_entries
        }
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Post / Mutation Endpoints
# ---------------------------------------------------------------------------

class CreateAssetInput(BaseModel):
    name: str
    category: str
    location: str
    purchaseValue: float

@app.post("/api/assets")
def create_asset(data: CreateAssetInput):
    conn = DatabaseConnection.get_connection()
    try:
        # Resolve category ID
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM asset_categories WHERE name = ?", (data.category,))
        cat_row = cursor.fetchone()
        cat_id = cat_row["id"] if cat_row else 1 # Default Electronics/Hardware

        # Resolve department ID
        cursor.execute("SELECT id FROM departments LIMIT 1")
        dept_row = cursor.fetchone()
        dept_id = dept_row["id"] if dept_row else 1

        asset_id = AssetModel.create_asset(
            conn,
            name=data.name,
            category_id=cat_id,
            department_id=dept_id,
            serial_number=f"SN-{data.name.upper()[:4]}-{datetime.now().strftime('%H%M%S')}",
            model="Standard Model",
            manufacturer="Standard Manufacturer",
            purchase_date=datetime.now().strftime("%Y-%m-%d"),
            purchase_cost=data.purchaseValue,
            warranty_expiry="",
            location=data.location,
            notes="Registered via web portal"
        )
        return {"success": True, "id": str(asset_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

class ReturnAssetInput(BaseModel):
    assetId: str

@app.post("/api/assets/return")
def return_asset(data: ReturnAssetInput):
    conn = DatabaseConnection.get_connection()
    try:
        # Check if asset exists
        asset_id = int(data.assetId)
        AllocationModel.return_asset(conn, asset_id, "Returned via Web Portal")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

class AllocateAssetInput(BaseModel):
    assetId: str
    employeeId: str
    expectedReturnDate: str

@app.post("/api/allocations")
def allocate_asset(data: AllocateAssetInput):
    conn = DatabaseConnection.get_connection()
    try:
        asset_id = int(data.assetId)
        emp_id = int(data.employeeId)
        
        # Get employee's department_id
        cursor = conn.cursor()
        cursor.execute("SELECT department_id FROM employees WHERE id = ?", (emp_id,))
        emp_row = cursor.fetchone()
        dept_id = emp_row["department_id"] if emp_row else 1

        alloc_id = AllocationModel.allocate_asset(
            conn,
            asset_id=asset_id,
            employee_id=emp_id,
            department_id=dept_id,
            allocated_by=1, # Default Admin
            expected_return=data.expectedReturnDate or None,
            notes="Allocated via Web Portal"
        )
        return {"success": True, "id": str(alloc_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

class CreateBookingInput(BaseModel):
    assetId: str
    requestedBy: str
    startDate: str
    endDate: str

@app.post("/api/bookings")
def create_booking(data: CreateBookingInput):
    conn = DatabaseConnection.get_connection()
    try:
        res_id = int(data.assetId)
        emp_id = int(data.requestedBy)
        
        booking_id = BookingService.book_resource(
            conn,
            resource_id=res_id,
            employee_id=emp_id,
            start_time=data.startDate,
            end_time=data.endDate,
            purpose="Booking request from Web Portal"
        )
        return {"success": True, "id": str(booking_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

class UpdateBookingStatusInput(BaseModel):
    status: str

@app.put("/api/bookings/{booking_id}/status")
def update_booking_status(booking_id: str, data: UpdateBookingStatusInput):
    conn = DatabaseConnection.get_connection()
    try:
        bk_id = int(booking_id)
        if data.status == "Approved":
            # Just keep it confirmed, in database it is already Confirmed by default or we can toggle
            cursor = conn.cursor()
            cursor.execute("UPDATE resource_bookings SET status = 'Confirmed' WHERE id = ?", (bk_id,))
            conn.commit()
        elif data.status == "Rejected":
            BookingModel.cancel_booking(conn, bk_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

class CreateTicketInput(BaseModel):
    assetId: str
    issue: str
    priority: str
    reportedBy: str

@app.post("/api/tickets")
def raise_ticket(data: CreateTicketInput):
    conn = DatabaseConnection.get_connection()
    try:
        asset_id = int(data.assetId)
        emp_id = int(data.reportedBy)
        
        # Priority mapping
        priority = data.priority
        if priority not in ["Low", "Medium", "High", "Critical"]:
            priority = "Medium"

        req_id = ApprovalEngineService.submit_maintenance_request(
            conn,
            asset_id=asset_id,
            employee_id=emp_id,
            issue_description=data.issue,
            priority=priority,
            estimated_cost=0.0
        )
        return {"success": True, "id": str(req_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

class UpdateTicketStatusInput(BaseModel):
    status: str

@app.put("/api/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: str, data: UpdateTicketStatusInput):
    conn = DatabaseConnection.get_connection()
    try:
        t_id = int(ticket_id)
        if data.status == "Resolved":
            MaintenanceModel.resolve_maintenance_request(conn, t_id)
        elif data.status == "In Progress":
            MaintenanceModel.assign_technician_and_start(conn, t_id, "Internal Tech")
        elif data.status == "Reported":
            # Reset to Pending Approval
            cursor = conn.cursor()
            cursor.execute("UPDATE maintenance_requests SET status = 'Pending Approval' WHERE id = ?", (t_id,))
            conn.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

class LogAuditInput(BaseModel):
    assetTag: str
    condition: str
    note: str
    auditor: str

@app.post("/api/audits")
def log_audit(data: LogAuditInput):
    conn = DatabaseConnection.get_connection()
    try:
        # Find asset by tag
        cursor = conn.cursor()
        asset = AssetModel.get_asset_by_tag(conn, data.assetTag)
        if not asset:
            raise HTTPException(status_code=404, detail="Asset tag not found")
        
        # Get active audit cycle or create one if none exists
        cursor.execute("SELECT id FROM audit_cycles WHERE status = 'In Progress' LIMIT 1")
        cycle_row = cursor.fetchone()
        if cycle_row:
            cycle_id = cycle_row["id"]
        else:
            # Create a default cycle for web audit logs
            cursor.execute("""
                INSERT INTO audit_cycles (cycle_name, start_date, end_date, status, created_by)
                VALUES ('Web Audit Cycle', CURRENT_DATE, CURRENT_DATE, 'In Progress', 1)
            """)
            cycle_id = cursor.lastrowid
            conn.commit()
            
        # Get auditor ID (based on name or default to 1)
        cursor.execute("SELECT id FROM employees WHERE first_name || ' ' || last_name = ? LIMIT 1", (data.auditor,))
        auditor_row = cursor.fetchone()
        auditor_id = auditor_row["id"] if auditor_row else 1

        # Map condition to database actual state
        actual_state = "Available"
        if data.condition == "Damaged":
            actual_state = "Damaged"
        elif data.condition == "Missing":
            actual_state = "Missing"

        finding_id = AuditModel.record_audit_finding(
            conn,
            audit_cycle_id=cycle_id,
            asset_id=asset["id"],
            auditor_id=auditor_id,
            actual_state=actual_state,
            actual_location=asset["location"] or "Unknown Location",
            notes=data.note
        )
        return {"success": True, "id": str(finding_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/notifications/read-all")
def read_all_notifications():
    conn = DatabaseConnection.get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE notifications SET is_read = 1")
        conn.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/notifications/scan-overdue")
def scan_overdue_notifications():
    conn = DatabaseConnection.get_connection()
    try:
        alerts_sent = NotificationService.check_and_notify_overdue_returns(conn)
        return {"success": True, "alerts_sent": alerts_sent}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Transfer Requests and Categories API
# ---------------------------------------------------------------------------

class CreateTransferInput(BaseModel):
    assetId: str
    fromEmployeeId: str
    toEmployeeId: str
    requestedBy: str

class ResolveTransferInput(BaseModel):
    decidedBy: str
    comments: Optional[str] = None

class CreateCategoryInput(BaseModel):
    name: str
    parentId: Optional[int] = None
    description: Optional[str] = None
    depreciationRate: float = 0.0

@app.get("/api/transfers/pending")
def get_pending_transfers():
    conn = DatabaseConnection.get_connection()
    try:
        rows = TransferModel.get_pending_transfers(conn)
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/transfers")
def create_transfer(data: CreateTransferInput):
    conn = DatabaseConnection.get_connection()
    try:
        t_id = TransferModel.create_transfer_request(
            conn,
            asset_id=int(data.assetId),
            from_employee_id=int(data.fromEmployeeId),
            to_employee_id=int(data.toEmployeeId),
            requested_by=int(data.requestedBy)
        )
        return {"success": True, "id": str(t_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.put("/api/transfers/{transfer_id}/approve")
def approve_transfer(transfer_id: str, data: ResolveTransferInput):
    conn = DatabaseConnection.get_connection()
    try:
        t_id = int(transfer_id)
        decided_by = int(data.decidedBy)
        row = TransferModel.approve_transfer(conn, t_id, decided_by, data.comments)
        return {"success": True, "transfer": dict(row)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.put("/api/transfers/{transfer_id}/reject")
def reject_transfer(transfer_id: str, data: ResolveTransferInput):
    conn = DatabaseConnection.get_connection()
    try:
        t_id = int(transfer_id)
        decided_by = int(data.decidedBy)
        row = TransferModel.reject_transfer(conn, t_id, decided_by, data.comments)
        return {"success": True, "transfer": dict(row)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.get("/api/categories")
def get_categories():
    conn = DatabaseConnection.get_connection()
    try:
        rows = AssetCategoryModel.get_all_categories(conn)
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/categories")
def create_category(data: CreateCategoryInput):
    conn = DatabaseConnection.get_connection()
    try:
        cat_id = AssetCategoryModel.create_category(
            conn,
            name=data.name,
            parent_id=data.parentId,
            description=data.description,
            depreciation_rate=data.depreciationRate
        )
        return {"success": True, "id": str(cat_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

# ---------------------------------------------------------------------------
# Newly Added API Endpoints (Fulfilling Problem Statement Requirements)
# ---------------------------------------------------------------------------

# Auth Input models
class LoginInput(BaseModel):
    email: str
    password: str

class SignupInput(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str

# Department Input models
class CreateDeptInput(BaseModel):
    name: str
    code: str
    parentId: Optional[int] = None
    headEmployeeId: Optional[int] = None

class UpdateDeptInput(BaseModel):
    name: str
    code: str
    parentId: Optional[int] = None
    headEmployeeId: Optional[int] = None
    isActive: int = 1

# Promotion Input models
class PromoteInput(BaseModel):
    role: str

class UpdateStatusInput(BaseModel):
    isActive: int

# Maintenance Approval & Tech Assignment models
class ApproveRejectTicketInput(BaseModel):
    approverId: str
    comments: Optional[str] = ""
    estimatedCost: Optional[float] = 0.0

class AssignTechInput(BaseModel):
    technician: str

# Audit Cycle Input models
class AuditAssignmentInput(BaseModel):
    auditorId: str
    departmentId: Optional[str] = None
    categoryId: Optional[str] = None

class CreateAuditCycleInput(BaseModel):
    cycleName: str
    startDate: str
    endDate: str
    createdBy: str
    assignments: List[AuditAssignmentInput]

@app.post("/api/auth/login")
def login(data: LoginInput):
    conn = DatabaseConnection.get_connection()
    try:
        emp = EmployeeModel.verify_employee_login(conn, data.email, data.password)
        if not emp:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        
        # Get parent department name
        dept_id = emp["department_id"]
        dept_name = "Unassigned"
        cursor = conn.cursor()
        if dept_id:
            cursor.execute("SELECT name FROM departments WHERE id = ?", (dept_id,))
            row = cursor.fetchone()
            if row:
                dept_name = row["name"]
                
        # Resolve mapped role for frontend
        role = "Employee"
        if emp["role"] == "admin":
            role = "Admin"
        elif emp["role"] == "manager":
            role = "Asset Manager"
        elif emp["role"] == "auditor":
            role = "Asset Manager"
        else:
            # Check if department head
            cursor.execute("SELECT id FROM departments WHERE head_employee_id = ? AND is_active = 1 LIMIT 1", (emp["id"],))
            if cursor.fetchone():
                role = "Department Head"
                
        return {
            "success": True,
            "user": {
                "id": str(emp["id"]),
                "name": f"{emp['first_name']} {emp['last_name']}",
                "email": emp["email"],
                "role": role,
                "department": dept_name
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/auth/signup")
def signup(data: SignupInput):
    conn = DatabaseConnection.get_connection()
    try:
        emp_id = EmployeeModel.create_employee(
            conn,
            first_name=data.firstName,
            last_name=data.lastName,
            email=data.email,
            phone="",
            department_id=None,
            designation="Staff Employee",
            role="employee",
            date_joined=datetime.now().strftime("%Y-%m-%d"),
            password=data.password
        )
        return {"success": True, "id": str(emp_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.get("/api/departments")
def get_departments():
    conn = DatabaseConnection.get_connection()
    try:
        rows = DepartmentModel.list_departments(conn)
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/departments")
def create_department(data: CreateDeptInput):
    conn = DatabaseConnection.get_connection()
    try:
        dept_id = DepartmentModel.create_department(
            conn,
            name=data.name,
            code=data.code,
            parent_id=data.parentId
        )
        # Update head if provided
        if data.headEmployeeId:
            cursor = conn.cursor()
            cursor.execute("UPDATE departments SET head_employee_id = ? WHERE id = ?", (data.headEmployeeId, dept_id))
            conn.commit()
        return {"success": True, "id": str(dept_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.put("/api/departments/{dept_id}")
def update_department(dept_id: str, data: UpdateDeptInput):
    conn = DatabaseConnection.get_connection()
    try:
        d_id = int(dept_id)
        DepartmentModel.update_department(
            conn,
            dept_id=d_id,
            name=data.name,
            code=data.code,
            parent_id=data.parentId,
            head_employee_id=data.headEmployeeId,
            is_active=data.isActive
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/departments/{dept_id}")
def delete_department(dept_id: str):
    conn = DatabaseConnection.get_connection()
    try:
        d_id = int(dept_id)
        DepartmentModel.soft_delete_department(conn, d_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/employees/{emp_id}/promote")
def promote_employee(emp_id: str, data: PromoteInput):
    conn = DatabaseConnection.get_connection()
    try:
        e_id = int(emp_id)
        # Map frontend UI role back to DB roles
        db_role = "employee"
        if data.role == "Admin":
            db_role = "admin"
        elif data.role == "Asset Manager":
            db_role = "manager"
        elif data.role == "Asset Auditor" or data.role == "Auditor":
            db_role = "auditor"
            
        EmployeeModel.promote_employee(conn, e_id, db_role)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.put("/api/employees/{emp_id}/status")
def update_employee_status(emp_id: str, data: UpdateStatusInput):
    conn = DatabaseConnection.get_connection()
    try:
        e_id = int(emp_id)
        cursor = conn.cursor()
        cursor.execute("UPDATE employees SET is_active = ? WHERE id = ?", (data.isActive, e_id))
        conn.commit()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.get("/api/assets/{asset_id}/history")
def get_asset_history(asset_id: str):
    conn = DatabaseConnection.get_connection()
    try:
        a_id = int(asset_id)
        history = AssetModel.get_asset_history(conn, a_id)
        
        # Convert sqlite.Row objects to dicts
        transitions = [dict(t) for t in history["transitions"]]
        allocations = [dict(al) for al in history["allocations"]]
        
        return {
            "success": True,
            "transitions": transitions,
            "allocations": allocations
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/tickets/{ticket_id}/approve")
def approve_ticket(ticket_id: str, data: ApproveRejectTicketInput):
    conn = DatabaseConnection.get_connection()
    try:
        t_id = int(ticket_id)
        approver = int(data.approverId)
        
        # Approve via approval engine service
        ApprovalEngineService.approve_or_reject_request(
            conn,
            request_id=t_id,
            approver_id=approver,
            decision="Approved",
            comments=data.comments or ""
        )
        
        # Also store estimated cost in request
        if data.estimatedCost:
            cursor = conn.cursor()
            cursor.execute("UPDATE maintenance_requests SET estimated_cost = ? WHERE id = ?", (data.estimatedCost, t_id))
            conn.commit()
            
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/tickets/{ticket_id}/reject")
def reject_ticket(ticket_id: str, data: ApproveRejectTicketInput):
    conn = DatabaseConnection.get_connection()
    try:
        t_id = int(ticket_id)
        approver = int(data.approverId)
        
        # Reject via approval engine service
        ApprovalEngineService.approve_or_reject_request(
            conn,
            request_id=t_id,
            approver_id=approver,
            decision="Rejected",
            comments=data.comments or ""
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/tickets/{ticket_id}/assign")
def assign_technician(ticket_id: str, data: AssignTechInput):
    conn = DatabaseConnection.get_connection()
    try:
        t_id = int(ticket_id)
        MaintenanceModel.assign_technician_and_start(conn, t_id, data.technician)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.get("/api/audits/cycles")
def get_audit_cycles():
    conn = DatabaseConnection.get_connection()
    try:
        rows = AuditModel.list_audit_cycles(conn)
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/audits/cycles")
def create_audit_cycle(data: CreateAuditCycleInput):
    conn = DatabaseConnection.get_connection()
    try:
        creator = int(data.createdBy)
        # Parse assignments
        assignments = []
        for assign in data.assignments:
            assignments.append({
                "auditor_id": int(assign.auditorId),
                "department_id": int(assign.departmentId) if assign.departmentId else None,
                "category_id": int(assign.categoryId) if assign.categoryId else None
            })
            
        cycle_id = AuditRunnerService.start_audit_cycle(
            conn,
            cycle_name=data.cycleName,
            start_date=data.startDate,
            end_date=data.endDate,
            creator_id=creator,
            assignments=assignments
        )
        return {"success": True, "id": str(cycle_id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.post("/api/audits/cycles/{cycle_id}/close")
def close_audit_cycle(cycle_id: str):
    conn = DatabaseConnection.get_connection()
    try:
        c_id = int(cycle_id)
        AuditRunnerService.close_and_conclude_audit(conn, c_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
