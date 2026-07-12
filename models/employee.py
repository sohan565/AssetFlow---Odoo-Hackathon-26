"""
CRUD operations for the employees table.

Provides functions to create, read, update, and deactivate employee records
in the Enterprise Asset & Resource Management System.
"""

from database.connection import get_db


def create_employee(employee_code, first_name, last_name, email,
                    department_id, date_joined, phone=None,
                    designation=None, role='employee'):
    """
    Create a new employee record.

    Args:
        employee_code: Unique employee code.
        first_name: Employee's first name.
        last_name: Employee's last name.
        email: Unique email address.
        department_id: ID of the department the employee belongs to.
        date_joined: Date the employee joined (ISO format string).
        phone: Optional phone number.
        designation: Optional job designation.
        role: Role - one of 'admin', 'manager', 'employee', 'auditor'.
              Defaults to 'employee'.

    Returns:
        dict: The newly created employee record.
    """
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO employees
               (employee_code, first_name, last_name, email, phone,
                department_id, designation, role, date_joined)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (employee_code, first_name, last_name, email, phone,
             department_id, designation, role, date_joined),
        )
        row = db.execute(
            "SELECT * FROM employees WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return dict(row)


def get_employee(emp_id):
    """
    Retrieve a single employee by ID.

    Args:
        emp_id: The employee ID.

    Returns:
        dict or None: The employee record, or None if not found.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM employees WHERE id = ?", (emp_id,)
        ).fetchone()
        return dict(row) if row else None


def get_all_employees():
    """
    Retrieve all employees.

    Returns:
        list[dict]: A list of all employee records.
    """
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM employees ORDER BY last_name, first_name"
        ).fetchall()
        return [dict(row) for row in rows]


def get_employees_by_department(dept_id):
    """
    Retrieve all employees in a specific department.

    Args:
        dept_id: The department ID.

    Returns:
        list[dict]: Employees belonging to the given department.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM employees
               WHERE department_id = ?
               ORDER BY last_name, first_name""",
            (dept_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_employees_by_role(role):
    """
    Retrieve all employees with a specific role.

    Args:
        role: The role to filter by ('admin', 'manager', 'employee', 'auditor').

    Returns:
        list[dict]: Employees matching the given role.
    """
    with get_db() as db:
        rows = db.execute(
            """SELECT * FROM employees
               WHERE role = ?
               ORDER BY last_name, first_name""",
            (role,),
        ).fetchall()
        return [dict(row) for row in rows]


def update_employee(emp_id, **kwargs):
    """
    Update employee fields.

    Args:
        emp_id: The employee ID to update.
        **kwargs: Column-value pairs to update.

    Returns:
        dict: The updated employee record.

    Raises:
        ValueError: If no fields provided or employee not found.
    """
    if not kwargs:
        raise ValueError("No fields provided for update.")

    allowed = {
        "employee_code", "first_name", "last_name", "email", "phone",
        "department_id", "designation", "role", "date_joined", "is_active",
    }
    invalid = set(kwargs.keys()) - allowed
    if invalid:
        raise ValueError(f"Invalid fields: {invalid}")

    set_clause = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [emp_id]

    with get_db() as db:
        db.execute(
            f"UPDATE employees SET {set_clause} WHERE id = ?", values
        )
        row = db.execute(
            "SELECT * FROM employees WHERE id = ?", (emp_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Employee with id {emp_id} not found.")
        return dict(row)


def deactivate_employee(emp_id):
    """
    Deactivate an employee by setting is_active to 0.

    Args:
        emp_id: The employee ID to deactivate.

    Returns:
        dict: The updated employee record.
    """
    with get_db() as db:
        db.execute(
            "UPDATE employees SET is_active = 0 WHERE id = ?", (emp_id,)
        )
        row = db.execute(
            "SELECT * FROM employees WHERE id = ?", (emp_id,)
        ).fetchone()
        if not row:
            raise ValueError(f"Employee with id {emp_id} not found.")
        return dict(row)
