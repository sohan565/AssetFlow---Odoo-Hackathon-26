import sys
from datetime import datetime
from database.connection import DatabaseConnection
from database.schema import initialize_database
from database.seed import seed_database

# Import models
from models.employee import EmployeeModel
from models.department import DepartmentModel
from models.asset import AssetModel
from models.allocation import AllocationModel
from models.booking import BookingModel
from models.maintenance import MaintenanceModel
from models.audit import AuditModel
from models.notification import NotificationModel

# Import services
from services.asset_lifecycle import AssetLifecycleService
from services.booking_service import BookingService
from services.approval_engine import ApprovalEngineService
from services.audit_runner import AuditRunnerService
from services.notification_service import NotificationService

# Global session variables
CURRENT_USER = None  # Stores the currently logged-in employee row dict

def print_header(title):
    print("\n" + "=" * 50)
    print(f" {title.upper()} ".center(50, "="))
    print("=" * 50)

def main_menu():
    global CURRENT_USER
    while True:
        if not CURRENT_USER:
            print_header("AssetFlow ERP - Welcome")
            print("1. Login")
            print("2. Initialize / Reset Database Schema")
            print("3. Seed Database with Mock Data")
            print("4. Exit")
            choice = input("\nEnter choice (1-4): ").strip()
            
            if choice == "1":
                login_screen()
            elif choice == "2":
                initialize_database()
            elif choice == "3":
                seed_database()
            elif choice == "4":
                print("\nExiting. Thank you for using AssetFlow!")
                sys.exit(0)
            else:
                print("\n[!] Invalid choice. Please try again.")
        else:
            role = CURRENT_USER["role"]
            print_header(f"Dashboard - {CURRENT_USER['first_name']} {CURRENT_USER['last_name']} ({role.upper()})")
            
            # Common options for everyone
            print("--- COMMON ACTIONS ---")
            print("1. View My Profile & Unread Notifications")
            print("2. View My Active Allocations")
            print("3. Book Shared Resource (Room/Vehicle/Equipment)")
            print("4. Submit Maintenance/Repair Request")
            
            # Auditor menu
            if role == "auditor":
                print("\n--- AUDITOR ACTIONS ---")
                print("5. Record Audit Finding (Inspect Asset)")
            
            # Manager menu
            elif role == "manager":
                print("\n--- MANAGER ACTIONS ---")
                print("5. Register New Asset")
                print("6. Allocate Asset (Anti-Double-Allocation)")
                print("7. Process Asset Return")
                print("8. View Maintenance Request Queue & Approve/Reject")
                print("9. Setup Audit Cycle & Auditor Assignment")
                print("10. Close Audit Cycle (Auto-mark missing as Lost)")
                print("11. Scan for Overdue Allocations")
            
            # Admin menu
            elif role == "admin":
                print("\n--- ADMIN ACTIONS ---")
                print("5. Create Department")
                print("6. List Departments")
                print("7. View Employee Directory")
                print("8. Promote Employee Role")
                print("9. Initialize / Reset Database Schema")
                print("10. Seed Database with Mock Data")
                
            print("\n0. Logout")
            choice = input("\nEnter choice: ").strip()
            
            if choice == "0":
                CURRENT_USER = None
                print("\nLogged out successfully.")
            else:
                route_user_choice(choice, role)

def login_screen():
    global CURRENT_USER
    print_header("Login Screen")
    email = input("Email: ").strip()
    password = input("Password: ").strip()
    
    conn = DatabaseConnection.get_connection()
    try:
        user = EmployeeModel.verify_employee_login(conn, email, password)
        if user:
            CURRENT_USER = user
            print(f"\n[+] Login successful! Welcome, {user['first_name']} {user['last_name']}.")
            # Load unread notifications
            notifs = NotificationModel.get_unread_notifications(conn, user["id"])
            if notifs:
                print(f"[*] You have {len(notifs)} unread notifications! Check your profile (Option 1).")
        else:
            print("\n[!] Invalid email or password. (Hint: seed first, use 'eve@company.com' with 'password123')")
    finally:
        conn.close()

