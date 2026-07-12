import hashlib
import sqlite3
from database.connection import DatabaseConnection
from database.schema import initialize_database

def hash_password(password: str) -> str:
    """Hashes a password string using SHA-256 for simple offline storage."""
    return hashlib.sha256(password.encode()).hexdigest()

def seed_database():
    """Initializes the database schema and seeds it with mock records."""
    # Ensure database starts fresh
    initialize_database()
    
    conn = DatabaseConnection.get_connection()
    cursor = conn.cursor()
    
    try:
        print("Seeding database...")
        
        # 1. Seed Departments
        departments = [
            ("Engineering", "ENG", None, None),
            ("Human Resources", "HR", None, None),
            ("Operations", "OPS", None, None)
        ]
        cursor.executemany(
            "INSERT INTO departments (name, code, parent_id, head_employee_id) VALUES (?, ?, ?, ?)",
            departments
        )
        
        # 2. Seed Employees
        # Password for all accounts is 'password123'
        pass_hash = hash_password("password123")
        employees = [
            ("EMP-0001", "Alice", "Admin", "alice@company.com", "123456", 1, "IT Admin", "admin", "2026-01-01", pass_hash),
            ("EMP-0002", "Bob", "Manager", "bob@company.com", "234567", 1, "Asset Manager", "manager", "2026-01-05", pass_hash),
            ("EMP-0003", "Charlie", "Depthead", "charlie@company.com", "345678", 1, "Engineering Head", "employee", "2026-01-10", pass_hash),
            ("EMP-0004", "David", "Auditor", "david@company.com", "456789", 3, "Internal Auditor", "auditor", "2026-02-01", pass_hash),
            ("EMP-0005", "Eve", "Staff", "eve@company.com", "567890", 1, "Software Engineer", "employee", "2026-02-15", pass_hash)
        ]
        cursor.executemany(
            """INSERT INTO employees (employee_code, first_name, last_name, email, phone, 
               department_id, designation, role, date_joined, password_hash) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            employees
        )
        
        # Set Charlie as the Department Head of Engineering (Dept ID = 1)
        cursor.execute("UPDATE departments SET head_employee_id = 3 WHERE id = 1")
        
        # 3. Seed Asset Categories
        categories = [
            ("Electronics", None, "Laptops, phones, tablets", 10.0),
            ("Vehicles", None, "Company cars and vans", 15.0),
            ("Furniture", None, "Office desks and chairs", 5.0)
        ]
        cursor.executemany(
            "INSERT INTO asset_categories (name, parent_id, description, depreciation_rate) VALUES (?, ?, ?, ?)",
            categories
        )
        
        # 4. Seed Assets
        assets = [
            ("AST-2026-00001", "Dell Latitude 5540", 1, 1, "SN-DELL-1122", "Latitude 5540", "Dell", "2026-01-15", 1200.0, "2029-01-15", "Available", "Room 401", "Developer laptop"),
            ("AST-2026-00002", "MacBook Pro 16", 1, 1, "SN-APPLE-3344", "MacBook Pro 16", "Apple", "2026-02-01", 2400.0, "2029-02-01", "Allocated", "Room 402", "Manager MacBook"),
            ("AST-2026-00003", "Office Desk", 3, 2, "SN-FURN-5566", "Ergonomic Desk", "Steelcase", "2026-01-10", 450.0, None, "Available", "HR Office", "Desk"),
            ("AST-2026-00004", "ThinkPad T14", 1, 3, "SN-LENOVO-7788", "ThinkPad T14", "Lenovo", "2026-03-01", 1100.0, "2029-03-01", "Under Maintenance", "Repair Lab", "Broken screen")
        ]
        cursor.executemany(
            """INSERT INTO assets (asset_tag, name, category_id, department_id, serial_number, 
               model, manufacturer, purchase_date, purchase_cost, warranty_expiry, 
               current_state, location, notes) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            assets
        )
        
        # Log initial states for these seeded assets
        asset_logs = [
            (1, None, "Available", 1, "Initial creation"),
            (2, None, "Allocated", 2, "Initial allocation"),
            (3, None, "Available", 1, "Initial creation"),
            (4, None, "Under Maintenance", 2, "Reported broken screen")
        ]
        cursor.executemany(
            "INSERT INTO asset_state_log (asset_id, from_state, to_state, changed_by, reason) VALUES (?, ?, ?, ?, ?)",
            asset_logs
        )
        
        # 5. Seed Active Allocations (Associate Macbook Pro to Eve)
        # Macbook is Asset ID 2, Eve is Employee ID 5, Bob (Manager) is Employee ID 2
        cursor.execute(
            """INSERT INTO asset_allocations (asset_id, employee_id, department_id, allocated_by, notes) 
               VALUES (2, 5, 1, 2, 'Assigned to Eve for software development')"""
        )
        
        # 6. Seed Shared Resources
        resources = [
            ("Conference Room A", "room", 1, "1st Floor, East Wing"),
            ("Tesla Model 3", "vehicle", 1, "Parking Lot B"),
            ("Epson Projector #1", "equipment", 1, "Main cupboard")
        ]
        cursor.executemany(
            "INSERT INTO shared_resources (name, resource_type, capacity, location) VALUES (?, ?, ?, ?)",
            resources
        )
        
        conn.commit()
        print("Database successfully seeded.")
        
    except sqlite3.Error as e:
        print(f"Error seeding database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    seed_database()
