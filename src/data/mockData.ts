import type { Department, Category, Employee, Asset, Allocation, Booking, Maintenance, Audit, SystemNotification } from '../services/types';

export const mockDepartments: Department[] = [
  { id: 'dept-1', name: 'Engineering', code: 'ENG', headId: 'emp-3' },
  { id: 'dept-2', name: 'Human Resources', code: 'HR', headId: 'emp-4' },
  { id: 'dept-3', name: 'Finance', code: 'FIN', headId: 'emp-5' },
  { id: 'dept-4', name: 'Operations', code: 'OPS', headId: 'emp-6' }
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Laptops & Workstations', code: 'LAP' },
  { id: 'cat-2', name: 'Company Vehicles', code: 'VEH' },
  { id: 'cat-3', name: 'Conference Rooms', code: 'ROM' },
  { id: 'cat-4', name: 'Testing Devices', code: 'TST' }
];

export const mockEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Alice Johnson',
    email: 'admin@company.com',
    role: 'Admin',
    departmentId: 'dept-1',
    joinedDate: '2023-01-15'
  },
  {
    id: 'emp-2',
    name: 'Robert Miller',
    email: 'manager@company.com',
    role: 'Asset Manager',
    departmentId: 'dept-4',
    joinedDate: '2023-03-22'
  },
  {
    id: 'emp-3',
    name: 'Sarah Chen',
    email: 'sarah.c@company.com',
    role: 'Department Head',
    departmentId: 'dept-1',
    joinedDate: '2022-05-10'
  },
  {
    id: 'emp-4',
    name: 'David Kojo',
    email: 'david.k@company.com',
    role: 'Department Head',
    departmentId: 'dept-2',
    joinedDate: '2022-09-01'
  },
  {
    id: 'emp-5',
    name: 'Elena Rostova',
    email: 'elena.r@company.com',
    role: 'Department Head',
    departmentId: 'dept-3',
    joinedDate: '2023-11-05'
  },
  {
    id: 'emp-6',
    name: 'Marcus Vance',
    email: 'marcus.v@company.com',
    role: 'Department Head',
    departmentId: 'dept-4',
    joinedDate: '2021-02-18'
  },
  {
    id: 'emp-7',
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'Employee',
    departmentId: 'dept-1',
    joinedDate: '2024-02-01'
  },
  {
    id: 'emp-8',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    role: 'Employee',
    departmentId: 'dept-2',
    joinedDate: '2024-04-10'
  },
  {
    id: 'emp-9',
    name: 'Tim Cooker',
    email: 'tim.c@company.com',
    role: 'Employee',
    departmentId: 'dept-1',
    joinedDate: '2024-05-12'
  }
];

export const mockAssets: Asset[] = [
  {
    tag: 'AST-101',
    name: 'MacBook Pro M3 Max 16"',
    categoryId: 'cat-1',
    serialNumber: 'C02F8XYZQ05D',
    status: 'Allocated',
    location: 'San Francisco HQ',
    purchaseDate: '2024-01-20',
    cost: 3499
  },
  {
    tag: 'AST-102',
    name: 'Dell XPS 15 9530',
    categoryId: 'cat-1',
    serialNumber: 'D45G99F2H1K3',
    status: 'Available',
    location: 'San Francisco HQ',
    purchaseDate: '2023-08-11',
    cost: 2199
  },
  {
    tag: 'AST-103',
    name: 'Lenovo ThinkPad X1 Carbon',
    categoryId: 'cat-1',
    serialNumber: 'L38D22S1P902',
    status: 'Allocated',
    location: 'Chicago Branch',
    purchaseDate: '2023-10-05',
    cost: 1899
  },
  {
    tag: 'AST-201',
    name: 'Tesla Model 3 Long Range',
    categoryId: 'cat-2',
    serialNumber: '5YJ3E1EA5LF12345',
    status: 'Reserved',
    location: 'HQ Parking Block B',
    purchaseDate: '2022-06-15',
    cost: 48990
  },
  {
    tag: 'AST-202',
    name: 'Ford Transit Cargo Van',
    categoryId: 'cat-2',
    serialNumber: '1FTYR23Y8HD12345',
    status: 'Under Maintenance',
    location: 'Operations Garage',
    purchaseDate: '2021-04-09',
    cost: 38500
  },
  {
    tag: 'AST-301',
    name: 'Main Boardroom (Room 5A)',
    categoryId: 'cat-3',
    serialNumber: 'RM-5A-CONF',
    status: 'Available',
    location: 'HQ Floor 5',
    purchaseDate: '2020-01-01',
    cost: 15000
  },
  {
    tag: 'AST-302',
    name: 'UX Design Sync Suite',
    categoryId: 'cat-3',
    serialNumber: 'RM-2C-SYNC',
    status: 'Available',
    location: 'HQ Floor 2',
    purchaseDate: '2022-02-02',
    cost: 8500
  },
  {
    tag: 'AST-401',
    name: 'iPhone 15 Pro Max (Testbed)',
    categoryId: 'cat-4',
    serialNumber: 'F12KL4398D98',
    status: 'Available',
    location: 'Engineering Lab B',
    purchaseDate: '2023-11-20',
    cost: 1199
  },
  {
    tag: 'AST-402',
    name: 'Samsung Galaxy S24 Ultra',
    categoryId: 'cat-4',
    serialNumber: 'SM-G998U12345',
    status: 'Lost',
    location: 'Unknown',
    purchaseDate: '2024-03-01',
    cost: 1299
  }
];

