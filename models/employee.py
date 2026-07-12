import sqlite3
import hashlib
from utils.code_generator import generate_employee_code

def hash_password(password: str) -> str:
    """Helper function to generate SHA-256 password hash."""
    return hashlib.sha256(password.encode()).hexdigest()

class EmployeeModel:
    @staticmethod
    def create_employee(conn, first_name: str, last_name: str, email: str, phone: str, 
                        department_id: int, designation: str, role: str, date_joined: str, 
                        password: str) -> int:
        """Creates a new employee with a unique employee code and hashed password."""
        cursor = conn.cursor()
        employee_code = generate_employee_code(conn)
        password_hash = hash_password(password)
        try:
            cursor.execute(
                """INSERT INTO employees (employee_code, first_name, last_name, email, phone, 
                   department_id, designation, role, date_joined, password_hash) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (employee_code, first_name, last_name, email, phone, 
                 department_id, designation, role, date_joined, password_hash)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error creating employee: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def get_employee(conn, employee_id: int):
        """Retrieves an employee by database ID."""
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM employees WHERE id = ?", (employee_id,))
        return cursor.fetchone()

    @staticmethod
    def get_employee_by_email(conn, email: str):
        """Retrieves an employee by email."""
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM employees WHERE email = ?", (email,))
        return cursor.fetchone()

    @staticmethod
    def list_employees(conn):
        """Lists all active employees in the system."""
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM employees WHERE is_active = 1")
        return cursor.fetchall()

    @staticmethod
    def update_employee(conn, employee_id: int, first_name: str, last_name: str, email: str, 
                        phone: str, department_id: int, designation: str, role: str, is_active: int = 1):
        """Updates employee information."""
        cursor = conn.cursor()
        try:
            cursor.execute(
                """UPDATE employees 
                   SET first_name = ?, last_name = ?, email = ?, phone = ?, 
                       department_id = ?, designation = ?, role = ?, is_active = ? 
                   WHERE id = ?""",
                (first_name, last_name, email, phone, department_id, designation, role, is_active, employee_id)
            )
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error updating employee: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def promote_employee(conn, employee_id: int, new_role: str):
        """Promotes an employee to a new role (admin, manager, auditor, employee)."""
        cursor = conn.cursor()
        try:
            cursor.execute(
                "UPDATE employees SET role = ? WHERE id = ?",
                (new_role, employee_id)
            )
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error promoting employee: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def verify_employee_login(conn, email: str, password: str):
        """Verifies email and password. Returns employee row if valid, otherwise None."""
        cursor = conn.cursor()
        pass_hash = hash_password(password)
        cursor.execute(
            "SELECT * FROM employees WHERE email = ? AND password_hash = ? AND is_active = 1",
            (email, pass_hash)
        )
        return cursor.fetchone()