def route_user_choice(choice, role):
    conn = DatabaseConnection.get_connection()
    try:
        # Common routes
        if choice == "1":
            view_profile(conn)
        elif choice == "2":
            view_my_allocations(conn)
        elif choice == "3":
            book_resource_flow(conn)
        elif choice == "4":
            submit_maintenance_flow(conn)
            
        # Auditor specific route
        elif role == "auditor" and choice == "5":
            record_audit_finding_flow(conn)
            
        # Manager specific routes
        elif role == "manager" and choice == "5":
            register_asset_flow(conn)
        elif role == "manager" and choice == "6":
            allocate_asset_flow(conn)
        elif role == "manager" and choice == "7":
            return_asset_flow(conn)
        elif role == "manager" and choice == "8":
            process_maintenance_flow(conn)
        elif role == "manager" and choice == "9":
            start_audit_flow(conn)
        elif role == "manager" and choice == "10":
            close_audit_flow(conn)
        elif role == "manager" and choice == "11":
            scan_overdue_flow(conn)
            
        # Admin specific routes
        elif role == "admin" and choice == "5":
            create_department_flow(conn)
        elif role == "admin" and choice == "6":
            list_departments_flow(conn)
        elif role == "admin" and choice == "7":
            view_directory_flow(conn)
        elif role == "admin" and choice == "8":
            promote_employee_flow(conn)
        elif role == "admin" and choice == "9":
            initialize_database()
        elif role == "admin" and choice == "10":
            seed_database()
        else:
            print("\n[!] Invalid choice.")
    except Exception as e:
        print(f"\n[!] Error: {e}")
    finally:
        conn.close()

# --- FLOW IMPLEMENTATIONS ---

def view_profile(conn):
    print_header("My Profile")
    print(f"Name: {CURRENT_USER['first_name']} {CURRENT_USER['last_name']}")
    print(f"Code: {CURRENT_USER['employee_code']}")
    print(f"Email: {CURRENT_USER['email']}")
    print(f"Role: {CURRENT_USER['role'].upper()}")
    print(f"Designation: {CURRENT_USER['designation']}")
    
    # Notifications List
    print("\n--- Unread Notifications ---")
    notifs = NotificationModel.get_unread_notifications(conn, CURRENT_USER["id"])
    if not notifs:
        print("No new notifications.")
    else:
        for n in notifs:
            print(f"[{n['created_at']}] {n['title']}: {n['message']}")
        NotificationModel.mark_all_as_read(conn, CURRENT_USER["id"])
        print("\n[*] All notifications marked as read.")

def view_my_allocations(conn):
    print_header("My Active Allocations")
    cursor = conn.cursor()
    cursor.execute(
        """SELECT a.*, ast.name as asset_name, ast.asset_tag 
           FROM asset_allocations a
           JOIN assets ast ON a.asset_id = ast.id
           WHERE a.employee_id = ? AND a.returned_at IS NULL""",
        (CURRENT_USER["id"],)
    )
    rows = cursor.fetchall()
    if not rows:
        print("You currently hold no company assets.")
    else:
        for r in rows:
            due = r["expected_return"] if r["expected_return"] else "No due date"
            print(f"- {r['asset_name']} ({r['asset_tag']}) | Due: {due}")

def book_resource_flow(conn):
    print_header("Book Shared Resource")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM shared_resources WHERE is_active = 1")
    resources = cursor.fetchall()
    
    if not resources:
        print("No shared resources available.")
        return
        
    for r in resources:
        print(f"ID: {r['id']} | {r['name']} ({r['resource_type'].upper()}) | Location: {r['location']}")
        
    res_id = int(input("\nEnter Resource ID to book: "))
    start = input("Start time (YYYY-MM-DD HH:MM:SS): ").strip()
    end = input("End time (YYYY-MM-DD HH:MM:SS): ").strip()
    purpose = input("Purpose of booking: ").strip()
    
    try:
        booking_id = BookingService.book_resource(conn, res_id, CURRENT_USER["id"], start, end, purpose)
        print(f"\n[+] Booking successful! Booking ID: {booking_id}")
    except ValueError as e:
        print(f"\n[!] Booking Rejected: {e}")

def submit_maintenance_flow(conn):
    print_header("Submit Repair Request")
    # Show user's assets so they can choose
    cursor = conn.cursor()
    cursor.execute(
        """SELECT a.id, ast.name, ast.asset_tag 
           FROM asset_allocations a
           JOIN assets ast ON a.asset_id = ast.id
           WHERE a.employee_id = ? AND a.returned_at IS NULL""",
        (CURRENT_USER["id"],)
    )
    assets = cursor.fetchall()
    
    if not assets:
        print("You don't hold any assets. Please enter Asset ID manually if known.")
        asset_id = int(input("Asset ID: "))
    else:
        for r in assets:
            print(f"ID: {r['id']} | {r['name']} ({r['asset_tag']})")
        asset_id = int(input("\nEnter Asset ID to report: "))
        
    desc = input("Describe the issue: ").strip()
    priority = input("Priority (Low, Medium, High, Critical): ").strip()
    cost = float(input("Estimated repair cost (0 if unknown): ") or 0.0)
    
    req_id = ApprovalEngineService.submit_maintenance_request(conn, asset_id, CURRENT_USER["id"], desc, priority, cost)
    print(f"\n[+] Repair request submitted successfully! Request ID: {req_id}")

