export type UserRole = 'Admin' | 'Asset Manager' | 'Department Head' | 'Employee';

export type AssetStatus = 
  | 'Available' 
  | 'Allocated' 
  | 'Reserved' 
  | 'Under Maintenance' 
  | 'Lost' 
  | 'Retired' 
  | 'Disposed';

export interface Department {
  id: string;
  name: string;
  code: string; // e.g., 'ENG', 'HR'
  headId?: string; // Employee ID of the head
}

export interface Category {
  id: string;
  name: string;
  code: string; // e.g., 'LAP', 'VEH', 'ROM'
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  joinedDate: string;
}

export interface Asset {
  tag: string; // e.g., 'AST-001'
  name: string;
  categoryId: string;
  categoryName?: string;
  serialNumber: string;
  status: AssetStatus;
  location: string;
  purchaseDate: string;
  cost: number;
}

export interface Allocation {
  id: string;
  assetTag: string;
  assetName?: string;
  employeeId: string;
  employeeName?: string;
  allocatedBy: string; // Employee Name/ID who allocated
  allocatedDate: string;
  expectedReturnDate: string;
  returnDate?: string;
  status: 'Active' | 'Returned' | 'Overdue';
  notes?: string;
}

export interface Booking {
  id: string;
  title: string;
  assetTag: string;
  assetName?: string;
  employeeId: string;
  employeeName?: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  purpose: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
}

export interface Maintenance {
  id: string;
  assetTag: string;
  assetName?: string;
  requestedBy: string; // Employee ID
  requesterName?: string;
  description: string;
  status: 'Pending' | 'Approved' | 'In Progress' | 'Resolved';
  cost?: number;
  notes?: string;
  requestDate: string;
  resolutionDate?: string;
}

export interface Audit {
  id: string;
  title: string;
  assignedTo: string; // Employee ID (Auditor)
  auditorName?: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  checkedAssets: Record<string, { status: 'Verified' | 'Missing' | 'Damaged'; notes?: string }>;
  discrepancyReport?: {
    totalChecked: number;
    verified: number;
    missingCount: number;
    damagedCount: number;
    missingTags: string[];
    damagedTags: string[];
    summary: string;
  };
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'alert' | 'success';
}
