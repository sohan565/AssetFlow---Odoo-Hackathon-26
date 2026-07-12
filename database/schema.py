"""
Database schema definition for the Enterprise Asset & Resource Management System.

Defines all tables, constraints, foreign keys, CHECK constraints, and indexes
required by the system. Uses IF NOT EXISTS for idempotent initialization.
"""

from database.connection import get_db


def initialize_database():
    """
    Create all database tables, constraints, and indexes.

    This function is idempotent — it uses CREATE TABLE IF NOT EXISTS and
    CREATE INDEX IF NOT EXISTS so it can be safely called multiple times.

    Tables created:
        - departments: Organizational units with hierarchical support.
        - employees: Personnel records with role-based access levels.
        - asset_categories: Hierarchical classification of assets with depreciation rates.
        - assets: Core asset registry with state-based lifecycle tracking.
        - asset_state_log: Immutable audit trail of asset state transitions.
        - asset_allocations: Tracks which employee/department holds an asset.
        - shared_resources: Bookable shared resources (rooms, equipment, vehicles).
        - resource_bookings: Time-slot bookings for shared resources.
        - maintenance_requests: Maintenance/repair workflow tracking.
        - maintenance_approvals: Multi-level approval chain for maintenance requests.
        - audit_cycles: Periodic audit campaign definitions.
        - audit_assignments: Auditor-to-scope assignments within an audit cycle.
        - audit_findings: Individual audit observations and discrepancies.
        - notifications: In-app notification queue for employees.
    """
    with get_db() as db:
        # Ensure foreign keys are enforced for this connection
        db.execute("PRAGMA foreign_keys=ON;")

        # ── Departments ──────────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS departments (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                name            TEXT    NOT NULL UNIQUE,
                code            TEXT    NOT NULL UNIQUE,
                parent_id       INTEGER,
                head_employee_id INTEGER,
                created_at      TEXT    DEFAULT CURRENT_TIMESTAMP,
                is_active       INTEGER DEFAULT 1,
                FOREIGN KEY (parent_id) REFERENCES departments(id)
            );
        """)

        # ── Employees ────────────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_code   TEXT    NOT NULL UNIQUE,
                first_name      TEXT    NOT NULL,
                last_name       TEXT    NOT NULL,
                email           TEXT    NOT NULL UNIQUE,
                phone           TEXT,
                department_id   INTEGER,
                designation     TEXT,
                role            TEXT    DEFAULT 'employee'
                                        CHECK (role IN ('admin', 'manager', 'employee', 'auditor')),
                date_joined     TEXT    NOT NULL,
                is_active       INTEGER DEFAULT 1,
                created_at      TEXT    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id)
            );
        """)

        # Now that employees table exists, add FK for head_employee_id
        # SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so the FK
        # on departments.head_employee_id is documented but enforced at
        # application level. The column was already created above.

        # ── Asset Categories ─────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS asset_categories (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                name              TEXT    NOT NULL UNIQUE,
                parent_id         INTEGER,
                description       TEXT,
                depreciation_rate REAL    DEFAULT 0.0,
                created_at        TEXT    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES asset_categories(id)
            );
        """)

        # ── Assets ───────────────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS assets (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_tag       TEXT    NOT NULL UNIQUE,
                name            TEXT    NOT NULL,
                category_id     INTEGER,
                department_id   INTEGER,
                serial_number   TEXT    UNIQUE,
                model           TEXT,
                manufacturer    TEXT,
                purchase_date   TEXT,
                purchase_cost   REAL,
                warranty_expiry TEXT,
                current_state   TEXT    NOT NULL DEFAULT 'Available'
                                        CHECK (current_state IN (
                                            'Available', 'Allocated', 'Reserved',
                                            'Under Maintenance', 'Lost', 'Retired', 'Disposed'
                                        )),
                location        TEXT,
                notes           TEXT,
                created_at      TEXT    DEFAULT CURRENT_TIMESTAMP,
                updated_at      TEXT    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id)   REFERENCES asset_categories(id),
                FOREIGN KEY (department_id) REFERENCES departments(id)
            );
        """)

        # ── Asset State Log ──────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS asset_state_log (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id    INTEGER NOT NULL,
                from_state  TEXT,
                to_state    TEXT    NOT NULL,
                changed_by  INTEGER,
                reason      TEXT,
                changed_at  TEXT    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (asset_id)   REFERENCES assets(id),
                FOREIGN KEY (changed_by) REFERENCES employees(id)
            );
        """)

        # ── Asset Allocations ────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS asset_allocations (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id        INTEGER NOT NULL,
                employee_id     INTEGER,
                department_id   INTEGER,
                allocated_by    INTEGER,
                allocated_at    TEXT    DEFAULT CURRENT_TIMESTAMP,
                expected_return TEXT,
                returned_at     TEXT,
                notes           TEXT,
                FOREIGN KEY (asset_id)      REFERENCES assets(id),
                FOREIGN KEY (employee_id)   REFERENCES employees(id),
                FOREIGN KEY (department_id) REFERENCES departments(id),
                FOREIGN KEY (allocated_by)  REFERENCES employees(id)
            );
        """)

        # Partial unique index: only one active (un-returned) allocation per asset
        db.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_allocation
            ON asset_allocations(asset_id) WHERE returned_at IS NULL;
        """)

        # ── Transfer Requests ────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS transfer_requests (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id        INTEGER NOT NULL,
                from_employee_id INTEGER NOT NULL,
                to_employee_id   INTEGER NOT NULL,
                requested_by    INTEGER NOT NULL,
                status          TEXT    DEFAULT 'Pending'
                                        CHECK (status IN ('Pending', 'Approved', 'Rejected')),
                comments        TEXT,
                created_at      TEXT    DEFAULT CURRENT_TIMESTAMP,
                decided_at      TEXT,
                decided_by      INTEGER,
                FOREIGN KEY (asset_id)         REFERENCES assets(id),
                FOREIGN KEY (from_employee_id) REFERENCES employees(id),
                FOREIGN KEY (to_employee_id)   REFERENCES employees(id),
                FOREIGN KEY (requested_by)     REFERENCES employees(id),
                FOREIGN KEY (decided_by)       REFERENCES employees(id)
            );
        """)

        # ── Shared Resources ────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS shared_resources (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                name          TEXT    NOT NULL,
                resource_type TEXT    NOT NULL
                                      CHECK (resource_type IN ('room', 'equipment', 'vehicle')),
                capacity      INTEGER DEFAULT 1,
                location      TEXT,
                is_active     INTEGER DEFAULT 1,
                created_at    TEXT    DEFAULT CURRENT_TIMESTAMP
            );
        """)


        # ── Resource Bookings ────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS resource_bookings (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                resource_id INTEGER,
                booked_by   INTEGER,
                start_time  TEXT    NOT NULL,
                end_time    TEXT    NOT NULL,
                purpose     TEXT,
                status      TEXT    DEFAULT 'Confirmed'
                                    CHECK (status IN ('Confirmed', 'Cancelled', 'Completed')),
                created_at  TEXT    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (resource_id) REFERENCES shared_resources(id),
                FOREIGN KEY (booked_by)   REFERENCES employees(id)
            );
        """)

        # ── Maintenance Requests ─────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS maintenance_requests (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                request_code      TEXT    NOT NULL UNIQUE,
                asset_id          INTEGER,
                requested_by      INTEGER,
                issue_description TEXT    NOT NULL,
                priority          TEXT    DEFAULT 'Medium'
                                          CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
                status            TEXT    DEFAULT 'Pending Approval'
                                          CHECK (status IN (
                                              'Pending Approval', 'Approved', 'Rejected',
                                              'Escalated', 'In Progress', 'On Hold',
                                              'Completed', 'Closed'
                                          )),
                estimated_cost    REAL,
                actual_cost       REAL,
                submitted_at      TEXT    DEFAULT CURRENT_TIMESTAMP,
                resolved_at       TEXT,
                FOREIGN KEY (asset_id)     REFERENCES assets(id),
                FOREIGN KEY (requested_by) REFERENCES employees(id)
            );
        """)

        # ── Maintenance Approvals ────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS maintenance_approvals (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id      INTEGER,
                approver_id     INTEGER,
                decision        TEXT    NOT NULL
                                        CHECK (decision IN ('Approved', 'Rejected', 'Escalated')),
                comments        TEXT,
                decided_at      TEXT    DEFAULT CURRENT_TIMESTAMP,
                approval_level  INTEGER DEFAULT 1,
                FOREIGN KEY (request_id)  REFERENCES maintenance_requests(id),
                FOREIGN KEY (approver_id) REFERENCES employees(id)
            );
        """)

        # ── Audit Cycles ─────────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS audit_cycles (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                cycle_name  TEXT    NOT NULL,
                start_date  TEXT    NOT NULL,
                end_date    TEXT    NOT NULL,
                status      TEXT    DEFAULT 'Planned'
                                    CHECK (status IN ('Planned', 'In Progress', 'Completed')),
                created_by  INTEGER,
                created_at  TEXT    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES employees(id)
            );
        """)

        # ── Audit Assignments ────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS audit_assignments (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                audit_cycle_id  INTEGER,
                auditor_id      INTEGER,
                department_id   INTEGER,
                category_id     INTEGER,
                status          TEXT    DEFAULT 'Assigned'
                                        CHECK (status IN ('Assigned', 'In Progress', 'Completed')),
                FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(id),
                FOREIGN KEY (auditor_id)     REFERENCES employees(id),
                FOREIGN KEY (department_id)  REFERENCES departments(id),
                FOREIGN KEY (category_id)    REFERENCES asset_categories(id)
            );
        """)

        # ── Audit Findings ───────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS audit_findings (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                audit_cycle_id    INTEGER,
                asset_id          INTEGER,
                auditor_id        INTEGER,
                expected_state    TEXT,
                actual_state      TEXT,
                expected_location TEXT,
                actual_location   TEXT,
                discrepancy_type  TEXT
                                  CHECK (discrepancy_type IN (
                                      'State Mismatch', 'Location Mismatch',
                                      'Missing', 'Condition Issue'
                                  ) OR discrepancy_type IS NULL),
                notes             TEXT,
                found_at          TEXT    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(id),
                FOREIGN KEY (asset_id)       REFERENCES assets(id),
                FOREIGN KEY (auditor_id)     REFERENCES employees(id)
            );
        """)

        # ── Notifications ────────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient_id    INTEGER,
                type            TEXT    NOT NULL
                                        CHECK (type IN (
                                            'overdue_return', 'booking_reminder',
                                            'maintenance_update', 'audit_assigned',
                                            'approval_needed'
                                        )),
                title           TEXT    NOT NULL,
                message         TEXT    NOT NULL,
                reference_type  TEXT,
                reference_id    INTEGER,
                is_read         INTEGER DEFAULT 0,
                created_at      TEXT    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recipient_id) REFERENCES employees(id)
            );
        """)

        # ── Indexes ──────────────────────────────────────────────────
        db.execute("CREATE INDEX IF NOT EXISTS idx_assets_state       ON assets(current_state);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_assets_category    ON assets(category_id);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_assets_department  ON assets(department_id);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_allocations_asset  ON asset_allocations(asset_id);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_allocations_employee ON asset_allocations(employee_id);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_bookings_resource_time ON resource_bookings(resource_id, start_time, end_time);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_bookings_status    ON resource_bookings(status);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_maintenance_asset  ON maintenance_requests(asset_id);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_state_log_asset    ON asset_state_log(asset_id);")
        db.execute("CREATE INDEX IF NOT EXISTS idx_transfers_asset    ON transfer_requests(asset_id);")


    print("Database schema initialized successfully.")