def record_audit_finding_flow(conn):
    print_header("Auditor Inspect Asset")
    # List active audit cycles
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_cycles WHERE status = 'In Progress'")
    cycles = cursor.fetchall()
    if not cycles:
        print("No active audit cycles in progress. Wait for a Manager to start one.")
        return
        
    for c in cycles:
        print(f"Cycle ID: {c['id']} | Name: {c['cycle_name']}")
    cycle_id = int(input("\nEnter Audit Cycle ID: "))
    
    # Enter asset details
    tag = input("Enter scanned Asset Tag (e.g. AST-2026-00001): ").strip()
    asset = AssetModel.get_asset_by_tag(conn, tag)
    if not asset:
        print("[!] Asset not found.")
        return
        
    print(f"Found Asset: {asset['name']} (Expected State: {asset['current_state']}, Expected Location: {asset['location']})")
    actual_state = input("Actual State (Available, Damaged, Missing): ").strip()
    actual_loc = input("Actual Location: ").strip()
    notes = input("Inspection notes: ").strip()
    
    finding_id = AuditModel.record_audit_finding(conn, cycle_id, asset["id"], CURRENT_USER["id"], actual_state, actual_loc, notes)
    print(f"\n[+] Inspection recorded. Finding ID: {finding_id}")

def register_asset_flow(conn):
    print_header("Register New Asset")
    name = input("Asset Name: ").strip()
    
    # List categories
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM asset_categories")
    cats = cursor.fetchall()
    for c in cats:
        print(f"ID: {c['id']} | Name: {c['name']}")
    cat_id = int(input("Category ID: "))
    
    # List departments
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM departments WHERE is_active = 1")
    depts = cursor.fetchall()
    for d in depts:
        print(f"ID: {d['id']} | Name: {d['name']}")
    dept_id = int(input("Department ID: "))
    
    sn = input("Serial Number: ").strip()
    model = input("Model: ").strip()
    mfr = input("Manufacturer: ").strip()
    p_date = input("Purchase Date (YYYY-MM-DD): ").strip()
    cost = float(input("Purchase Cost: ") or 0.0)
    loc = input("Location: ").strip()
    notes = input("Notes: ").strip()
    
    asset_id = AssetModel.create_asset(conn, name, cat_id, dept_id, sn, model, mfr, p_date, cost, "", loc, notes)
    print(f"\n[+] Asset registered successfully! ID: {asset_id}")

def allocate_asset_flow(conn):
    print_header("Allocate Asset")
    tag = input("Enter Asset Tag to allocate: ").strip()
    asset = AssetModel.get_asset_by_tag(conn, tag)
    if not asset:
        print("[!] Asset not found.")
        return
        
    emp_email = input("Enter recipient employee email: ").strip()
    emp = EmployeeModel.get_employee_by_email(conn, emp_email)
    if not emp:
        print("[!] Employee not found.")
        return
        
    expected_return = input("Expected return date (YYYY-MM-DD, or press enter for indefinite): ").strip() or None
    notes = input("Allocation notes: ").strip()
    
    try:
        alloc_id = AllocationModel.allocate_asset(conn, asset["id"], emp["id"], emp["department_id"], CURRENT_USER["id"], expected_return, notes)
        print(f"\n[+] Allocation completed successfully! ID: {alloc_id}")
    except ValueError as e:
        print(f"\n[!] Allocation Blocked: {e}")

def return_asset_flow(conn):
    print_header("Process Asset Return")
    tag = input("Enter Asset Tag returned: ").strip()
    asset = AssetModel.get_asset_by_tag(conn, tag)
    if not asset:
        print("[!] Asset not found.")
        return
        
    notes = input("Condition / check-in notes: ").strip()
    try:
        AllocationModel.return_asset(conn, asset["id"], notes)
        print("\n[+] Asset return processed successfully. Asset state reverted to Available.")
    except ValueError as e:
        print(f"\n[!] Error: {e}")

def process_maintenance_flow(conn):
    print_header("Maintenance Approval Queue")
    reqs = MaintenanceModel.list_maintenance_requests(conn)
    pending = [r for r in reqs if r["status"] == "Pending Approval"]
    
    if not pending:
        print("No pending maintenance requests requiring approval.")
        return
        
    for p in pending:
        print(f"Req ID: {p['id']} | Code: {p['request_code']} | Asset: {p['asset_name']} | Issue: {p['issue_description']} | Priority: {p['priority']}")
        
    req_id = int(input("\nEnter Request ID to approve/reject: "))
    decision = input("Decision (Approved/Rejected): ").strip()
    comments = input("Comments: ").strip()
    
    try:
        ApprovalEngineService.approve_or_reject_request(conn, req_id, CURRENT_USER["id"], decision, comments)
        print(f"\n[+] Request {decision} successfully.")
    except ValueError as e:
        print(f"\n[!] Error: {e}")

