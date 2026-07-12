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
  user: Employee | null;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithBypass: (email: string) => Promise<void>;
  logout: () => void;

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

  registerAsset: (a: Omit<Asset, "id">) => Promise<void>;
  returnAsset: (assetId: string) => Promise<void>;
  addBooking: (b: Omit<Booking, "id" | "status">) => Promise<void>;
  setBookingStatus: (id: string, status: Booking["status"]) => Promise<void>;
  raiseTicket: (t: Omit<MaintenanceTicket, "id" | "status">) => Promise<void>;
  setTicketStatus: (id: string, status: MaintenanceTicket["status"]) => Promise<void>;
  logAudit: (e: Omit<AuditEntry, "id" | "time">) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("Admin");
  const [user, setUser] = useState<Employee | null>(() => {
    const saved = localStorage.getItem("assetflow_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  // Automatically update role when user logs in/changes
  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

  // Load state from backend API
  const fetchData = async () => {
    try {
      const res = await fetch("/api/state", {
        headers: {
          "X-User-Role": role
        }
      });
      if (!res.ok) throw new Error("Failed to fetch state from backend");
      const data = await res.json();
      setEmployees(data.employees || []);
      setAssets(data.assets || []);
      setAllocations(data.allocations || []);
      setBookings(data.bookings || []);
      setTickets(data.tickets || []);
      setNotifications(data.notifications || []);
      setAuditEntries(data.auditEntries || []);
    } catch (err) {
      console.error("Error loading backend state:", err);
    }
  };

  // Run on mount and role/auth change
  useEffect(() => {
    fetchData();
  }, [role, user]);

  // Periodic polling for alerts/notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Background silent sync
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [role, user]);

  // The signed-in user defaults to the authenticated user, but can follow the selected role (for demo/testing).
  const currentUser = useMemo(() => {
    const baseUser = user || (employees.length > 0 ? employees[0] : { id: "1", name: "System User", role: "Employee" as Role, department: "Operations" });
    return {
      ...baseUser,
      role: role
    };
  }, [role, employees, user]);

  const value = useMemo<AppState>(() => {
    const employeeName = (id: string) =>
      employees.find((e) => e.id === id)?.name ?? "Unassigned";
    const assetName = (id: string) =>
      assets.find((a) => a.id === id)?.name ?? id;
    const assetByTag = (tag: string) =>
      assets.find((a) => a.assetTag.toLowerCase() === tag.trim().toLowerCase());

    const loginWithGoogle = async (idToken: string, desiredRole: string) => {
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: idToken, role: desiredRole })
        });
        if (!res.ok) throw new Error("Google Login Failed");
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("assetflow_user", JSON.stringify(data.user));
        }
      } catch (err) {
        console.error(err);
        alert("Failed to authenticate with Google.");
      }
    };

    const loginWithBypass = async (email: string) => {
      try {
        const res = await fetch("/api/auth/bypass", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error("Bypass Login Failed");
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("assetflow_user", JSON.stringify(data.user));
        }
      } catch (err) {
        console.error(err);
        alert("Failed to log in with bypass account.");
      }
    };

    const logout = () => {
      setUser(null);
      localStorage.removeItem("assetflow_user");
    };

    return {
      role,
      setRole,
      currentUser,
      user,
      loginWithGoogle,
      loginWithBypass,
      logout,
      employees,
      assets,
      allocations,
      bookings,
      tickets,
      notifications,
      auditEntries,
      employeeName,
      assetName,
      assetByTag,

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
    };
  }, [role, currentUser, user, employees, assets, allocations, bookings, tickets, notifications, auditEntries]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
