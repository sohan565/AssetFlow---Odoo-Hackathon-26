# 🏆 Odoo Hackathon '26 - Virtual Round: AssetFlow

This repository is set up for the **Odoo Hackathon '26 — Virtual Round** for the project **AssetFlow (Enterprise Asset & Resource Management System)**.

It consists of a Python FastAPI REST API backend connecting to a local SQLite database, and a Vite + React + Tailwind v4 + shadcn/ui frontend copied and integrated from your desktop design.

---

## 📋 AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is a centralized, role-based Enterprise Resource Planning (ERP) platform designed to simplify, track, allocate, and maintain an organization's physical assets and shared resources. By shifting from manual spreadsheets and paper logs, AssetFlow establishes structured asset lifecycles, booking schedules, conflict-preventing allocations, and transparent audit workflows.

### 🚀 Key Features

1. **Login & Role-based Access**: Custom mock role switcher (Admin, Manager, Dept Head, Employee) to simulate role-based dashboards dynamically.
2. **Real-time Operational Dashboard**: Bento-Grid style cards showing active bookings, overdue returns, total inventory, and area charts of asset value trends.
3. **Organizational Master Data Setup (Admin Control)**: Create departments (with parent-child hierarchy), configure asset categories, and promote employees to managers or department heads.
4. **Asset Directory & Lifecycle Tracking**: Detailed registry with tags, serial numbers, models, and locations. Tracks states: `Available`, `Allocated`, `Reserved`, `Under Maintenance`, `Lost`, `Retired`, `Disposed`.
5. **Conflict-Free Asset Allocation & Transfers**: SQL-level partial unique constraint to prevent double active allocations. Fully implemented transfer workflow (Requested ➔ Approved ➔ Reallocated).
6. **Resource Booking & Overlap Validation**: Reserve rooms, vehicles, or equipment with interval checks to reject overlapping bookings.
7. **Maintenance & Repair Workflows**: Create repair tickets. Once approved, the asset moves to `Under Maintenance`. On completion, it reverts to `Available` and logs costs.
8. **Structured Asset Auditing**: Create audit cycles, assign auditors, scan/log item status (`Verified`, `Missing`, `Damaged`), and compile discrepancy logs. Closing a cycle automatically sets missing items to `Lost`.
9. **Notification Center**: Real-time alerts for overdue returns, booking approvals, and audit discrepancy logs.

---

## 📁 Project Structure

```
hackathon/
├── database/
│   ├── connection.py        # Connection setup (WAL mode, Row factory)
│   ├── schema.py            # SQLite table creations and indexes
│   └── seed.py              # Mock data seeding (Sohan, Gautam, Vansh, Deep, etc.)
├── models/                  # SQLite queries mapped to class-based methods
│   ├── allocation.py
│   ├── asset.py
│   ├── asset_category.py    # Merged Category CRUD
│   ├── audit.py
│   ├── booking.py
│   ├── department.py
│   ├── employee.py
│   ├── maintenance.py
│   ├── notification.py
│   └── transfer.py          # Merged Transfer Workflow
├── services/                # Business services layers (notifications, audit, lifecycle)
├── server.py                # FastAPI REST Server
├── requirements.txt         # Backend Python dependencies
└── frontend/                # Vite + React App
    ├── package.json         # Frontend Node dependencies
    ├── vite.config.ts       # Vite configuration with proxy to server.py
    └── src/
        ├── app/
        │   ├── context/
        │   │   └── AppContext.tsx # Context executing REST API calls
        │   └── components/       # Workspace view components
        └── main.tsx
```

---

## 🛠️ How to Run the Project

Follow these steps to set up and run both the backend and frontend development environments on your machine:

### 1. Backend Setup (Python FastAPI)

1. **Install Dependencies**:
   Navigate to the repository root directory and install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *(Ensure you have `fastapi`, `uvicorn`, `pydantic` installed)*

2. **Initialize and Seed the Database**:
   Run the seed script to reset and populate the database with default departments, assets, and users (**Sohan**, **Gautam**, **Vansh**, **Deep**, and **Eve**):
   ```bash
   python -m database.seed
   ```
   This will output:
   ```
   Database schema successfully initialized.
   Seeding database...
   Database successfully seeded.
   ```

3. **Start the API Server**:
   Run the FastAPI server using Uvicorn:
   ```bash
   python server.py
   ```
   The backend API will start running at [http://127.0.0.1:8000](http://127.0.0.1:8000). You can view the interactive Swagger API documentation playground at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### 2. Frontend Setup (Vite + React)

1. **Install Dependencies**:
   Navigate into the `frontend` folder and run `npm install`:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

2. **Start the Frontend Development Server**:
   Start the dev server:
   ```bash
   npm run dev
   ```
   The application will be accessible at [http://localhost:5173](http://localhost:5173). 

   *Note: Vite's development proxy in `vite.config.ts` is pre-configured to forward all `/api/*` network calls directly to the local FastAPI port (`http://127.0.0.1:8000`), resolving all CORS issues.*

---

## 👥 User Roles & Seed Login Credentials
All users have the default password: **`password123`**

| Employee Code | Name | Role | Email |
| :--- | :--- | :--- | :--- |
| **EMP-0001** | Sohan | Admin | `sohan@company.com` |
| **EMP-0002** | Gautam | Asset Manager | `gautam@company.com` |
| **EMP-0003** | Vansh | Department Head | `vansh@company.com` |
| **EMP-0004** | Deep | Auditor | `deep@company.com` |
| **EMP-0005** | Eve | Staff Employee | `eve@company.com` |
