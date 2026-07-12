"""
Main entry point for the Enterprise Asset & Resource Management System.

Launches a terminal-based Command Line Interface (CLI) allowing users to
interact with the database, manage assets, schedule bookings, route approvals,
and run audit cycles.
"""

import os
import sys
from datetime import datetime
from tabulate import tabulate

from database.schema import initialize_database
from database.seed import seed_database
from database.connection import get_db

import models.department as department_model
import models.employee as employee_model
import models.asset as asset_model
import models.allocation as allocation_model
import models.booking as booking_model
import models.maintenance as maintenance_model
import models.audit as audit_model
import models.notification as notification_model
import models.asset_category as category_model
import models.transfer as transfer_model

from services import asset_lifecycle, booking_service, approval_engine, audit_runner, notification_service

from utils.validators import validate_email, validate_date, validate_datetime

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header(title):
    print("=" * 60)
    print(f" {title.upper()} ".center(60, "="))
    print("=" * 60)

def print_table(data, headers):
    if not data:
        print("\n[No records found]")
        return
    
    # Format dictionary data as list of lists for tabulate
    table_data = []
    for row in data:
        row_data = []
        for h in headers:
            val = row.get(h, "")
            if isinstance(val, float):
                row_data.append(f"INR {val:,.2f}")
            else:
                row_data.append(val)
        table_data.append(row_data)

    print(tabulate(table_data, headers=headers, tablefmt="grid"))

def get_input(prompt, required=True):
    while True:
        val = input(prompt).strip()
        if required and not val:
            print("[Error] This field is required.")
            continue
        return val if val else None

def get_choice(min_val, max_val):
    while True:
        try:
            choice = int(input("\nEnter choice: "))
            if min_val <= choice <= max_val:
                return choice
            print(f"[Error] Choice must be between {min_val} and {max_val}.")
        except ValueError:
            print("[Error] Please enter a valid number.")

# ─── MENU 1: DASHBOARD ────────────────────────────────────────────────────────

def show_dashboard():
    clear_screen()
    print_header("KPI Dashboard")
    try:
        kpis = notification_service.get_dashboard_kpis()
        print(f"Total Assets:            {kpis['total_assets']}")
        print(f"Overdue Returns:         {kpis['overdue_returns']}")
        print(f"Active Bookings (7d):    {kpis['active_bookings']}")
        print(f"Open Maintenance:        {kpis['open_maintenance']}")
        print(f"Pending Approvals:       {kpis['pending_approvals']}")
        print(f"Audit Discrepancies:     {kpis['recent_audit_discrepancies']}")
        
        print("\n[Assets count by State]")
        for state, count in kpis['assets_by_state'].items():
            print(f"  - {state}: {count}")
            
        print("\n[Department Asset Values]")
        print_table(kpis['department_asset_values'], ['dept_name', 'asset_count', 'total_value'])
    except Exception as e:
        print(f"[Error] Failed to fetch KPIs: {e}")
    input("\nPress Enter to return...")

# ─── MENU 2: ASSET MANAGEMENT ───────────────────────────────────────────────

def manage_assets():
    while True:
        clear_screen()
        print_header("Asset Inventory Management")
        print("1. Register New Asset")
        print("2. View All Assets")
        print("3. Search Asset by Tag/Name")
        print("4. Transition Asset State (Lifecycle)")
        print("5. View Asset State History Timeline")
        print("0. Back")
        
        choice = get_choice(0, 5)
        if choice == 0:
            break
        elif choice == 1:
            register_asset_cli()
        elif choice == 2:
            view_all_assets_cli()
        elif choice == 3:
            search_assets_cli()
        elif choice == 4:
            transition_asset_cli()
        elif choice == 5:
            view_asset_history_cli()

