import sqlite3
from database.connection import DatabaseConnection

# SQL script to build all database tables and indexes
SCHEMA_SQL = """
-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    head_employee_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (head_employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- 2. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    department_id INTEGER,
    designation TEXT,
    role TEXT DEFAULT 'employee',
    date_joined TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CHECK (role IN ('admin', 'manager', 'employee', 'auditor'))
);

-- 3. Asset Categories Table
CREATE TABLE IF NOT EXISTS asset_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    description TEXT,
    depreciation_rate REAL DEFAULT 0.0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES asset_categories(id) ON DELETE SET NULL
);

-- 4. Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_tag TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id INTEGER,
    department_id INTEGER,
    serial_number TEXT UNIQUE,
    model TEXT,
    manufacturer TEXT,
    purchase_date TEXT,
    purchase_cost REAL,
    warranty_expiry TEXT,
    current_state TEXT NOT NULL DEFAULT 'Available',
    location TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CHECK (current_state IN ('Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'))
);

-- 5. Asset State Transition Log Table
CREATE TABLE IF NOT EXISTS asset_state_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    from_state TEXT,
    to_state TEXT NOT NULL,
    changed_by INTEGER,
    reason TEXT,
    changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- 6. Asset Allocations Table
CREATE TABLE IF NOT EXISTS asset_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    employee_id INTEGER,
    department_id INTEGER,
    allocated_by INTEGER,
    allocated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expected_return TEXT,
    returned_at TEXT,
    notes TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (allocated_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- Partial Unique Index to prevent double active allocations of the same asset
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_allocation
ON asset_allocations(asset_id)
WHERE returned_at IS NULL;

-- 6b. Transfer Requests Table
CREATE TABLE IF NOT EXISTS transfer_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    from_employee_id INTEGER NOT NULL,
    to_employee_id INTEGER NOT NULL,
    requested_by INTEGER NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    comments TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    decided_at TEXT,
    decided_by INTEGER,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (from_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (to_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (decided_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- 7. Shared Resources Table
CREATE TABLE IF NOT EXISTS shared_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    capacity INTEGER DEFAULT 1,
    location TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    CHECK (resource_type IN ('room', 'equipment', 'vehicle'))
);

-- 8. Resource Bookings Table
CREATE TABLE IF NOT EXISTS resource_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id INTEGER NOT NULL,
    booked_by INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    purpose TEXT,
    status TEXT DEFAULT 'Confirmed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES shared_resources(id) ON DELETE CASCADE,
    FOREIGN KEY (booked_by) REFERENCES employees(id) ON DELETE SET NULL,
    CHECK (status IN ('Confirmed', 'Cancelled', 'Completed'))
);

-- 9. Maintenance Requests Table
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_code TEXT NOT NULL UNIQUE,
    asset_id INTEGER NOT NULL,
    requested_by INTEGER NOT NULL,
    issue_description TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending Approval',
    estimated_cost REAL,
    actual_cost REAL,
    technician TEXT,
    submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES employees(id) ON DELETE SET NULL,
    CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    CHECK (status IN ('Pending Approval', 'Approved', 'Rejected', 'Escalated', 'In Progress', 'Completed', 'Closed'))
);

-- 10. Maintenance Approvals Table
CREATE TABLE IF NOT EXISTS maintenance_approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    approver_id INTEGER NOT NULL,
    decision TEXT NOT NULL,
    comments TEXT,
    decided_at TEXT DEFAULT CURRENT_TIMESTAMP,
    approval_level INTEGER DEFAULT 1,
    FOREIGN KEY (request_id) REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES employees(id) ON DELETE SET NULL,
    CHECK (decision IN ('Approved', 'Rejected', 'Escalated'))
);

-- 11. Audit Cycles Table
CREATE TABLE IF NOT EXISTS audit_cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT DEFAULT 'Planned',
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL,
    CHECK (status IN ('Planned', 'In Progress', 'Completed'))
);

-- 12. Audit Assignments Table
CREATE TABLE IF NOT EXISTS audit_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_cycle_id INTEGER NOT NULL,
    auditor_id INTEGER NOT NULL,
    department_id INTEGER,
    category_id INTEGER,
    status TEXT DEFAULT 'Assigned',
    FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(id) ON DELETE CASCADE,
    FOREIGN KEY (auditor_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE SET NULL,
    CHECK (status IN ('Assigned', 'In Progress', 'Completed'))
);

-- 13. Audit Findings Table
CREATE TABLE IF NOT EXISTS audit_findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_cycle_id INTEGER NOT NULL,
    asset_id INTEGER NOT NULL,
    auditor_id INTEGER NOT NULL,
    expected_state TEXT NOT NULL,
    actual_state TEXT NOT NULL,
    expected_location TEXT,
    actual_location TEXT,
    discrepancy_type TEXT,
    notes TEXT,
    found_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (auditor_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    reference_type TEXT,
    reference_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES employees(id) ON DELETE CASCADE,
    CHECK (is_read IN (0, 1))
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_assets_state ON assets(current_state);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_assets_department ON assets(department_id);

CREATE INDEX IF NOT EXISTS idx_allocations_asset ON asset_allocations(asset_id);
CREATE INDEX IF NOT EXISTS idx_allocations_employee ON asset_allocations(employee_id);

CREATE INDEX IF NOT EXISTS idx_bookings_resource_time ON resource_bookings(resource_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON resource_bookings(status);

CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance_requests(asset_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_state_log_asset ON asset_state_log(asset_id);
CREATE INDEX IF NOT EXISTS idx_transfers_asset ON transfer_requests(asset_id);
"""

def initialize_database():
    """Drops existing tables and initializes a fresh database schema."""
    conn = DatabaseConnection.get_connection()
    cursor = conn.cursor()
    try:
        # Disable foreign keys temporarily to drop tables
        cursor.execute("PRAGMA foreign_keys = OFF;")
        tables = [
            "departments", "employees", "asset_categories", "assets", 
            "asset_state_log", "asset_allocations", "transfer_requests", 
            "shared_resources", "resource_bookings", "maintenance_requests", 
            "maintenance_approvals", "audit_cycles", "audit_assignments", 
            "audit_findings", "notifications"
        ]
        for table in tables:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
        cursor.execute("PRAGMA foreign_keys = ON;")
        
        # SQLite schema creation
        cursor.executescript(SCHEMA_SQL)
        conn.commit()
        print("Database schema successfully initialized.")
    except sqlite3.Error as e:
        print(f"Error initializing database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    initialize_database()
