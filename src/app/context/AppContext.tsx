import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  Allocation,
  Asset,
  AuditEntry,
  Booking,
  Employee,
  MaintenanceTicket,
  Notification,
  Role,
} from "../types";
import { NavKey } from "../data";

// ---------------------------------------------------------------------------
// Seed data (mock backend)
// ---------------------------------------------------------------------------

const EMPLOYEES: Employee[] = [
  { id: "E-01", name: "John Doe", role: "Employee", department: "Engineering" },
  { id: "E-02", name: "Jane Smith", role: "Employee", department: "Design" },
  { id: "E-03", name: "Robert Miller", role: "Asset Manager", department: "Operations" },
  { id: "E-04", name: "Alice Johnson", role: "Admin", department: "Executive" },
  { id: "E-05", name: "David Chen", role: "Department Head", department: "Engineering" },
];

const SEED_ASSETS: Asset[] = [
  { id: "AST-101", assetTag: "AST-101", name: 'MacBook Pro M3 Max 16"', category: "Hardware", status: "Allocated", purchaseValue: 3499, location: "San Francisco HQ" },
  { id: "AST-102", assetTag: "AST-102", name: "Dell XPS 15 9530", category: "Hardware", status: "Available", purchaseValue: 2199, location: "Austin Office" },
  { id: "AST-103", assetTag: "AST-103", name: "Lenovo ThinkPad X1 Carbon", category: "Hardware", status: "Allocated", purchaseValue: 1899, location: "Chicago Depot" },
  { id: "AST-121", assetTag: "AST-121", name: "Tesla Model 3 Long Range", category: "Vehicles", status: "Available", purchaseValue: 44900, location: "San Francisco HQ" },
  { id: "AST-122", assetTag: "AST-122", name: "Ford Transit Cargo Van", category: "Vehicles", status: "Maintenance", purchaseValue: 38200, location: "Austin Office" },
  { id: "AST-140", assetTag: "AST-140", name: "Main Boardroom (Room 5A)", category: "Facilities", status: "Available", purchaseValue: 0, location: "San Francisco HQ" },
  { id: "AST-150", assetTag: "AST-150", name: "Adobe Creative Cloud Suite", category: "Software", status: "Available", purchaseValue: 600, location: "Cloud" },
  { id: "AST-151", assetTag: "AST-151", name: "Standing Desk Pro", category: "Furniture", status: "Available", purchaseValue: 750, location: "San Francisco HQ" },
  { id: "AST-152", assetTag: "AST-152", name: "Ergonomic Chair X", category: "Furniture", status: "Allocated", purchaseValue: 450, location: "Austin Office" },
];

const SEED_ALLOCATIONS: Allocation[] = [
  { id: "AL-1", assetId: "AST-101", employeeId: "E-01", allocatedDate: "2026-01-15", expectedReturnDate: "2026-02-02", status: "Overdue" },
  { id: "AL-2", assetId: "AST-103", employeeId: "E-02", allocatedDate: "2024-05-01", expectedReturnDate: "2024-06-12", status: "Overdue" },
  { id: "AL-3", assetId: "AST-152", employeeId: "E-05", allocatedDate: "2026-06-01", expectedReturnDate: "2026-12-01", status: "Active" },
];

const SEED_BOOKINGS: Booking[] = [
  { id: "BK-1", assetId: "AST-140", requestedBy: "E-04", startDate: "2026-07-12 10:00", endDate: "2026-07-12 11:30", status: "Approved" },
  { id: "BK-2", assetId: "AST-121", requestedBy: "E-03", startDate: "2026-07-12 09:00", endDate: "2026-07-12 18:00", status: "Approved" },
  { id: "BK-3", assetId: "AST-102", requestedBy: "E-02", startDate: "2026-07-13 14:00", endDate: "2026-07-13 16:00", status: "Pending" },
];

const SEED_TICKETS: MaintenanceTicket[] = [
  { id: "MNT-2041", assetId: "AST-122", issue: "Scheduled 20k service + brake inspection", priority: "High", status: "In Progress", reportedBy: "E-03" },
  { id: "MNT-2039", assetId: "AST-140", issue: "Projector lamp replacement", priority: "Medium", status: "Reported", reportedBy: "E-04" },
  { id: "MNT-2033", assetId: "AST-101", issue: "Battery health below 80%", priority: "Low", status: "Resolved", reportedBy: "E-01" },
];

const SEED_NOTIFICATIONS: Notification[] = [
  { id: "N-1", title: "Return Overdue Alert", message: 'Asset "MacBook Pro M3 Max 16"" assigned to John Doe is past its expected return date.', type: "alert", timestamp: "11:00 AM", read: false },
  { id: "N-2", title: "Return Overdue Alert", message: "Jane Smith is overdue to return AST-103 (Lenovo ThinkPad X1 Carbon). Expected 2024-06-12.", type: "alert", timestamp: "09:00 AM", read: false },
  { id: "N-3", title: "Maintenance In Progress", message: "Ford Transit Cargo Van entered scheduled 20k service.", type: "warning", timestamp: "Yesterday", read: false },
  { id: "N-4", title: "Booking Approved", message: "Site Survey Trip with Tesla Model 3 was approved.", type: "success", timestamp: "Yesterday", read: true },
];

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