def register_asset_cli():
    print_header("Register New Asset")
    name = get_input("Asset Name (e.g. ThinkPad X1): ")
    
    # Select category
    categories = category_model.get_all_categories()
    print_table(categories, ['id', 'name', 'depreciation_rate'])
    cat_id = int(get_input("Category ID: "))
    
    # Select department
    departments = department_model.get_all_departments()
    print_table(departments, ['id', 'name', 'code'])
    dept_id = get_input("Department ID (Optional, Enter to skip): ", required=False)
    dept_id = int(dept_id) if dept_id else None
    
    serial = get_input("Serial Number (Optional): ", required=False)
    model = get_input("Model (Optional): ", required=False)
    manufacturer = get_input("Manufacturer (Optional): ", required=False)
    purchase_date = get_input("Purchase Date (YYYY-MM-DD, Optional): ", required=False)
    cost = get_input("Purchase Cost (INR, Optional): ", required=False)
    cost = float(cost) if cost else None
    warranty = get_input("Warranty Expiry Date (YYYY-MM-DD, Optional): ", required=False)
    location = get_input("Physical Location (Optional): ", required=False)
    notes = get_input("Notes (Optional): ", required=False)
    
    kwargs = {}
    if serial: kwargs['serial_number'] = serial
    if model: kwargs['model'] = model
    if manufacturer: kwargs['manufacturer'] = manufacturer
    if purchase_date: kwargs['purchase_date'] = purchase_date
    if cost is not None: kwargs['purchase_cost'] = cost
    if warranty: kwargs['warranty_expiry'] = warranty
    if location: kwargs['location'] = location
    if notes: kwargs['notes'] = notes
    
    try:
        new_asset = asset_lifecycle.register_new_asset(name, cat_id, dept_id, **kwargs)
        print(f"\n[Success] Registered successfully as: Tag: {new_asset['asset_tag']} | ID: {new_asset['id']}")
    except Exception as e:
        print(f"\n[Error] Registration failed: {e}")
    input("\nPress Enter to continue...")

def view_all_assets_cli():
    print_header("All Assets")
    try:
        assets = asset_model.get_all_assets()
        print_table(assets, ['id', 'asset_tag', 'name', 'current_state', 'location'])
    except Exception as e:
        print(f"[Error] Failed to fetch assets: {e}")
    input("\nPress Enter to continue...")

def search_assets_cli():
    query = get_input("Enter search query: ")
    try:
        assets = asset_model.search_assets(query)
        print_table(assets, ['id', 'asset_tag', 'name', 'current_state', 'location'])
    except Exception as e:
        print(f"[Error] Search failed: {e}")
    input("\nPress Enter to continue...")

def transition_asset_cli():
    print_header("Transition Asset Lifecycle State")
    asset_id = int(get_input("Asset ID to transition: "))
    
    # Show current state
    target = asset_model.get_asset(asset_id)
    if not target:
        print("[Error] Asset not found.")
        input("\nPress Enter to continue...")
        return
        
    print(f"Current State: {target['current_state']}")
    new_state = get_input("Target State (Available/Allocated/Reserved/Under Maintenance/Lost/Retired/Disposed): ")
    reason = get_input("Reason for state change: ")
    
    try:
        updated = asset_model.transition_state(
            asset_id=asset_id,
            new_state=new_state,
            changed_by=1, # Default Admin
            reason=reason
        )
        print(f"\n[Success] State transitioned to: {updated['current_state']}")
    except Exception as e:
        print(f"\n[Error] Transition rejected: {e}")
    input("\nPress Enter to continue...")

def view_asset_history_cli():
    asset_id = int(get_input("Enter Asset ID: "))
    try:
        history = asset_model.get_state_history(asset_id)
        print_table(history, ['changed_at', 'from_state', 'to_state', 'reason'])
    except Exception as e:
        print(f"[Error] Failed to fetch history: {e}")
    input("\nPress Enter to continue...")

# ─── MENU 3: ALLOCATIONS ──────────────────────────────────────────────────────

