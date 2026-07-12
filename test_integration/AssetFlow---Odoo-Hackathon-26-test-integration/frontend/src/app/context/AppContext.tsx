import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
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
  Department,
  AuditCycle,
  TransferRequest,
} from "../types";
import { NavKey } from "../data";

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
  reports: ["Admin", "Asset Manager", "Department Head"],
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
  departments: Department[];
  auditCycles: AuditCycle[];
  transfers: TransferRequest[];
  activeSession: Employee | null;

  employeeName: (id: string) => string;
  assetName: (id: string) => string;
  assetByTag: (tag: string) => Asset | undefined;

  login: (email: string, password: string) => Promise<boolean>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;

  createDepartment: (name: string, code: string, parentId?: number, headEmployeeId?: number) => Promise<void>;
  updateDepartment: (id: string, name: string, code: string, parentId?: number, headEmployeeId?: number, isActive?: number) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  createCategory: (name: string, parentId?: number, description?: string, depreciationRate?: number) => Promise<void>;

  promoteEmployee: (id: string, role: string) => Promise<void>;
  toggleEmployeeStatus: (id: string, isActive: number) => Promise<void>;

  registerAsset: (a: Omit<Asset, "id">) => Promise<void>;
  returnAsset: (assetId: string) => Promise<void>;
  allocateAsset: (assetId: string, employeeId: string, expectedReturnDate: string) => Promise<void>;
  addBooking: (b: Omit<Booking, "id" | "status">) => Promise<void>;
  setBookingStatus: (id: string, status: Booking["status"]) => Promise<void>;
  raiseTicket: (t: Omit<MaintenanceTicket, "id" | "status">) => Promise<void>;
  setTicketStatus: (id: string, status: MaintenanceTicket["status"]) => Promise<void>;
  logAudit: (e: Omit<AuditEntry, "id" | "time">) => Promise<void>;
  markAllRead: () => Promise<void>;

  approveTicket: (id: string, approverId: string, comments: string, estimatedCost: number) => Promise<void>;
  rejectTicket: (id: string, approverId: string, comments: string) => Promise<void>;
  assignTechnician: (id: string, technician: string) => Promise<void>;

  createAuditCycle: (cycleName: string, startDate: string, endDate: string, createdBy: string, assignments: any[]) => Promise<void>;
  closeAuditCycle: (id: string) => Promise<void>;

  createTransfer: (assetId: string, fromEmployeeId: string, toEmployeeId: string, requestedBy: string) => Promise<void>;
  approveTransfer: (id: string, decidedBy: string, comments: string) => Promise<void>;
  rejectTransfer: (id: string, decidedBy: string, comments: string) => Promise<void>;

  fetchAssetHistory: (assetId: string) => Promise<{transitions: any[], allocations: any[]}>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("Admin");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [auditCycles, setAuditCycles] = useState<AuditCycle[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [activeSession, setActiveSession] = useState<Employee | null>(null);

  // Load state from backend API
  const fetchData = async () => {
    try {
      const headers: any = {
        "X-User-Role": role
      };
      
      const [stateRes, deptsRes, cyclesRes, transfersRes] = await Promise.all([
        fetch("/api/state", { headers }),
        fetch("/api/departments", { headers }),
        fetch("/api/audits/cycles", { headers }),
        fetch("/api/transfers/pending", { headers })
      ]);
      
      if (!stateRes.ok) throw new Error("Failed to fetch state from backend");
      const stateData = await stateRes.json();
      setEmployees(stateData.employees || []);
      setAssets(stateData.assets || []);
      setAllocations(stateData.allocations || []);
      setBookings(stateData.bookings || []);
      setTickets(stateData.tickets || []);
      setNotifications(stateData.notifications || []);
      setAuditEntries(stateData.auditEntries || []);

      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        setDepartments(deptsData || []);
      }
      if (cyclesRes.ok) {
        const cyclesData = await cyclesRes.json();
        setAuditCycles(cyclesData || []);
      }
      if (transfersRes.ok) {
        const transfersData = await transfersRes.json();
        setTransfers(transfersData || []);
      }
    } catch (err) {
      console.error("Error loading backend state:", err);
    }
  };

  // Run on mount to load session
  useEffect(() => {
    const saved = localStorage.getItem("assetflow_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setActiveSession(parsed);
        setRole(parsed.role);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Run on mount and role change
  useEffect(() => {
    fetchData();
  }, [role]);

  // Periodic polling for alerts/notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Background silent sync
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [role]);

  // The signed-in user follows the active session, or falls back to selected role
  const currentUser = useMemo(() => {
    if (activeSession) {
      return activeSession;
    }
    if (employees.length === 0) {
      return { id: "1", name: "System User", role: role, department: "Operations" };
    }
    return employees.find((e) => e.role === role) ?? employees[0];
  }, [role, employees, activeSession]);

  const value = useMemo<AppState>(() => {
    const employeeName = (id: string) =>
      employees.find((e) => e.id === id)?.name ?? "Unassigned";
    const assetName = (id: string) =>
      assets.find((a) => a.id === id)?.name ?? id;
    const assetByTag = (tag: string) =>
      assets.find((a) => a.assetTag.toLowerCase() === tag.trim().toLowerCase());

    return {
      role,
      setRole,
      currentUser,
      employees,
      assets,
      allocations,
      bookings,
      tickets,
      notifications,
      auditEntries,
      departments,
      auditCycles,
      transfers,
      activeSession,
      employeeName,
      assetName,
      assetByTag,

      login: async (email, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
          if (!res.ok) return false;
          const data = await res.json();
          if (data.success && data.user) {
            setActiveSession(data.user);
            setRole(data.user.role);
            localStorage.setItem("assetflow_session", JSON.stringify(data.user));
            await fetchData();
            return true;
          }
          return false;
        } catch (err) {
          console.error(err);
          return false;
        }
      },

      signup: async (firstName, lastName, email, password) => {
        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email, password })
          });
          return res.ok;
        } catch (err) {
          console.error(err);
          return false;
        }
      },

      logout: () => {
        setActiveSession(null);
        setRole("Employee");
        localStorage.removeItem("assetflow_session");
      },

      createDepartment: async (name, code, parentId, headEmployeeId) => {
        try {
          const res = await fetch("/api/departments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, code, parentId, headEmployeeId })
          });
          if (!res.ok) throw new Error("Failed to create department");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      updateDepartment: async (id, name, code, parentId, headEmployeeId, isActive) => {
        try {
          const res = await fetch(`/api/departments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, code, parentId, headEmployeeId, isActive })
          });
          if (!res.ok) throw new Error("Failed to update department");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      deleteDepartment: async (id) => {
        try {
          const res = await fetch(`/api/departments/${id}`, {
            method: "DELETE"
          });
          if (!res.ok) throw new Error("Failed to soft-delete department");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      createCategory: async (name, parentId, description, depreciationRate) => {
        try {
          const res = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, parentId, description, depreciationRate })
          });
          if (!res.ok) throw new Error("Failed to create category");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      promoteEmployee: async (id, newRole) => {
        try {
          const res = await fetch(`/api/employees/${id}/promote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole })
          });
          if (!res.ok) throw new Error("Failed to promote employee");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      toggleEmployeeStatus: async (id, isActive) => {
        try {
          const res = await fetch(`/api/employees/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive })
          });
          if (!res.ok) throw new Error("Failed to toggle employee status");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      registerAsset: async (a) => {
        try {
          const res = await fetch("/api/assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(a)
          });
          if (!res.ok) throw new Error("Failed to register asset");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      returnAsset: async (assetId) => {
        try {
          const res = await fetch("/api/assets/return", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetId })
          });
          if (!res.ok) throw new Error("Failed to return asset");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      allocateAsset: async (assetId, employeeId, expectedReturnDate) => {
        try {
          const res = await fetch("/api/allocations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetId, employeeId, expectedReturnDate })
          });
          if (!res.ok) throw new Error("Failed to allocate asset");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      addBooking: async (b) => {
        try {
          const res = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(b)
          });
          if (!res.ok) throw new Error("Failed to add booking");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      setBookingStatus: async (id, status) => {
        try {
          const res = await fetch(`/api/bookings/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
          });
          if (!res.ok) throw new Error("Failed to update booking status");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      raiseTicket: async (t) => {
        try {
          const res = await fetch("/api/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(t)
          });
          if (!res.ok) throw new Error("Failed to raise ticket");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      setTicketStatus: async (id, status) => {
        try {
          const res = await fetch(`/api/tickets/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
          });
          if (!res.ok) throw new Error("Failed to update ticket status");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      logAudit: async (e) => {
        try {
          const res = await fetch("/api/audits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(e)
          });
          if (!res.ok) throw new Error("Failed to log audit entry");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      markAllRead: async () => {
        try {
          const res = await fetch("/api/notifications/read-all", {
            method: "POST"
          });
          if (!res.ok) throw new Error("Failed to mark notifications as read");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      approveTicket: async (id, approverId, comments, estimatedCost) => {
        try {
          const res = await fetch(`/api/tickets/${id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ approverId, comments, estimatedCost })
          });
          if (!res.ok) throw new Error("Failed to approve ticket");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      rejectTicket: async (id, approverId, comments) => {
        try {
          const res = await fetch(`/api/tickets/${id}/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ approverId, comments })
          });
          if (!res.ok) throw new Error("Failed to reject ticket");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      assignTechnician: async (id, technician) => {
        try {
          const res = await fetch(`/api/tickets/${id}/assign`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ technician })
          });
          if (!res.ok) throw new Error("Failed to assign technician");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      createAuditCycle: async (cycleName, startDate, endDate, createdBy, assignments) => {
        try {
          const res = await fetch("/api/audits/cycles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cycleName, startDate, endDate, createdBy, assignments })
          });
          if (!res.ok) throw new Error("Failed to create audit cycle");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      closeAuditCycle: async (id) => {
        try {
          const res = await fetch(`/api/audits/cycles/${id}/close`, {
            method: "POST"
          });
          if (!res.ok) throw new Error("Failed to close audit cycle");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      createTransfer: async (assetId, fromEmployeeId, toEmployeeId, requestedBy) => {
        try {
          const res = await fetch("/api/transfers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assetId, fromEmployeeId, toEmployeeId, requestedBy })
          });
          if (!res.ok) throw new Error("Failed to create transfer request");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      approveTransfer: async (id, decidedBy, comments) => {
        try {
          const res = await fetch(`/api/transfers/${id}/approve`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decidedBy, comments })
          });
          if (!res.ok) throw new Error("Failed to approve transfer request");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      rejectTransfer: async (id, decidedBy, comments) => {
        try {
          const res = await fetch(`/api/transfers/${id}/reject`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decidedBy, comments })
          });
          if (!res.ok) throw new Error("Failed to reject transfer request");
          await fetchData();
        } catch (err) {
          console.error(err);
        }
      },

      fetchAssetHistory: async (assetId) => {
        try {
          const res = await fetch(`/api/assets/${assetId}/history`);
          if (!res.ok) throw new Error("Failed to fetch asset history");
          const data = await res.json();
          return {
            transitions: data.transitions || [],
            allocations: data.allocations || []
          };
        } catch (err) {
          console.error(err);
          return { transitions: [], allocations: [] };
        }
      }
    };
  }, [role, currentUser, employees, assets, allocations, bookings, tickets, notifications, auditEntries, departments, auditCycles, transfers, activeSession]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
