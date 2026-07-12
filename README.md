# AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is a centralized, role-based Enterprise Resource Planning (ERP) platform designed to simplify, track, allocate, and maintain an organization's physical assets and shared resources. By shifting from manual spreadsheets and paper logs, AssetFlow establishes structured asset lifecycles, booking schedules, conflict-preventing allocations, and transparent audit workflows.

## 🚀 Key Features

1. **Login & Role-based Signup**
   - Direct registration of standard Employee accounts.
   - Admin-level promotion to Department Head or Asset Manager.
   - Secure authentication and session validation.

2. **Real-time Operational Dashboard**
   - KPI metrics: Available Assets, Allocated Assets, Active Bookings, Scheduled Maintenance, Pending Transfers, Upcoming Returns.
   - Dedicated indicators highlighting overdue returns.
   - Quick actions to register assets, book resources, and initiate maintenance.

3. **Organizational Master Data Setup (Admin Control)**
   - **Department Management:** Hierarchical tree setup (parent-child relationship), deactivation, and assigning Department Heads.
   - **Asset Category Configuration:** Categorization (Electronics, Vehicles, Furniture) with custom field support (e.g. warranty period for electronics).
   - **Employee Directory:** Internal directory mapping role, status, and department.

4. **Asset Directory & Lifecycle Tracking**
   - Registration with tag generation, serial number, location, cost, condition, and booking capabilities.
   - State transition tracking: `Available`, `Allocated`, `Reserved`, `Under Maintenance`, `Lost`, `Retired`, `Disposed`.
   - Comprehensive audit trails including allocation history and maintenance records per asset.

5. **Conflict-Free Asset Allocation & Transfers**
   - Prevents double-allocation of a single asset with validation rules.
   - Prompts for transfer requests if the asset is currently allocated to another employee.
   - Structured transfer approval workflow (Requested ➔ Approved ➔ Reallocated).
   - Automated flagging of overdue asset returns.

6. **Resource Booking & Overlap Validation**
   - Interactive calendar showing slot reservations for shared assets/spaces (meeting rooms, vehicles, equipment).
   - Validation system to reject double bookings during overlapping time slots.

7. **Maintenance & Repair Workflows**
   - Incident reporting (priority levels, issues, optional images).
   - Sequential approval pipeline: `Pending` ➔ `Approved`/`Rejected` ➔ `Technician Assigned` ➔ `In Progress` ➔ `Resolved`.
   - Dynamic asset state adjustment (auto-flips to `Under Maintenance` upon approval and returns to `Available` on resolution).

8. **Structured Asset Auditing**
   - Audit cycles filtered by department or location.
   - Auditor verification states: `Verified`, `Missing`, `Damaged`.
   - Automatic discrepancy report compilation and automated status flags (e.g., locking cycle marks missing items as `Lost`).

9. **Actionable Reports & Analytics**
   - Heatmaps highlighting resource peak booking times.
   - Analytics showing asset utilization trends, maintenance frequency, and imminent retirements.
   - Exportable reports.

10. **Activity Logging & Notification Center**
    - Live feed for alerts: approvals, reminders, returns, and discrepancies.
    - Global audit logs capturing all actions taken by administrators, managers, and employees.

---

## 👥 User Roles & Permissions

| Feature | Admin | Asset Manager | Department Head | Employee |
| :--- | :---: | :---: | :---: | :---: |
| **Manage Departments / Roles** | ✅ | ❌ | ❌ | ❌ |
| **Register & Categorize Assets** | ✅ | ✅ | ❌ | ❌ |
| **Approve Asset Allocation / Transfers** | ❌ | ✅ | ✅ | ❌ |
| **Perform Audit Cycles** | ✅ | ✅ | ❌ | ❌ |
| **Book Shared Resources** | ✅ | ✅ | ✅ (on behalf) | ✅ |
| **Raise Maintenance Requests** | ✅ | ✅ | ✅ | ✅ |

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, TypeScript
- **Styling**: Modern, responsive Vanilla CSS (custom design system)
- **Icons**: Lucide React
- **Build System**: Vite 8
- **Linter**: Oxlint

---

## ⚙️ Quick Start & Installation

To run this application locally, follow these steps:

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)

### Setup & Run
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Open the browser and visit:
   ```
   http://localhost:5173
   ```

4. Build for production:
   ```bash
   npm run build
   ```