def manage_allocations():
    while True:
        clear_screen()
        print_header("Asset Allocation Control")
        print("1. Allocate Asset to Employee")
        print("2. Return Asset")
        print("3. View Active Allocations")
        print("4. View Overdue Returns")
        print("5. Request Asset Transfer")
        print("6. Review & Process Transfers")
        print("0. Back")
        
        choice = get_choice(0, 6)
        if choice == 0:
            break
        elif choice == 1:
            allocate_asset_cli()
        elif choice == 2:
            return_asset_cli()
        elif choice == 3:
            view_active_allocations_cli()
        elif choice == 4:
            view_overdue_returns_cli()
        elif choice == 5:
            request_transfer_cli()
        elif choice == 6:
            review_transfers_cli()

def allocate_asset_cli():
    print_header("Allocate Asset")
    asset_id = int(get_input("Asset ID to allocate: "))
    employee_id = int(get_input("Employee ID: "))
    expected_return = get_input("Expected Return Date (YYYY-MM-DD, Optional): ", required=False)
    
    try:
        res = asset_lifecycle.allocate_to_employee(
            asset_id=asset_id,
            employee_id=employee_id,
            allocated_by=1,
            expected_return=expected_return
        )
        print(f"\n[Success] Allocated successfully. Allocation ID: {res['id']}")
    except Exception as e:
        print(f"\n[Error] Allocation failed: {e}")
    input("\nPress Enter to continue...")

def return_asset_cli():
    print_header("Return Asset")
    allocation_id = int(get_input("Allocation Record ID: "))
    
    try:
        res = asset_lifecycle.return_from_employee(
            allocation_id=allocation_id,
            returned_by=1
        )
        print(f"\n[Success] Asset returned to Available stock.")
    except Exception as e:
        print(f"\n[Error] Return failed: {e}")
    input("\nPress Enter to continue...")

def view_active_allocations_cli():
    print_header("Active Allocations")
    try:
        allocs = allocation_model.get_active_allocations()
        print_table(allocs, ['id', 'asset_id', 'asset_tag', 'employee_name', 'allocated_at', 'expected_return'])
    except Exception as e:
        print(f"[Error] Failed: {e}")
    input("\nPress Enter to continue...")

def view_overdue_returns_cli():
    print_header("Overdue Return Tasks")
    try:
        overdue = allocation_model.get_overdue_allocations()
        print_table(overdue, ['id', 'asset_tag', 'asset_name', 'employee_name', 'expected_return'])
    except Exception as e:
        print(f"[Error] Failed: {e}")
    input("\nPress Enter to continue...")

def request_transfer_cli():
    print_header("Request Asset Transfer")
    asset_id = int(get_input("Asset ID to transfer: "))
    
    target = asset_model.get_asset(asset_id)
    if not target:
        print("[Error] Asset not found.")
        input("\nPress Enter to continue...")
        return
        
    if target['current_state'] != 'Allocated':
        print(f"[Error] Asset is currently '{target['current_state']}'. Transfers are only allowed for active 'Allocated' assets.")
        input("\nPress Enter to continue...")
        return
        
    with get_db() as db:
        row = db.execute("SELECT * FROM asset_allocations WHERE asset_id = ? AND returned_at IS NULL", (asset_id,)).fetchone()
    
    if not row:
        print("[Error] Active allocation details not found in database.")
        input("\nPress Enter to continue...")
        return
        
    alloc = dict(row)
    from_emp_id = alloc['employee_id']
    if not from_emp_id:
        print("[Error] Asset is allocated to a department. Transfers currently only support employee-to-employee transfer.")
        input("\nPress Enter to continue...")
        return
        
    to_emp_id = int(get_input("Target Employee ID (Recipient): "))
    requested_by = int(get_input("Requested By (Employee ID): "))
    
    try:
        req = transfer_model.create_transfer_request(
            asset_id=asset_id,
            from_employee_id=from_emp_id,
            to_employee_id=to_emp_id,
            requested_by=requested_by
        )
        print(f"\n[Success] Transfer request created. Request ID: {req['id']} (Status: Pending)")
    except Exception as e:
        print(f"\n[Error] Failed to request transfer: {e}")
    input("\nPress Enter to continue...")

