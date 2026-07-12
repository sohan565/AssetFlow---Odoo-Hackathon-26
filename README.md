# 🏆 Odoo Hackathon '26 - Virtual Round: AssetFlow

This repository is set up for the **Odoo Hackathon '26 — Virtual Round** for the project **AssetFlow (Enterprise Asset & Resource Management System)**.

---

## 📅 Hackathon Guidelines & Submission Instructions (Team Leader & Members)

### 🚨 Critical Deadlines & Submission
* **Repository Submission**: The team leader must submit this public GitHub repository link in the portal under **“Submit Problem Solution”** before **10:00 AM**.
* **Evaluator Access**: Add your assigned evaluator as a collaborator in this GitHub repository settings (refer to Page 5 of the documentation).
* **Demo Video**: After the coding period ends, submit an open-access demo video link (public or "anyone with the link").
  - Covers only the functional flow of your application.
  - Maximum duration: **5 minutes**.

### 💻 Git & Collaboration Rules
* **Frequency**: All team members are expected to push their code to the repository at least once **every 1 hour** to track progress and synchronize work.
* **Branches**: Your latest and working code must always reside in the **`main`** branch.
* **Commit Ownership**: Every team member must commit their own code. Points will be assigned based on individual commits.
* **Commit Messages**: Write meaningful commit messages explaining clearly what was done.

### 🔗 Reference Documents & Links
* **Process Documentation**: [Hackathon Registration/Virtual Round Process](https://drive.google.com/file/d/1ObaJUCzrLh8naphSDSgi9qh9TOe1YKgz/view?usp=sharing)
* **Full Documentation Folder**: [Google Drive Folder](https://drive.google.com/drive/folders/1vVv97oF6wPrljV9c6j1eBa09kcA_H3hd?usp=sharing)
* **Our Expectations**: [Expectations Document](https://drive.google.com/file/d/1qHbCAjJZUqeNZEGMrSOvu1d7l8qhbTMo/view?usp=sharing)
* **Updates**: Join the Discord server for real-time announcements (refer to Page 5 of the documentation).

---

## 📋 AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is a centralized, role-based Enterprise Resource Planning (ERP) platform designed to simplify, track, allocate, and maintain an organization's physical assets and shared resources. By shifting from manual spreadsheets and paper logs, AssetFlow establishes structured asset lifecycles, booking schedules, conflict-preventing allocations, and transparent audit workflows.

### 🚀 Key Features to Implement

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