def start_audit_flow(conn):
    print_header("Start Audit Cycle")
    name = input("Audit Cycle Name (e.g. Q3 2026 Audit): ").strip()
    start = input("Start Date (YYYY-MM-DD): ").strip()
    end = input("End Date (YYYY-MM-DD): ").strip()
    
    # Select Auditor
    cursor = conn.cursor()
    cursor.execute("SELECT id, first_name, last_name FROM employees WHERE role = 'auditor'")
    auditors = cursor.fetchall()
    if not auditors:
        print("[!] No employees hold the role of Auditor. Create or promote an auditor first.")
        return
        
    for a in auditors:
        print(f"ID: {a['id']} | Name: {a['first_name']} {a['last_name']}")
    auditor_id = int(input("Select Auditor ID: "))
    
    assignments = [{"auditor_id": auditor_id}]
    cycle_id = AuditRunnerService.start_audit_cycle(conn, name, start, end, CURRENT_USER["id"], assignments)
    print(f"\n[+] Audit cycle initialized and active. Cycle ID: {cycle_id}")
    
    # Shift cycle to 'In Progress' immediately for testing
    cursor.execute("UPDATE audit_cycles SET status = 'In Progress' WHERE id = ?", (cycle_id,))
    conn.commit()

def close_audit_flow(conn):
    print_header("Close Audit Cycle")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM audit_cycles WHERE status = 'In Progress'")
    cycles = cursor.fetchall()
    if not cycles:
        print("No active audit cycles in progress.")
        return
        
    for c in cycles:
        print(f"Cycle ID: {c['id']} | Name: {c['cycle_name']}")
    cycle_id = int(input("\nEnter Cycle ID to close: "))
    
    try:
        AuditRunnerService.close_and_conclude_audit(conn, cycle_id)
        print("\n[+] Audit cycle locked successfully. Any missing assets have been set to 'Lost'.")
        
        # Display discrepancies
        discs = AuditModel.get_audit_discrepancies(conn, cycle_id)
        if discs:
            print("\n--- Discrepancy Report Summary ---")
            for d in discs:
                print(f"- Asset: {d['asset_name']} ({d['asset_tag']}) | Issue: {d['discrepancy_type']} | Notes: {d['notes']}")
    except ValueError as e:
        print(f"\n[!] Error: {e}")

def scan_overdue_flow(conn):
    print_header("Scan Overdue Return Warnings")
    alerts_sent = NotificationService.check_and_notify_overdue_returns(conn)
    print(f"\n[+] Scan completed. Dispatched {alerts_sent} notifications to overdue users and managers.")

def create_department_flow(conn):
    print_header("Create Department")
    name = input("Department Name: ").strip()
    code = input("Short Code (e.g. RND): ").strip()
    
    # List departments for parent selection
    depts = DepartmentModel.list_departments(conn)
    parent_id = None
    if depts:
        print("\n--- Existing Departments (for hierarchy) ---")
        for d in depts:
            print(f"ID: {d['id']} | Name: {d['name']}")
        parent = input("Parent Department ID (or press Enter for none): ").strip()
        if parent:
            parent_id = int(parent)
            
    dept_id = DepartmentModel.create_department(conn, name, code, parent_id)
    print(f"\n[+] Department created successfully! ID: {dept_id}")

def list_departments_flow(conn):
    print_header("Department Directory")
    depts = DepartmentModel.list_departments(conn)
    if not depts:
        print("No departments configured.")
    else:
        for d in depts:
            parent = d["parent_id"] if d["parent_id"] else "None"
            print(f"- Name: {d['name']} | Code: {d['code']} | Parent ID: {parent}")

def view_directory_flow(conn):
    print_header("Employee Directory")
    emps = EmployeeModel.list_employees(conn)
    if not emps:
        print("No employees registered.")
    else:
        for e in emps:
            print(f"- {e['first_name']} {e['last_name']} ({e['employee_code']}) | Email: {e['email']} | Role: {e['role'].upper()}")

def promote_employee_flow(conn):
    print_header("Promote Employee Role")
    email = input("Enter Employee Email: ").strip()
    emp = EmployeeModel.get_employee_by_email(conn, email)
    if not emp:
        print("[!] Employee not found.")
        return
        
    print(f"Current role: {emp['role'].upper()}")
    new_role = input("New Role (admin, manager, employee, auditor): ").strip()
    
    try:
        EmployeeModel.promote_employee(conn, emp["id"], new_role)
        print(f"\n[+] Employee promoted to {new_role.upper()} successfully.")
    except Exception as e:
        print(f"\n[!] Error: {e}")

if __name__ == "__main__":
    main_menu()
