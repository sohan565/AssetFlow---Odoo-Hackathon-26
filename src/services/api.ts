import type { 
  Asset, 
  Employee, 
  Department, 
  Category, 
  Allocation, 
  Booking, 
  Maintenance, 
  Audit, 
  SystemNotification, 
  AssetStatus, 
  UserRole 
} from './types';
import { 
  mockAssets, 
  mockEmployees, 
  mockDepartments, 
  mockCategories, 
  mockAllocations, 
  mockBookings, 
  mockMaintenances, 
  mockAudits, 
  mockNotifications 
} from '../data/mockData';

// LocalStorage Keys
const KEYS = {
  ASSETS: 'eam_assets',
  EMPLOYEES: 'eam_employees',
  DEPARTMENTS: 'eam_departments',
  CATEGORIES: 'eam_categories',
  ALLOCATIONS: 'eam_allocations',
  BOOKINGS: 'eam_bookings',
  MAINTENANCE: 'eam_maintenance',
  AUDITS: 'eam_audits',
  NOTIFICATIONS: 'eam_notifications',
  INIT: 'eam_initialized'
};

// Initialize State
export const initializeDatabase = () => {
  if (!localStorage.getItem(KEYS.INIT)) {
    localStorage.setItem(KEYS.ASSETS, JSON.stringify(mockAssets));
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(mockEmployees));
    localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(mockDepartments));
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(mockCategories));
    localStorage.setItem(KEYS.ALLOCATIONS, JSON.stringify(mockAllocations));
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(mockBookings));
    localStorage.setItem(KEYS.MAINTENANCE, JSON.stringify(mockMaintenances));
    localStorage.setItem(KEYS.AUDITS, JSON.stringify(mockAudits));
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(mockNotifications));
    localStorage.setItem(KEYS.INIT, 'true');
  }
};

// Helper: Save/Get functions
const getData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setData = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// -------------------------------------------------------------
// STATE MACHINE TRANSITION MATRICES
// -------------------------------------------------------------
export const validateStateTransition = (current: AssetStatus, next: AssetStatus): string | null => {
  if (current === next) return null;

  // Terminal states (once retired or disposed, they cannot be changed)
  if (current === 'Retired') return 'Cannot transition out of Retired state.';
  if (current === 'Disposed') return 'Cannot transition out of Disposed state.';

  const transitions: Record<AssetStatus, AssetStatus[]> = {
    'Available': ['Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'],
    'Allocated': ['Available', 'Lost', 'Under Maintenance'],
    'Reserved': ['Allocated', 'Available', 'Lost', 'Under Maintenance'],
    'Under Maintenance': ['Available', 'Retired', 'Disposed'],
    'Lost': ['Available', 'Retired', 'Disposed'],
    'Retired': [],
    'Disposed': []
  };

  if (!transitions[current].includes(next)) {
    return `Invalid state transition from "${current}" to "${next}".`;
  }

  return null;
};

// -------------------------------------------------------------
// NOTIFICATIONS SERVICE
// -------------------------------------------------------------
export const getNotifications = (): SystemNotification[] => getData<SystemNotification>(KEYS.NOTIFICATIONS);

