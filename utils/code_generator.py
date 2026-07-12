from datetime import datetime

def generate_asset_tag(conn) -> str:
    """Generates a unique asset tag: AST-YYYY-XXXXX."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM assets")
    count = cursor.fetchone()[0]
    next_num = count + 1
    current_year = datetime.now().year
    return f"AST-{current_year}-{next_num:05d}"

def generate_employee_code(conn) -> str:
    """Generates a unique employee code: EMP-XXXX."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM employees")
    count = cursor.fetchone()[0]
    next_num = count + 1
    return f"EMP-{next_num:04d}"

def generate_maintenance_code(conn) -> str:
    """Generates a unique maintenance request code: MR-YYYY-XXXX."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM maintenance_requests")
    count = cursor.fetchone()[0]
    next_num = count + 1
    current_year = datetime.now().year
    return f"MR-{current_year}-{next_num:04d}"
