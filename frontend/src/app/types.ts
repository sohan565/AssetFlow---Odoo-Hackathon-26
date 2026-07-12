// Core AssetFlow ERP data models (dark bento theme integration).

export type Role = "Admin" | "Asset Manager" | "Department Head" | "Employee";

export type AssetStatus = "Available" | "Allocated" | "Maintenance" | "Retired";
export type AssetCategory =
  | "Hardware"
  | "Software"
  | "Furniture"
  | "Vehicles"
  | "Facilities";

export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  purchaseValue: number;
  location: string;
}

export type AllocationStatus = "Active" | "Returned" | "Overdue";
export interface Allocation {
  id: string;
  assetId: string;
  employeeId: string;
  allocatedDate: string;
  expectedReturnDate: string;
  status: AllocationStatus;
}

export type BookingStatus = "Pending" | "Approved" | "Rejected";
export interface Booking {
  id: string;
  assetId: string;
  requestedBy: string; // employeeId
  startDate: string;
  endDate: string;
  status: BookingStatus;
}

export type NotificationType = "alert" | "warning" | "success";
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

export type TicketStatus = "Reported" | "In Progress" | "Resolved";
export type TicketPriority = "High" | "Medium" | "Low";
export interface MaintenanceTicket {
  id: string;
  assetId: string;
  issue: string;
  priority: TicketPriority;
  status: TicketStatus;
  reportedBy: string; // employeeId
}

export interface Employee {
  id: string;
  name: string;
  role: Role;
  department: string;
}

export interface AuditEntry {
  id: string;
  assetTag: string;
  condition: "Good" | "Damaged" | "Missing";
  note: string;
  auditor: string;
  time: string;
}