def review_transfers_cli():
    print_header("Review Pending Transfer Requests")
    try:
        pending = transfer_model.get_pending_transfers()
        if not pending:
            print("\nNo pending transfer requests.")
            input("\nPress Enter to continue...")
            return
            
        print_table(pending, ['id', 'asset_tag', 'asset_name', 'from_employee_name', 'to_employee_name', 'status'])
        
        req_id = int(get_input("\nEnter Transfer Request ID to process (or 0 to back): "))
        if req_id == 0:
            return
            
        decision = get_input("Decision (Approve/Reject): ").lower()
        comments = get_input("Comments (Optional): ", required=False)
        decided_by = int(get_input("Decided By (Employee ID): "))
        
        if decision == 'approve':
            transfer_model.approve_transfer(req_id, decided_by, comments)
            print("\n[Success] Transfer approved and asset reallocated successfully.")
        elif decision == 'reject':
            transfer_model.reject_transfer(req_id, decided_by, comments)
            print("\n[Success] Transfer request rejected.")
        else:
            print("\n[Error] Invalid decision. Use 'approve' or 'reject'.")
    except Exception as e:
        print(f"\n[Error] Failed to process transfer: {e}")
    input("\nPress Enter to continue...")


# ─── MENU 4: RESOURCE BOOKING ─────────────────────────────────────────────────

def manage_bookings():
    while True:
        clear_screen()
        print_header("Shared Resource Bookings")
        print("1. Book Resource Slot")
        print("2. Check Available Slots for Date")
        print("3. View Upcoming Bookings")
        print("4. Cancel Booking")
        print("0. Back")
        
        choice = get_choice(0, 4)
        if choice == 0:
            break
        elif choice == 1:
            book_resource_cli()
        elif choice == 2:
            check_slots_cli()
        elif choice == 3:
            view_bookings_cli()
        elif choice == 4:
            cancel_booking_cli()

def book_resource_cli():
    print_header("Book Resource")
    resources = booking_model.get_all_shared_resources()
    print_table(resources, ['id', 'name', 'resource_type', 'capacity', 'location'])
    
    res_id = int(get_input("Resource ID: "))
    emp_id = int(get_input("Booked By (Employee ID): "))
    date_str = get_input("Booking Date (YYYY-MM-DD): ")
    start_time = get_input("Start Time (HH:MM): ")
    end_time = get_input("End Time (HH:MM): ")
    purpose = get_input("Purpose (Optional): ", required=False)
    
    start_dt = f"{date_str} {start_time}"
    end_dt = f"{date_str} {end_time}"
    
    try:
        res = booking_service.book_resource(
            resource_id=res_id,
            employee_id=emp_id,
            start_time=start_dt,
            end_time=end_dt,
            purpose=purpose
        )
        print(f"\n[Success] Booking confirmed! Booking ID: {res['id']}")
    except Exception as e:
        print(f"\n[Error] Booking rejected: {e}")
    input("\nPress Enter to continue...")

def check_slots_cli():
    res_id = int(get_input("Resource ID: "))
    date_str = get_input("Date (YYYY-MM-DD): ")
    try:
        slots = booking_service.get_available_slots(res_id, date_str)
        print(f"\nAvailable Slots for {date_str} (Business Hours 09:00 - 18:00):")
        for s in slots:
            print(f"  - {s['start']} to {s['end']}")
    except Exception as e:
        print(f"[Error] Failed: {e}")
    input("\nPress Enter to continue...")

