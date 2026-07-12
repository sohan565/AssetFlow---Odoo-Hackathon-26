# 👥 Team Task Distribution — Odoo Hackathon '26

To meet the requirement that **every team member must commit their own code at least once every hour**, we have divided the project into 4 parallel roles.

---

## 💻 Member 1: Backend & Database Specialist
*Role: Focuses on the core database models, API setup, and server logic.*

### Key Tasks:
1. **Initialize Backend**: Set up a FastAPI server with SQLite and SQLAlchemy/SQLModel.
2. **Database Models**: Code the database tables:
   - `Employee` (Auth & Roles)
   - `Department` (Hierarchy)
   - `AssetCategory` & `Asset` (Directory & Lifecycle)
3. **Data Seeding**: Write a script (`seed.py`) to pre-populate:
   - 1 Admin, 2 Managers, 5 Employees.
   - 3 Departments.
   - Initial asset categories.
4. **Auth & Setup APIs**:
   - `/api/auth/signup` and `/api/auth/login` (JWT token authentication).
   - `/api/admin/departments` (CRUD).
   - `/api/admin/employees/promote` (Role changes).

---

## 🎨 Member 2: Frontend & Design Specialist
*Role: Focuses on the user interface, navigation framework, Tailwind styling, and dashboard view.*

### Key Tasks:
1. **Vite React & Tailwind Setup**: Initialize React with Vite and Tailwind CSS. Setup router.
2. **Global Theme & Layouts**:
   - Create the main Layout (Sidebar, Top Navbar, Notification center).
   - Style a clean Login & Signup page.
3. **Dashboard UI**:
   - Build Dashboard KPI Cards (Assets Available, Allocated, Under Maintenance, etc.).
   - Create the "Overdue Returns Alert" banner.
   - Place "Quick Action" buttons (Register Asset, Book Resource, Raise Repair).
4. **Admin Screens UI**:
   - Build the Organization Setup page with 3 tabs: Departments, Categories, and Employee Directory.

---

## 🔄 Member 3: Core Workflows Developer (Allocations & Bookings)
*Role: Focuses on asset tracking, booking validations, and the transfer workflow.*

### Key Tasks:
1. **Asset Directory UI**: Build the grid displaying all assets, their categories, location, and colored status badges.
2. **Asset Allocation Logic**:
   - Backend: Prevent double allocation. If asset is taken, API blocks it and returns the holder's name.
   - Frontend: Build allocation forms. If blocked, show a "Request Transfer" button.
3. **Transfer Workflow**:
   - API & UI: Request Transfer ➔ Asset Manager / Dept Head approval dashboard ➔ Reallocate.
4. **Resource Booking Screen**:
   - Frontend: Interactive calendar displaying reservations.
   - Backend: **Overlap Check Validator** (Rejects a booking if start/end times collide with an existing reservation).

---

## 📷 Member 4: Advanced Features & Integration (Audits, QR, & AI)
*Role: Focuses on reporting, automated audits, webcam QR scanning, and predictive maintenance.*

### Key Tasks:
1. **Maintenance Management Screen**:
   - UI & API: Raise repair request ➔ Manager Approves (Auto-flips status to `Under Maintenance`) ➔ Technician marks resolved (Auto-flips status back to `Available`).
2. **Audit Cycles Screen**:
   - Create Audit Cycle ➔ Auditor UI to check items as `Verified`, `Missing`, or `Damaged`.
   - Backend: Closing cycle automatically marks confirmed-missing assets as `Lost`.
3. **Webcam QR Code Scanner**:
   - Integrate `html5-qrcode` library in React. Scan generated asset QR codes via webcam to instantly mark them "Verified" in audits.
4. **AI/ML Maintenance Predictor**:
   - Code a local prediction formula (based on asset age, original cost, and past repairs) to display failure risk scores on the manager's screen.
5. **Git Coordination**: Help coordinate git merges on the `main` branch.

---

## 📅 Hour-by-Hour Git Push Sync Schedule

* **Hour 1**: 
  - M1: FastAPI project initialized, sqlite file connected.
  - M2: Vite React initialized, Tailwind configured, routing skeleton built.
  - M3: Asset Directory grid layout designed.
  - M4: Maintenance Request UI designed.
* **Hour 2**:
  - M1: DB tables created, seed script working.
  - M2: Login screen styled and authenticated layout completed.
  - M3: Asset API endpoints connected to directory.
  - M4: Audit cycle DB models and endpoints created.
* **Hour 3**:
  - M1: JWT Signup & Login APIs working.
  - M2: Admin Org Setup tab views completed.
  - M3: Allocation API with "taken" check working.
  - M4: Maintenance approval backend workflow completed.
* **...**
* **Hour 7-8**:
  - All: Merge code to `main` branch, run final tests, record 5-minute demo video.
