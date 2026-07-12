import sqlite3

class DepartmentModel:
    @staticmethod
    def create_department(conn, name: str, code: str, parent_id: int = None) -> int:
        """Creates a new department. Returns the database row ID."""
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO departments (name, code, parent_id) VALUES (?, ?, ?)",
                (name, code, parent_id)
            )
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            print(f"Error creating department: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def get_department(conn, dept_id: int):
        """Retrieves a single department by its ID."""
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM departments WHERE id = ?", (dept_id,))
        return cursor.fetchone()

    @staticmethod
    def list_departments(conn):
        """Lists all active departments in the organization."""
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM departments WHERE is_active = 1")
        return cursor.fetchall()

    @staticmethod
    def update_department(conn, dept_id: int, name: str, code: str, parent_id: int = None, head_employee_id: int = None, is_active: int = 1):
        """Updates department details."""
        cursor = conn.cursor()
        try:
            cursor.execute(
                """UPDATE departments 
                   SET name = ?, code = ?, parent_id = ?, head_employee_id = ?, is_active = ? 
                   WHERE id = ?""",
                (name, code, parent_id, head_employee_id, is_active, dept_id)
            )
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error updating department: {e}")
            conn.rollback()
            raise e

    @staticmethod
    def soft_delete_department(conn, dept_id: int):
        """Soft deletes a department to protect historical audit trails."""
        cursor = conn.cursor()
        try:
            cursor.execute("UPDATE departments SET is_active = 0 WHERE id = ?", (dept_id,))
            conn.commit()
        except sqlite3.Error as e:
            print(f"Error soft deleting department: {e}")
            conn.rollback()
            raise e