def view_bookings_cli():
    print_header("Upcoming Bookings (Next 24 Hours)")
    try:
        bookings = booking_service.check_upcoming_bookings()
        print_table(bookings, ['id', 'resource_name', 'employee_name', 'start_time', 'end_time', 'purpose'])
    except Exception as e:
        print(f"[Error] Failed: {e}")
    input("\nPress Enter to continue...")

def cancel_booking_cli():
    booking_id = int(get_input("Enter Booking ID to cancel: "))
    try:
        booking_service.cancel_resource_booking(booking_id)
        print("\n[Success] Booking status marked as Cancelled.")
    except Exception as e:
        print(f"[Error] Cancel failed: {e}")
    input("\nPress Enter to continue...")

# ─── MENU 5: MAINTENANCE WORKFLOW ─────────────────────────────────────────────

def manage_maintenance():
    while True:
        clear_screen()
        print_header("Maintenance & Repair Workflows")
        print("1. Submit Repair Request")
        print("2. Approve/Reject Request (Manager Role)")
        print("3. Start Repair Work")
        print("4. Complete Repair Work")
        print("5. View All Requests")
        print("0. Back")
        
        choice = get_choice(0, 5)
        if choice == 0:
            break
        elif choice == 1:
            submit_maint_cli()
        elif choice == 2:
            process_approval_cli()
        elif choice == 3:
            start_maint_cli()
        elif choice == 4:
            complete_maint_cli()
        elif choice == 5:
            view_maint_cli()

def submit_maint_cli():
    print_header("Submit Maintenance Request")
    asset_id = int(get_input("Asset ID needing repair: "))
    requested_by = int(get_input("Requested By (Employee ID): "))
    issue = get_input("Fault Description: ")
    priority = get_input("Priority (Low/Medium/High/Critical): ")
    est_cost = get_input("Estimated Cost (INR, Optional): ", required=False)
    est_cost = float(est_cost) if est_cost else None
    
    try:
        req = approval_engine.submit_request(
            asset_id=asset_id,
            requested_by=requested_by,
            issue_description=issue,
            priority=priority,
            estimated_cost=est_cost
        )
        print(f"\n[Success] Submitted! Request Code: {req['request_code']} (Status: Pending Approval)")
    except Exception as e:
        print(f"\n[Error] Submission failed: {e}")
    input("\nPress Enter to continue...")

def process_approval_cli():
    print_header("Process Approval Request")
    req_id = int(get_input("Maintenance Request ID: "))
    decision = get_input("Decision (Approved/Rejected/Escalated): ")
    comments = get_input("Approver Comments: ")
    
    try:
        req = approval_engine.process_approval(
            request_id=req_id,
            approver_id=3, # Seeded HR Manager (Meera Iyer or Rahul Verma)
            decision=decision,
            comments=comments
        )
        print(f"\n[Success] Decision recorded. Current status: {req['status']}")
    except Exception as e:
        print(f"\n[Error] Approval processing failed: {e}")
    input("\nPress Enter to continue...")

def start_maint_cli():
    req_id = int(get_input("Maintenance Request ID: "))
    try:
        req = approval_engine.begin_work(req_id)
        print(f"\n[Success] Repair work started. Asset transitioned to: Under Maintenance")
    except Exception as e:
        print(f"[Error] Action rejected: {e}")
    input("\nPress Enter to continue...")

def complete_maint_cli():
    req_id = int(get_input("Maintenance Request ID: "))
    cost = float(get_input("Actual Cost (INR): "))
    try:
        req = approval_engine.finish_work(req_id, actual_cost=cost)
        print(f"\n[Success] Repair complete. Asset transitioned back to Available.")
    except Exception as e:
        print(f"[Error] Action failed: {e}")
    input("\nPress Enter to continue...")

def view_maint_cli():
    try:
        reqs = maintenance_model.get_all_maintenance_requests()
        print_table(reqs, ['id', 'request_code', 'asset_id', 'status', 'priority', 'estimated_cost', 'actual_cost'])
    except Exception as e:
        print(f"[Error] Failed: {e}")
    input("\nPress Enter to continue...")

