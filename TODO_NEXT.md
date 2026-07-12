# 📋 Backend Status & Next Steps Roadmap

This document outlines what has been built for the **AssetFlow** backend, what tasks remain for each member of the team, and how to transition from the CLI test application to a full-stack integrated system.

---

## ✅ What Has Been Done (Python Backend)

We have successfully implemented a complete, modular, offline-first Python backend:
1. **SQLite Connection Manager** (`database/connection.py`): Enables WAL mode and Foreign Keys.
2. **Schema Initializer** (`database/schema.py`): Handles creating 14 tables, indexes, and constraints.
3. **Data Seeder** (`database/seed.py`): Populates departments, employees, categories, assets, and shared booking resources.
4. **All Core Database Models**:
   - `employee.py` (Secure login + promotions)
   - `department.py` (Hierarchical trees)
   - `asset.py` (Registry + lifecycle logs)
   - `allocation.py` (Prevents double allocations)
   - `booking.py` (Time-slot overlap validator)
   - `maintenance.py` (Repairs workflow)
   - `audit.py` (Audit cycles + discrepancy logging)
   - `notification.py` (Action logs & alerts)
5. **Business Logic Services**:
   - `asset_lifecycle.py` (Enforces state machine transitions)
   - `booking_service.py` (Orchestrates bookings + confirms)
   - `approval_engine.py` (Repair approvals + alerts)
   - `audit_runner.py` (Concludes audits + flags missing assets as Lost)
   - `notification_service.py` (Auto-scans for overdue returns)
6. **Command-Line Interface** (`app.py`): Interactive menu-driven console separating options by role for local verification.
7. **Git Configuration** (`.gitignore`): Configured to ignore compiled caches (`__pycache__/`) and the local database file (`enterprise_assets.db`), ensuring only clean code is pushed.

---

## 🛠️ What is Left to Do (Team Tasks)

### 👥 Member 1: SQL/Database Developer
- [ ] **Schema Review**: Review the SQLite definitions in `database/schema.py`. Modify fields if you need to add custom metadata.
- [ ] **Custom Queries**: If the frontend developer needs specific reports (e.g., asset utilization percentages), write specialized SQL queries inside `database/schema.py` and call them in your models.
- [ ] **Reset Database**: Run `python -m database.seed` to clear and re-initialize the database with your edits.

### 🎨 Member 2: Frontend Developer
- [ ] **Initialize React + Tailwind**: Create a `frontend/` folder and set up React with Vite and Tailwind CSS.
- [ ] **Design Interface**: Style the Login, Dashboard grids (using mock stats first), Org setups tabs, and Calendars.
- [ ] **Fetch Data**: Replace mock state with API requests pointing to the backend.

### 📷 Member 4: Advanced Features Developer
- [ ] **Webcam QR Scanner**: Implement a React camera module (using `html5-qrcode` or a similar JS package). When a QR code is scanned, send the value (Asset Tag) to the backend.
- [ ] **Predictive Maintenance UI**: Design a progress bar or gauge showing the "Failure Risk %" for assets.
- [ ] **Video & Presentation**: Script and record the 5-minute functional walkthrough video for the final submission.

### 🐍 You (Leader / Backend Developer) — Transitioning to APIs
To connect your Python code to Member 2's React frontend, you will transition the Python entry point from a CLI console (`app.py`) to a REST API server.

- [ ] **Install API dependencies**:
  ```bash
  pip install fastapi uvicorn pydantic
  ```
- [ ] **Expose API Endpoints**: Wrap your existing model functions in FastAPI routes. For example:
  ```python
  from fastapi import FastAPI, Depends, HTTPException
  from database.connection import DatabaseConnection
  from models.allocation import AllocationModel

  app = FastAPI()

  @app.post("/api/allocations")
  def create_allocation(asset_id: int, employee_id: int, admin_id: int):
      conn = DatabaseConnection.get_connection()
      try:
          alloc_id = AllocationModel.allocate_asset(conn, asset_id, employee_id, None, admin_id)
          return {"success": True, "allocation_id": alloc_id}
      except ValueError as e:
          raise HTTPException(status_code=400, detail=str(e))
      finally:
          conn.close()
  ```
- [ ] **Launch Server**: Run `uvicorn main:app --reload` to start your api server on `http://localhost:8000`.
- [ ] **Verify Swagger Docs**: Open `http://localhost:8000/docs` to test the API directly from the browser. Provide this URL to Member 2 so they know what parameters to send.