export const mockAllocations: Allocation[] = [
  {
    id: 'alc-1',
    assetTag: 'AST-101',
    assetName: 'MacBook Pro M3 Max 16"',
    employeeId: 'emp-7',
    employeeName: 'John Doe',
    allocatedBy: 'Robert Miller',
    allocatedDate: '2024-02-02',
    expectedReturnDate: '2026-02-02',
    status: 'Active',
    notes: 'Primary dev laptop assigned to John.'
  },
  {
    id: 'alc-2',
    assetTag: 'AST-103',
    assetName: 'Lenovo ThinkPad X1 Carbon',
    employeeId: 'emp-8',
    employeeName: 'Jane Smith',
    allocatedBy: 'Robert Miller',
    allocatedDate: '2024-04-12',
    expectedReturnDate: '2024-06-12', // Expired/Overdue return
    status: 'Overdue',
    notes: 'Short term project loan. Overdue returning.'
  }
];

// Helper variables to set up mock booking timestamps dynamically
const getISOStringOffset = (hoursOffset: number) => {
  const date = new Date();
  date.setHours(date.getHours() + hoursOffset);
  return date.toISOString();
};

export const mockBookings: Booking[] = [
  {
    id: 'bkg-1',
    title: 'Q3 Product Strategy Sync',
    assetTag: 'AST-301',
    assetName: 'Main Boardroom (Room 5A)',
    employeeId: 'emp-3',
    employeeName: 'Sarah Chen',
    startTime: getISOStringOffset(1),
    endTime: getISOStringOffset(3),
    purpose: 'Quarterly review with executives.',
    approvedBy: 'Robert Miller',
    status: 'Approved'
  },
  {
    id: 'bkg-2',
    title: 'Site Survey Trip',
    assetTag: 'AST-201',
    assetName: 'Tesla Model 3 Long Range',
    employeeId: 'emp-9',
    employeeName: 'Tim Cooker',
    startTime: getISOStringOffset(4),
    endTime: getISOStringOffset(8),
    purpose: 'Visiting clean energy installation in East Bay.',
    approvedBy: 'Robert Miller',
    status: 'Approved'
  }
];

export const mockMaintenances: Maintenance[] = [
  {
    id: 'mnt-1',
    assetTag: 'AST-202',
    assetName: 'Ford Transit Cargo Van',
    requestedBy: 'emp-6',
    requesterName: 'Marcus Vance',
    description: 'Scheduled transmission checkup and fluid flush.',
    status: 'In Progress',
    cost: 450,
    requestDate: '2026-07-01',
    notes: 'Work ordered at City Motors.'
  },
  {
    id: 'mnt-2',
    assetTag: 'AST-102',
    assetName: 'Dell XPS 15 9530',
    requestedBy: 'emp-7',
    requesterName: 'John Doe',
    description: 'Battery swelling issue. The trackpad is lifting.',
    status: 'Pending',
    requestDate: '2026-07-10',
    notes: 'Needs technician review immediately.'
  }
];

export const mockAudits: Audit[] = [
  {
    id: 'aud-1',
    title: 'Q2 Engineering Lab Check',
    assignedTo: 'emp-2',
    auditorName: 'Robert Miller',
    scheduledDate: '2026-06-15',
    completedDate: '2026-06-16',
    status: 'Completed',
    checkedAssets: {
      'AST-101': { status: 'Verified' },
      'AST-401': { status: 'Verified' },
      'AST-402': { status: 'Missing', notes: 'Auditor could not locate inside Lab B cabinet.' }
    },
    discrepancyReport: {
      totalChecked: 3,
      verified: 2,
      missingCount: 1,
      damagedCount: 0,
      missingTags: ['AST-402'],
      damagedTags: [],
      summary: 'Overall satisfactory. AST-402 (Samsung Galaxy) was flagged missing. Recommend filing a replacement request.'
    }
  },
  {
    id: 'aud-2',
    title: 'Mid-Year HQ Infrastructure Audit',
    assignedTo: 'emp-2',
    auditorName: 'Robert Miller',
    scheduledDate: '2026-07-20',
    status: 'Scheduled',
    checkedAssets: {}
  }
];

export const mockNotifications: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Return Overdue Alert',
    message: 'Jane Smith is overdue to return AST-103 (Lenovo ThinkPad X1 Carbon). Expected return date was 2024-06-12.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    read: false,
    type: 'alert'
  },
  {
    id: 'notif-2',
    title: 'New Maintenance Request',
    message: 'John Doe raised a battery issue request for AST-102 (Dell XPS 15 9530).',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    read: false,
    type: 'warning'
  },
  {
    id: 'notif-3',
    title: 'Vehicle Booked Successfully',
    message: 'Booking request for Tesla Model 3 (AST-201) has been approved for Tim Cooker.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    read: true,
    type: 'success'
  }
];