# ─── MENU 6: AUDIT CAMPAIGNS ──────────────────────────────────────────────────

def manage_audits():
    while True:
        clear_screen()
        print_header("Periodic Audit Cycles & Discrepancies")
        print("1. Create Audit Cycle & Assign Auditor")
        print("2. Submit Auditor Inspection Finding")
        print("3. Generate Discrepancy Findings Report")
        print("4. View Active Audit Cycles")
        print("5. Close Audit Cycle (Locks and transitions missing assets)")
        print("0. Back")
        
        choice = get_choice(0, 5)
        if choice == 0:
            break
        elif choice == 1:
            create_audit_cli()
        elif choice == 2:
            submit_finding_cli()
        elif choice == 3:
            generate_audit_report_cli()
        elif choice == 4:
            view_audits_cli()
        elif choice == 5:
            close_audit_cycle_cli()

def create_audit_cli():
    print_header("New Audit Cycle")
    name = get_input("Cycle Name (e.g. Q3 2026 Audit): ")
    start = get_input("Start Date (YYYY-MM-DD): ")
    end = get_input("End Date (YYYY-MM-DD): ")
    auditor_id = int(get_input("Assigned Auditor (Employee ID): "))
    
    try:
        cycle = audit_runner.create_and_assign_audit(
            cycle_name=name,
            start_date=start,
            end_date=end,
            created_by=1,
            assignments=[{'auditor_id': auditor_id}]
        )
        print(f"\n[Success] Audit cycle created. Status: In Progress. Cycle ID: {cycle['cycle']['id']}")
    except Exception as e:
        print(f"[Error] Failed to create: {e}")
    input("\nPress Enter to continue...")

def submit_finding_cli():
    print_header("Auditor Finding Entry")
    cycle_id = int(get_input("Audit Cycle ID: "))
    asset_id = int(get_input("Asset ID Inspected: "))
    auditor_id = int(get_input("Auditor Employee ID: "))
    actual_state = get_input("Actual Lifecycle State (Available/Allocated/etc.): ")
    actual_location = get_input("Actual Physical Location: ")
    notes = get_input("Observation Notes (Optional): ", required=False)
    
    try:
        finding = audit_runner.submit_finding(
            cycle_id=cycle_id,
            asset_id=asset_id,
            auditor_id=auditor_id,
            actual_state=actual_state,
            actual_location=actual_location,
            notes=notes
        )
        print("\n[Success] Inspection logged successfully.")
        if finding['discrepancy_type']:
            print(f"--> DISCREPANCY DETECTED: {finding['discrepancy_type']}")
        else:
            print("--> System expected values matched actual findings perfectly.")
    except Exception as e:
        print(f"[Error] Failed: {e}")
    input("\nPress Enter to continue...")

def generate_audit_report_cli():
    cycle_id = int(get_input("Audit Cycle ID: "))
    try:
        report = audit_runner.generate_discrepancy_report(cycle_id)
        print_header(f"Discrepancy Report: {report['cycle']['cycle_name']}")
        print(f"Status: {report['cycle']['status']} | Total Inspected: {report['total_audited']}")
        print(f"Total Discrepancies flagged: {report['total_discrepancies']}\n")
        
        print_table(report['findings'], ['asset_tag', 'asset_name', 'expected_state', 'actual_state', 'expected_location', 'actual_location', 'discrepancy_type'])
    except Exception as e:
        print(f"[Error] Failed to generate: {e}")
    input("\nPress Enter to continue...")

def view_audits_cli():
    try:
        cycles = audit_model.get_all_cycles()
        print_table(cycles, ['id', 'cycle_name', 'start_date', 'end_date', 'status'])
    except Exception as e:
        print(f"[Error] Failed: {e}")
    input("\nPress Enter to continue...")

