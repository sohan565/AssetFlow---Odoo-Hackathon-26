"""
Database seeding module for the Enterprise Asset & Resource Management System.

Populates the database with realistic sample data for development and testing,
including departments, employees, asset categories, assets, allocations,
shared resources, bookings, and maintenance requests.
"""

from database.connection import get_db


def seed_database():
    """
    Populate the database with sample data for all core tables.

    This function inserts realistic sample records including:
        - 4 departments (Engineering, HR, Finance, Operations)
        - 10 employees with varied roles (admin, manager, employee, auditor)
        - 5 asset categories with depreciation rates
        - 15 assets across categories and states
        - 3 shared resources (conference rooms and projector)
        - Sample allocations, bookings, and maintenance requests

    Raises:
        sqlite3.IntegrityError: If seed data conflicts with existing records
            (e.g., duplicate unique codes). This typically means the database
            has already been seeded.
    """
    with get_db() as db:
        db.execute("PRAGMA foreign_keys=ON;")

        # ── Departments ──────────────────────────────────────────────
        departments = [
            ('Engineering', 'ENG', None),
            ('Human Resources', 'HR', None),
            ('Finance', 'FIN', None),
            ('Operations', 'OPS', None),
        ]
        db.executemany(
            "INSERT INTO departments (name, code, parent_id) VALUES (?, ?, ?);",
            departments
        )

        # ── Employees ────────────────────────────────────────────────
        employees = [
            ('EMP001', 'Arjun',   'Sharma',    'arjun.sharma@company.com',
             '+91-9876543210', 1, 'CTO',                'admin',    '2022-01-15'),
            ('EMP002', 'Priya',   'Nair',      'priya.nair@company.com',
             '+91-9876543211', 1, 'Engineering Manager', 'manager',  '2022-03-01'),
            ('EMP003', 'Rahul',   'Verma',     'rahul.verma@company.com',
             '+91-9876543212', 2, 'HR Manager',          'manager',  '2022-02-10'),
            ('EMP004', 'Sneha',   'Patel',     'sneha.patel@company.com',
             '+91-9876543213', 3, 'Financial Analyst',   'employee', '2022-06-20'),
            ('EMP005', 'Vikram',  'Reddy',     'vikram.reddy@company.com',
             '+91-9876543214', 1, 'Software Engineer',   'employee', '2023-01-10'),
            ('EMP006', 'Ananya',  'Gupta',     'ananya.gupta@company.com',
             '+91-9876543215', 4, 'Operations Lead',     'employee', '2022-09-05'),
            ('EMP007', 'Deepak',  'Joshi',     'deepak.joshi@company.com',
             '+91-9876543216', 1, 'DevOps Engineer',     'employee', '2023-04-15'),
            ('EMP008', 'Kavitha', 'Menon',     'kavitha.menon@company.com',
             '+91-9876543217', 3, 'Senior Accountant',   'employee', '2022-07-12'),
            ('EMP009', 'Rohan',   'Das',       'rohan.das@company.com',
             '+91-9876543218', 4, 'Internal Auditor',    'auditor',  '2022-11-01'),
            ('EMP010', 'Meera',   'Iyer',      'meera.iyer@company.com',
             '+91-9876543219', 2, 'HR Executive',        'employee', '2023-08-20'),
        ]
        db.executemany(
            """INSERT INTO employees
               (employee_code, first_name, last_name, email, phone,
                department_id, designation, role, date_joined)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);""",
            employees
        )

        # Update department heads now that employees exist
        db.execute("UPDATE departments SET head_employee_id = 1 WHERE code = 'ENG';")
        db.execute("UPDATE departments SET head_employee_id = 3 WHERE code = 'HR';")
        db.execute("UPDATE departments SET head_employee_id = 4 WHERE code = 'FIN';")
        db.execute("UPDATE departments SET head_employee_id = 6 WHERE code = 'OPS';")

        # ── Asset Categories ─────────────────────────────────────────
        categories = [
            ('Laptops',           None, 'Portable computing devices',       0.25),
            ('Monitors',          None, 'Display screens and panels',       0.20),
            ('Furniture',         None, 'Office desks, chairs, and cabinets', 0.10),
            ('Vehicles',          None, 'Company fleet vehicles',           0.15),
            ('Network Equipment', None, 'Routers, switches, and access points', 0.20),
        ]
        db.executemany(
            """INSERT INTO asset_categories (name, parent_id, description, depreciation_rate)
               VALUES (?, ?, ?, ?);""",
            categories
        )

        # ── Assets ───────────────────────────────────────────────────
        assets = [
            # Laptops (category 1)
            ('AF-0001', 'Dell Latitude 5540',       1, 1, 'SN-DL5540-001', 'Latitude 5540',
             'Dell',     '2023-06-15', 85000.00, '2026-06-15', 'Allocated',         'Eng Lab - Desk 12'),
            ('AF-0002', 'MacBook Pro 14" M3',       1, 1, 'SN-MBP14-002',  'MacBook Pro 14',
             'Apple',    '2024-01-20', 195000.00, '2027-01-20', 'Allocated',        'Eng Lab - Desk 5'),
            ('AF-0003', 'ThinkPad X1 Carbon Gen 11', 1, 2, 'SN-TPX1-003',  'X1 Carbon Gen 11',
             'Lenovo',   '2023-09-10', 120000.00, '2026-09-10', 'Available',        'IT Store Room'),
            ('AF-0004', 'HP EliteBook 840 G10',     1, 3, 'SN-HPE840-004', 'EliteBook 840 G10',
             'HP',       '2023-11-05', 95000.00,  '2026-11-05', 'Available',        'IT Store Room'),
            # Monitors (category 2)
            ('AF-0005', 'Dell UltraSharp U2723QE',  2, 1, 'SN-DU27-005',   'U2723QE',
             'Dell',     '2023-07-01', 45000.00,  '2026-07-01', 'Allocated',        'Eng Lab - Desk 12'),
            ('AF-0006', 'LG 27UK850-W',             2, 4, 'SN-LG27-006',   '27UK850-W',
             'LG',       '2023-08-15', 35000.00,  '2025-08-15', 'Available',        'Operations Bay'),
            ('AF-0007', 'Samsung Odyssey G7 32"',   2, 1, 'SN-SOG7-007',   'Odyssey G7',
             'Samsung',  '2024-02-10', 52000.00,  '2027-02-10', 'Reserved',         'IT Store Room'),
            # Furniture (category 3)
            ('AF-0008', 'Herman Miller Aeron Chair', 3, 1, 'SN-HMA-008',   'Aeron',
             'Herman Miller', '2022-12-01', 98000.00, '2032-12-01', 'Allocated',    'Eng Lab - Desk 12'),
            ('AF-0009', 'Standing Desk Pro 72"',    3, 4, 'SN-SDP-009',    'StandDesk Pro',
             'FlexiSpot', '2023-03-20', 42000.00,  '2028-03-20', 'Available',       'Operations Bay'),
            ('AF-0010', 'Filing Cabinet 4-Drawer',  3, 3, 'SN-FC4-010',    'FC-400',
             'Godrej',   '2022-06-10', 12000.00,  '2032-06-10', 'Allocated',        'Finance Wing'),
            # Vehicles (category 4)
            ('AF-0011', 'Toyota Innova Crysta',     4, 4, 'SN-TIC-011',    'Innova Crysta',
             'Toyota',   '2023-04-01', 1850000.00, '2026-04-01', 'Available',       'Basement Parking B1'),
            ('AF-0012', 'Maruti Suzuki Swift Dzire', 4, 4, 'SN-MSD-012',   'Swift Dzire',
             'Maruti',   '2022-08-15', 850000.00,  '2025-08-15', 'Under Maintenance', 'Service Center'),
            # Network Equipment (category 5)
            ('AF-0013', 'Cisco Catalyst 9300 Switch', 5, 1, 'SN-CC93-013', 'Catalyst 9300',
             'Cisco',    '2023-05-10', 325000.00, '2028-05-10', 'Allocated',        'Server Room A'),
            ('AF-0014', 'Ubiquiti UniFi AP',        5, 4, 'SN-UAP-014',    'UniFi UAP-AC-PRO',
             'Ubiquiti', '2023-10-25', 12000.00,  '2026-10-25', 'Allocated',        'Floor 2 Ceiling'),
            ('AF-0015', 'APC Smart-UPS 3000VA',     5, 1, 'SN-APC3K-015',  'SMT3000I',
             'APC',      '2022-11-18', 68000.00,  '2025-11-18', 'Retired',          'Warehouse'),
        ]

        db.executemany(
            """INSERT INTO assets
               (asset_tag, name, category_id, department_id, serial_number, model,
                manufacturer, purchase_date, purchase_cost, warranty_expiry,
                current_state, location)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);""",
            assets
        )

        # ── Asset State Log (initial entries) ────────────────────────
        state_logs = [
            (1,  None,        'Available',         1, 'Initial receipt'),
            (1,  'Available', 'Allocated',         2, 'Allocated to Vikram Reddy'),
            (2,  None,        'Available',         1, 'Initial receipt'),
            (2,  'Available', 'Allocated',         2, 'Allocated to Priya Nair'),
            (12, None,        'Available',         6, 'Initial receipt'),
            (12, 'Available', 'Under Maintenance', 6, 'Scheduled servicing'),
            (15, None,        'Available',         1, 'Initial receipt'),
            (15, 'Available', 'Retired',           1, 'End of life — battery failure'),
        ]
        db.executemany(
            """INSERT INTO asset_state_log
               (asset_id, from_state, to_state, changed_by, reason)
               VALUES (?, ?, ?, ?, ?);""",
            state_logs
        )

        # ── Asset Allocations ────────────────────────────────────────
        allocations = [
            # Active allocations (returned_at IS NULL)
            (1,  5,    1, 2, '2024-01-10', '2025-01-10', None, 'Primary work laptop'),
            (2,  2,    1, 1, '2024-01-20', '2025-06-20', None, 'Manager laptop'),
            (5,  5,    1, 2, '2024-01-10', None,         None, 'External monitor'),
            (8,  5,    1, 2, '2024-01-10', None,         None, 'Ergonomic chair'),
            (10, None, 3, 3, '2023-07-01', None,         None, 'Finance dept filing cabinet'),
            (13, None, 1, 1, '2023-06-01', None,         None, 'Core network switch'),
            (14, None, 4, 6, '2023-11-01', None,         None, 'Wi-Fi access point floor 2'),
            # Past allocation (returned)
            (3,  7,    1, 2, '2023-10-01', '2024-06-01', '2024-05-28', 'Temporary assignment'),
        ]
        db.executemany(
            """INSERT INTO asset_allocations
               (asset_id, employee_id, department_id, allocated_by,
                allocated_at, expected_return, returned_at, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?);""",
            allocations
        )

        # ── Shared Resources ────────────────────────────────────────
        resources = [
            ('Conference Room A', 'room',      20, 'Building 1 - Floor 2'),
            ('Conference Room B', 'room',      10, 'Building 1 - Floor 3'),
            ('Projector',         'equipment',  1, 'IT Store Room'),
        ]
        db.executemany(
            """INSERT INTO shared_resources (name, resource_type, capacity, location)
               VALUES (?, ?, ?, ?);""",
            resources
        )

        # ── Resource Bookings ────────────────────────────────────────
        bookings = [
            (1, 2, '2026-07-14 09:00', '2026-07-14 10:30', 'Sprint planning',      'Confirmed'),
            (1, 3, '2026-07-14 14:00', '2026-07-14 15:00', 'HR policy review',     'Confirmed'),
            (2, 4, '2026-07-15 11:00', '2026-07-15 12:00', 'Budget discussion',    'Confirmed'),
            (3, 5, '2026-07-14 09:00', '2026-07-14 12:00', 'Client demo',          'Confirmed'),
            (1, 6, '2026-07-10 10:00', '2026-07-10 11:00', 'Ops sync-up',          'Completed'),
        ]
        db.executemany(
            """INSERT INTO resource_bookings
               (resource_id, booked_by, start_time, end_time, purpose, status)
               VALUES (?, ?, ?, ?, ?, ?);""",
            bookings
        )

        # ── Maintenance Requests ─────────────────────────────────────
        maintenance = [
            ('MNT-2026-001', 12, 6, 'Engine oil leak detected during routine inspection',
             'High',     'In Progress', 15000.00, None),
            ('MNT-2026-002', 1,  5, 'Laptop keyboard key (Enter) intermittently unresponsive',
             'Medium',   'Pending Approval', 5000.00, None),
            ('MNT-2026-003', 14, 7, 'Wi-Fi AP dropping connections on Floor 2 periodically',
             'Critical', 'Approved', 12000.00, None),
        ]
        db.executemany(
            """INSERT INTO maintenance_requests
               (request_code, asset_id, requested_by, issue_description,
                priority, status, estimated_cost, actual_cost)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?);""",
            maintenance
        )

        # ── Maintenance Approvals ────────────────────────────────────
        approvals = [
            (1, 2, 'Approved',  'Approved — safety critical. Proceed with service center.', 1),
            (3, 1, 'Approved',  'Approved — network reliability is top priority.',          1),
        ]
        db.executemany(
            """INSERT INTO maintenance_approvals
               (request_id, approver_id, decision, comments, approval_level)
               VALUES (?, ?, ?, ?, ?);""",
            approvals
        )

        # ── Notifications ────────────────────────────────────────────
        notifications = [
            (5,  'overdue_return',      'Asset Return Overdue',
             'Your allocated laptop (AF-0001) was expected to be returned by 2025-01-10.',
             'allocation', 1),

            (2,  'maintenance_update',  'Maintenance Request Approved',
             'Your maintenance request MNT-2026-003 for Wi-Fi AP has been approved.',
             'maintenance_request', 3),
            (3,  'approval_needed',     'Maintenance Approval Required',
             'A new maintenance request MNT-2026-002 requires your review.',
             'maintenance_request', 2),
        ]
        db.executemany(
            """INSERT INTO notifications
               (recipient_id, type, title, message, reference_type, reference_id)
               VALUES (?, ?, ?, ?, ?, ?);""",
            notifications
        )

    print("Database seeded with sample data successfully.")


if __name__ == '__main__':
    from database.schema import initialize_database
    initialize_database()
    seed_database()