export const ROLES: Role[] = ["Admin", "Asset Manager", "Department Head", "Employee"];

const NAV_ACCESS: Record<NavKey, Role[]> = {
  dashboard: ["Admin", "Asset Manager", "Department Head", "Employee"],
  assets: ["Admin", "Asset Manager", "Department Head", "Employee"],
  booking: ["Admin", "Asset Manager", "Department Head", "Employee"],
  maintenance: ["Admin", "Asset Manager", "Department Head", "Employee"],
  auditing: ["Admin", "Asset Manager"],
  organization: ["Admin"],
};

export function canAccess(role: Role, nav: NavKey) {
  return NAV_ACCESS[nav].includes(role);
}

// A manager-level role that can approve, audit, and view overdue reports.
export function isManagerial(role: Role) {
  return role === "Admin" || role === "Asset Manager";
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AppState {
  role: Role;
  setRole: (r: Role) => void;
  currentUser: Employee;

  employees: Employee[];
  assets: Asset[];
  allocations: Allocation[];
  bookings: Booking[];
  tickets: MaintenanceTicket[];
  notifications: Notification[];
  auditEntries: AuditEntry[];

  employeeName: (id: string) => string;
  assetName: (id: string) => string;
  assetByTag: (tag: string) => Asset | undefined;

  registerAsset: (a: Omit<Asset, "id">) => void;
  returnAsset: (assetId: string) => void;
  addBooking: (b: Omit<Booking, "id" | "status">) => void;
  setBookingStatus: (id: string, status: Booking["status"]) => void;
  raiseTicket: (t: Omit<MaintenanceTicket, "id" | "status">) => void;
  setTicketStatus: (id: string, status: MaintenanceTicket["status"]) => void;
  logAudit: (e: Omit<AuditEntry, "id" | "time">) => void;
  markAllRead: () => void;
}

const AppContext = createContext<AppState | null>(null);

let seq = 1000;
const nextId = (prefix: string) => `${prefix}-${++seq}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("Admin");
  const [assets, setAssets] = useState<Asset[]>(SEED_ASSETS);
  const [allocations, setAllocations] = useState<Allocation[]>(SEED_ALLOCATIONS);
  const [bookings, setBookings] = useState<Booking[]>(SEED_BOOKINGS);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(SEED_TICKETS);
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  // The signed-in user follows the selected role (for demo/testing).
  const currentUser = useMemo(
    () => EMPLOYEES.find((e) => e.role === role) ?? EMPLOYEES[3],
    [role],
  );

  const value = useMemo<AppState>(() => {
    const employeeName = (id: string) =>
      EMPLOYEES.find((e) => e.id === id)?.name ?? "Unassigned";
    const assetName = (id: string) =>
      assets.find((a) => a.id === id)?.name ?? id;
    const assetByTag = (tag: string) =>
      assets.find((a) => a.assetTag.toLowerCase() === tag.trim().toLowerCase());

    return {
      role,
      setRole,
      currentUser,
      employees: EMPLOYEES,
      assets,
      allocations,
      bookings,
      tickets,
      notifications,
      auditEntries,
      employeeName,
      assetName,
      assetByTag,

      registerAsset: (a) =>
        setAssets((prev) => [{ ...a, id: nextId("AST") }, ...prev]),

      returnAsset: (assetId) => {
        setAssets((prev) =>
          prev.map((a) =>
            a.id === assetId ? { ...a, status: "Available" } : a,
          ),
        );
        setAllocations((prev) =>
          prev.map((al) =>
            al.assetId === assetId && al.status !== "Returned"
              ? { ...al, status: "Returned" }
              : al,
          ),
        );
      },

      addBooking: (b) => {
        // Prevent overlapping approved bookings for the same asset.
        const conflict = bookings.some(
          (x) =>
            x.assetId === b.assetId &&
            x.status !== "Rejected" &&
            b.startDate < x.endDate &&
            x.startDate < b.endDate,
        );
        setBookings((prev) => [
          {
            ...b,
            id: nextId("BK"),
            status: conflict ? "Rejected" : "Pending",
          },
          ...prev,
        ]);
      },

      setBookingStatus: (id, status) =>
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b)),
        ),

      raiseTicket: (t) => {
        setTickets((prev) => [
          { ...t, id: nextId("MNT"), status: "Reported" },
          ...prev,
        ]);
        setAssets((prev) =>
          prev.map((a) =>
            a.id === t.assetId ? { ...a, status: "Maintenance" } : a,
          ),
        );
      },

      setTicketStatus: (id, status) => {
        const ticket = tickets.find((x) => x.id === id);
        setTickets((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status } : x)),
        );
        if (ticket && status === "Resolved") {
          setAssets((as) =>
            as.map((a) =>
              a.id === ticket.assetId && a.status === "Maintenance"
                ? { ...a, status: "Available" }
                : a,
            ),
          );
        }
      },

      logAudit: (e) =>
        setAuditEntries((prev) => [
          {
            ...e,
            id: nextId("AUD"),
            time: new Date().toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          ...prev,
        ]),

      markAllRead: () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    };
  }, [role, currentUser, assets, allocations, bookings, tickets, notifications, auditEntries]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