def close_audit_cycle_cli():
    print_header("Close Audit Cycle")
    cycle_id = int(get_input("Enter Audit Cycle ID to close: "))
    try:
        cycle = audit_runner.complete_audit(cycle_id)
        print(f"\n[Success] Audit cycle '{cycle['cycle_name']}' closed successfully.")
        print("Affected missing assets have been automatically transitioned to 'Lost'.")
    except Exception as e:
        print(f"\n[Error] Failed to close cycle: {e}")
    input("\nPress Enter to continue...")


# ─── MENU 7: NOTIFICATIONS & SCHEDULERS ───────────────────────────────────────

def manage_notifications():
    while True:
        clear_screen()
        print_header("System Notifications & Alert Dispatcher")
        print("1. View Admin Inbox Notifications")
        print("2. Trigger Background Overdue Return scan (Simulate Cron)")
        print("3. Mark all as Read")
        print("0. Back")
        
        choice = get_choice(0, 3)
        if choice == 0:
            break
        elif choice == 1:
            view_notifs_cli()
        elif choice == 2:
            run_cron_checks_cli()
        elif choice == 3:
            mark_all_read_cli()

def view_notifs_cli():
    try:
        notifs = notification_model.get_notifications(recipient_id=1)
        print_table(notifs, ['id', 'type', 'title', 'message', 'is_read'])
    except Exception as e:
        print(f"[Error] Failed: {e}")
    input("\nPress Enter to continue...")

def run_cron_checks_cli():
    print("\nScanning allocations, bookings, and repairs for alert triggers...")
    try:
        overdue_notified = notification_service.check_overdue_returns()
        booking_reminders = notification_service.check_upcoming_bookings_reminders()
        stale_maint = notification_service.check_pending_maintenance()
        
        print(f"Scan complete:")
        print(f"  - Overdue returns notified: {len(overdue_notified)}")
        print(f"  - Upcoming booking reminders sent: {len(booking_reminders)}")
        print(f"  - Stale maintenance alerts sent: {len(stale_maint)}")
    except Exception as e:
        print(f"[Error] Scan failed: {e}")
    input("\nPress Enter to continue...")

def mark_all_read_cli():
    try:
        count = notification_model.mark_all_as_read(1)
        print(f"\n[Success] Marked {count} notifications as read.")
    except Exception as e:
        print(f"[Error] Failed: {e}")
    input("\nPress Enter to continue...")


# ─── MAIN LOOP ENTRY ──────────────────────────────────────────────────────────

def setup_db():
    print("Setting up system SQLite database...")
    initialize_database()
    
    # Check if empty, seed if so
    with get_db() as db:
        row = db.execute("SELECT COUNT(*) as count FROM assets").fetchone()
        if row and row['count'] == 0:
            print("DB empty. Seeding sample data...")
            seed_database()
        else:
            print(f"DB initialized. Already populated with {row['count']} assets.")

def main():
    setup_db()
    input("\nSystem ready! Press Enter to launch CLI console...")
    
    while True:
        clear_screen()
        print_header("Enterprise Asset & Resource Management CLI")
        print("1. KPI Dashboard")
        print("2. Asset Inventory Management")
        print("3. Allocation Controls")
        print("4. Shared Resource Bookings")
        print("5. Maintenance Workflow Routing")
        print("6. Audit Campaigns & Reports")
        print("7. Notifications & Scans")
        print("0. Exit Application")
        
        choice = get_choice(0, 7)
        if choice == 0:
            print("\nExiting. Thank you for using AssetFlow.")
            sys.exit(0)
        elif choice == 1:
            show_dashboard()
        elif choice == 2:
            manage_assets()
        elif choice == 3:
            manage_allocations()
        elif choice == 4:
            manage_bookings()
        elif choice == 5:
            manage_maintenance()
        elif choice == 6:
            manage_audits()
        elif choice == 7:
            manage_notifications()

if __name__ == '__main__':
    main()