export const addNotification = (title: string, message: string, type: SystemNotification['type']): void => {
  const notifs = getNotifications();
  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}`,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    type
  };
  setData(KEYS.NOTIFICATIONS, [newNotif, ...notifs]);
};

export const markNotificationRead = (id: string): void => {
  const notifs = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  setData(KEYS.NOTIFICATIONS, notifs);
};

export const clearNotifications = (): void => {
  setData(KEYS.NOTIFICATIONS, []);
};

// Check Overdue Return Dates
export const checkOverdueAllocations = (): void => {
  const allocations = getData<Allocation>(KEYS.ALLOCATIONS);
  const assets = getData<Asset>(KEYS.ASSETS);
  const employees = getData<Employee>(KEYS.EMPLOYEES);
  let updated = false;

  const newAllocations = allocations.map(alc => {
    if (alc.status === 'Active' && new Date(alc.expectedReturnDate) < new Date()) {
      alc.status = 'Overdue';
      updated = true;

      // Add warning notifications
      const asset = assets.find(a => a.tag === alc.assetTag);
      const employee = employees.find(e => e.id === alc.employeeId);
      addNotification(
        'Return Overdue Alert',
        `Asset "${asset?.name || alc.assetTag}" assigned to ${employee?.name || 'Employee'} is past its expected return date.`,
        'alert'
      );
    }
    return alc;
  });

  if (updated) {
    setData(KEYS.ALLOCATIONS, newAllocations);
  }
};

// -------------------------------------------------------------
// ASSETS CRUD & TRANSITIONS
// -------------------------------------------------------------
export const getAssets = (): Asset[] => {
  const assets = getData<Asset>(KEYS.ASSETS);
  const categories = getData<Category>(KEYS.CATEGORIES);
  return assets.map(a => ({
    ...a,
    categoryName: categories.find(c => c.id === a.categoryId)?.name || 'Unknown'
  }));
};

export const registerAsset = (assetData: Omit<Asset, 'status'>): Asset => {
  const assets = getAssets();
  if (assets.some(a => a.tag === assetData.tag)) {
    throw new Error(`Asset with Tag "${assetData.tag}" already exists.`);
  }

  const newAsset: Asset = {
    ...assetData,
    status: 'Available'
  };

  setData(KEYS.ASSETS, [...assets, newAsset]);
  addNotification('New Asset Registered', `Asset ${newAsset.tag} (${newAsset.name}) has been added to inventory.`, 'success');
  return newAsset;
};

export const updateAssetStatus = (tag: string, nextStatus: AssetStatus): void => {
  const assets = getAssets();
  const assetIndex = assets.findIndex(a => a.tag === tag);
  if (assetIndex === -1) throw new Error('Asset not found.');

  const asset = assets[assetIndex];
  const err = validateStateTransition(asset.status, nextStatus);
  if (err) throw new Error(err);

  assets[assetIndex].status = nextStatus;
  setData(KEYS.ASSETS, assets);

  addNotification(
    'Asset State Changed',
    `Asset ${tag} status updated from "${asset.status}" to "${nextStatus}".`,
    nextStatus === 'Lost' || nextStatus === 'Under Maintenance' ? 'warning' : 'info'
  );
};

// -------------------------------------------------------------
// ALLOCATIONS & DOUBLE ALLOCATION PREVENTION
// -------------------------------------------------------------
export const getAllocations = (): Allocation[] => {
  const allocations = getData<Allocation>(KEYS.ALLOCATIONS);
  const assets = getAssets();
  const employees = getData<Employee>(KEYS.EMPLOYEES);

  return allocations.map(alc => ({
    ...alc,
    assetName: assets.find(a => a.tag === alc.assetTag)?.name || 'Unknown Asset',
    employeeName: employees.find(e => e.id === alc.employeeId)?.name || 'Unknown Employee'
  }));
};

export const allocateAsset = (
  tag: string, 
  employeeId: string, 
  expectedReturnDate: string, 
  allocatedBy: string,
  notes?: string
): Allocation => {
  const assets = getAssets();
  const asset = assets.find(a => a.tag === tag);
  if (!asset) throw new Error('Asset not found.');

  // Validate state machine first: Available -> Allocated or Reserved -> Allocated
  const err = validateStateTransition(asset.status, 'Allocated');
  if (err) {
    // If not available, we throw a specific "double allocation" message
    throw new Error(`Double Allocation Blocked: Asset "${tag}" is currently "${asset.status}" and cannot be allocated.`);
  }

  // Update asset status
  updateAssetStatus(tag, 'Allocated');

  // Register allocation record
  const allocations = getData<Allocation>(KEYS.ALLOCATIONS);
  const newAllocation: Allocation = {
    id: `alc-${Date.now()}`,
    assetTag: tag,
    employeeId,
    allocatedBy,
    allocatedDate: new Date().toISOString().split('T')[0],
    expectedReturnDate,
    status: 'Active',
    notes
  };

  setData(KEYS.ALLOCATIONS, [...allocations, newAllocation]);
  return newAllocation;
};

export const returnAsset = (tag: string, notes?: string): void => {
  const assets = getAssets();
  const asset = assets.find(a => a.tag === tag);
  if (!asset) throw new Error('Asset not found.');

  if (asset.status !== 'Allocated') {
    throw new Error(`Cannot return asset: Current state is "${asset.status}", expected "Allocated".`);
  }

  // Transition asset back to Available
  updateAssetStatus(tag, 'Available');

  // Close allocation record
  const allocations = getData<Allocation>(KEYS.ALLOCATIONS);
  const updatedAllocations = allocations.map(alc => {
    if (alc.assetTag === tag && alc.status === 'Active' || alc.status === 'Overdue') {
      return {
        ...alc,
        status: 'Returned' as const,
        returnDate: new Date().toISOString().split('T')[0],
        notes: notes ? `${alc.notes || ''} | Return note: ${notes}` : alc.notes
      };
    }
    return alc;
  });

  setData(KEYS.ALLOCATIONS, updatedAllocations);
};

// -------------------------------------------------------------
// BOOKING & TIMELINE OVERLAP CHECKER
// -------------------------------------------------------------
export const getBookings = (): Booking[] => {
  const bookings = getData<Booking>(KEYS.BOOKINGS);
  const assets = getAssets();
  const employees = getData<Employee>(KEYS.EMPLOYEES);

  return bookings.map(bkg => ({
    ...bkg,
    assetName: assets.find(a => a.tag === bkg.assetTag)?.name || 'Unknown Resource',
    employeeName: employees.find(e => e.id === bkg.employeeId)?.name || 'Unknown Employee'
  }));
};

export const checkBookingOverlap = (assetTag: string, startTime: string, endTime: string, excludeId?: string): boolean => {
  const bookings = getBookings().filter(b => b.assetTag === assetTag && b.status === 'Approved');
  const start = new Date(startTime);
  const end = new Date(endTime);

  return bookings.some(bkg => {
    if (excludeId && bkg.id === excludeId) return false;
    const existingStart = new Date(bkg.startTime);
    const existingEnd = new Date(bkg.endTime);
    // Overlap math: (StartA < EndB) && (EndA > StartB)
    return (start < existingEnd) && (end > existingStart);
  });
};

export const createBooking = (bookingData: Omit<Booking, 'id' | 'status' | 'approvedBy'>): Booking => {
  if (new Date(bookingData.startTime) >= new Date(bookingData.endTime)) {
    throw new Error('Booking end time must be after the start time.');
  }

  const isOverlapping = checkBookingOverlap(bookingData.assetTag, bookingData.startTime, bookingData.endTime);
  if (isOverlapping) {
    throw new Error('Overlap Blocked: This asset/room is already booked during the selected hours.');
  }

  const bookings = getData<Booking>(KEYS.BOOKINGS);
  const newBooking: Booking = {
    ...bookingData,
    id: `bkg-${Date.now()}`,
    status: 'Approved' // auto-approve in our interactive prototype for hackathon fluidity
  };

  setData(KEYS.BOOKINGS, [...bookings, newBooking]);

  // Optionally mark asset status to Reserved if the booking is currently active
  const now = new Date();
  if (now >= new Date(bookingData.startTime) && now <= new Date(bookingData.endTime)) {
    const assets = getAssets();
    const asset = assets.find(a => a.tag === bookingData.assetTag);
    if (asset && asset.status === 'Available') {
      updateAssetStatus(bookingData.assetTag, 'Reserved');
    }
  }

  addNotification(
    'Booking Confirmed', 
    `Resource booking for ${bookingData.assetTag} created successfully.`, 
    'success'
  );
  return newBooking;
};

// -------------------------------------------------------------
// MAINTENANCE WORKFLOW
// -------------------------------------------------------------
export const getMaintenances = (): Maintenance[] => {
  const mnts = getData<Maintenance>(KEYS.MAINTENANCE);
  const assets = getAssets();
  const employees = getData<Employee>(KEYS.EMPLOYEES);

  return mnts.map(m => ({
    ...m,
    assetName: assets.find(a => a.tag === m.assetTag)?.name || 'Unknown Asset',
    requesterName: employees.find(e => e.id === m.requestedBy)?.name || 'Unknown Requester'
  }));
};

export const raiseMaintenanceRequest = (assetTag: string, description: string, requestedBy: string): Maintenance => {
  const mnts = getData<Maintenance>(KEYS.MAINTENANCE);
  const newMnt: Maintenance = {
    id: `mnt-${Date.now()}`,
    assetTag,
    requestedBy,
    description,
    status: 'Pending',
    requestDate: new Date().toISOString().split('T')[0]
  };

  setData(KEYS.MAINTENANCE, [...mnts, newMnt]);
  addNotification('Maintenance Requested', `Repair request opened for asset ${assetTag}.`, 'warning');
  return newMnt;
};

export const updateMaintenanceStatus = (
  id: string, 
  status: Maintenance['status'], 
  cost?: number, 
  notes?: string
): void => {
  const mnts = getMaintenances();
  const mntIdx = mnts.findIndex(m => m.id === id);
  if (mntIdx === -1) throw new Error('Maintenance request not found.');

  const mnt = mnts[mntIdx];
  const oldStatus = mnt.status;
  mnt.status = status;
  if (cost !== undefined) mnt.cost = cost;
  if (notes !== undefined) mnt.notes = notes;

  if (status === 'Approved') {
    // When approved, move asset to Under Maintenance
    updateAssetStatus(mnt.assetTag, 'Under Maintenance');
    mnt.status = 'In Progress'; // transition directly to In Progress once approved
  } else if (status === 'Resolved') {
    // When resolved, transition asset back to Available
    updateAssetStatus(mnt.assetTag, 'Available');
    mnt.resolutionDate = new Date().toISOString().split('T')[0];
  }

  setData(KEYS.MAINTENANCE, mnts);
  addNotification(
    'Repair Status Updated',
    `Maintenance for ${mnt.assetTag} updated from "${oldStatus}" to "${mnt.status}".`,
    'info'
  );
};

// -------------------------------------------------------------
// AUDITING SYSTEM
// -------------------------------------------------------------
export const getAudits = (): Audit[] => {
  const audits = getData<Audit>(KEYS.AUDITS);
  const employees = getData<Employee>(KEYS.EMPLOYEES);

  return audits.map(aud => ({
    ...aud,
    auditorName: employees.find(e => e.id === aud.assignedTo)?.name || 'Unknown Auditor'
  }));
};

export const checkAuditAsset = (
  auditId: string, 
  assetTag: string, 
  status: 'Verified' | 'Missing' | 'Damaged', 
  notes?: string
): void => {
  const audits = getAudits();
  const audIdx = audits.findIndex(a => a.id === auditId);
  if (audIdx === -1) throw new Error('Audit not found.');

  const audit = audits[audIdx];
  audit.checkedAssets[assetTag] = { status, notes };

  if (status === 'Missing') {
    // Flag asset as Lost
    updateAssetStatus(assetTag, 'Lost');
  } else if (status === 'Damaged') {
    // Flag asset as Under Maintenance & Create repair request
    raiseMaintenanceRequest(assetTag, `Flagged Damaged during Audit "${audit.title}". Notes: ${notes || 'None'}`, audit.assignedTo);
    updateAssetStatus(assetTag, 'Under Maintenance');
  }

  setData(KEYS.AUDITS, audits);
};

export const completeAudit = (auditId: string, summary: string): void => {
  const audits = getAudits();
  const audIdx = audits.findIndex(a => a.id === auditId);
  if (audIdx === -1) throw new Error('Audit not found.');

  const audit = audits[audIdx];

  // Filter keys checked
  const checkedTags = Object.keys(audit.checkedAssets);
  const totalChecked = checkedTags.length;
  let verified = 0;
  let missingCount = 0;
  let damagedCount = 0;
  const missingTags: string[] = [];
  const damagedTags: string[] = [];

  checkedTags.forEach(tag => {
    const item = audit.checkedAssets[tag];
    if (item.status === 'Verified') verified++;
    else if (item.status === 'Missing') {
      missingCount++;
      missingTags.push(tag);
    } else if (item.status === 'Damaged') {
      damagedCount++;
      damagedTags.push(tag);
    }
  });

  audit.status = 'Completed';
  audit.completedDate = new Date().toISOString().split('T')[0];
  audit.discrepancyReport = {
    totalChecked,
    verified,
    missingCount,
    damagedCount,
    missingTags,
    damagedTags,
    summary
  };

  setData(KEYS.AUDITS, audits);
  addNotification('Audit Checklist Completed', `Audit "${audit.title}" finalized with ${missingCount} missing and ${damagedCount} damaged items.`, 'alert');
};

// -------------------------------------------------------------
// EMPLOYEES, DEPARTMENTS & CATEGORIES
// -------------------------------------------------------------
export const getEmployees = (): Employee[] => {
  const employees = getData<Employee>(KEYS.EMPLOYEES);
  const depts = getData<Department>(KEYS.DEPARTMENTS);
  return employees.map(e => ({
    ...e,
    departmentName: depts.find(d => d.id === e.departmentId)?.name || 'None'
  }));
};

export const promoteEmployee = (id: string, role: UserRole): void => {
  const employees = getEmployees();
  const idx = employees.findIndex(e => e.id === id);
  if (idx === -1) throw new Error('Employee not found.');

  const emp = employees[idx];
  const oldRole = emp.role;
  employees[idx].role = role;

  setData(KEYS.EMPLOYEES, employees);
  addNotification(
    'Employee Role Promoted',
    `Admin elevated ${emp.name} from "${oldRole}" to "${role}".`,
    'success'
  );
};

export const registerEmployee = (name: string, email: string, departmentId: string): Employee => {
  const employees = getEmployees();
  if (employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
    throw new Error(`Email "${email}" is already registered.`);
  }

  const newEmp: Employee = {
    id: `emp-${Date.now()}`,
    name,
    email,
    role: 'Employee', // Hardcoded default role as per security guidelines
    departmentId,
    joinedDate: new Date().toISOString().split('T')[0]
  };

  setData(KEYS.EMPLOYEES, [...employees, newEmp]);
  return newEmp;
};

export const getDepartments = (): Department[] => getData<Department>(KEYS.DEPARTMENTS);

export const addDepartment = (name: string, code: string): Department => {
  const depts = getDepartments();
  if (depts.some(d => d.code.toUpperCase() === code.toUpperCase())) {
    throw new Error(`Department with Code "${code}" already exists.`);
  }

  const newDept: Department = {
    id: `dept-${Date.now()}`,
    name,
    code: code.toUpperCase()
  };

  setData(KEYS.DEPARTMENTS, [...depts, newDept]);
  return newDept;
};

export const getCategories = (): Category[] => getData<Category>(KEYS.CATEGORIES);

export const addCategory = (name: string, code: string): Category => {
  const cats = getCategories();
  if (cats.some(c => c.code.toUpperCase() === code.toUpperCase())) {
    throw new Error(`Category with Code "${code}" already exists.`);
  }

  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name,
    code: code.toUpperCase()
  };

  setData(KEYS.CATEGORIES, [...cats, newCat]);
  return newCat;
};
