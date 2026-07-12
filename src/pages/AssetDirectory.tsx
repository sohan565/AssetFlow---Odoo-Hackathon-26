import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  getAssets, 
  registerAsset, 
  allocateAsset, 
  returnAsset, 
  getEmployees, 
  getCategories, 
  updateAssetStatus,
  getAllocations,
  addNotification
} from '../services/api';
import type { Asset, Employee, Category, AssetStatus, Allocation } from '../services/types';
import { useToast } from '../components/Toast';
import { 
  Search, 
  Filter, 
  Plus, 
  UserPlus, 
  ArrowLeftRight, 
  FolderPlus, 
  Trash2, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export const AssetDirectory: React.FC = () => {
  const { currentRole, currentUser } = useAuth();
  const { showToast } = useToast();

  // Data state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modals State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Forms State
  const [newAssetData, setNewAssetData] = useState({
    tag: '',
    name: '',
    categoryId: '',
    serialNumber: '',
    location: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    cost: 0
  });

  const [allocationData, setAllocationData] = useState({
    employeeId: '',
    expectedReturnDate: '',
    notes: ''
  });

  // Double Allocation Handlers
  const [blockedAllocationError, setBlockedAllocationError] = useState<string | null>(null);
  const [transferAssetTag, setTransferAssetTag] = useState<string | null>(null);

  const loadData = () => {
    setAssets(getAssets());
    setEmployees(getEmployees());
    setCategories(getCategories());
    setAllocations(getAllocations());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const { tag, name, categoryId, serialNumber, location, cost } = newAssetData;
    if (!tag.trim() || !name.trim() || !categoryId || !serialNumber.trim() || !location.trim()) {
      showToast('All fields are required.', 'warning');
      return;
    }

    try {
      registerAsset({
        ...newAssetData,
        tag: tag.trim().toUpperCase(),
        cost: Number(cost)
      });
      showToast(`Asset "${name}" registered successfully under tag ${tag.toUpperCase()}`, 'success');
      setIsRegisterOpen(false);
      setNewAssetData({
        tag: '',
        name: '',
        categoryId: '',
        serialNumber: '',
        location: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        cost: 0
      });
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !allocationData.employeeId || !allocationData.expectedReturnDate) {
      showToast('Please select an employee and return date.', 'warning');
      return;
    }

    try {
      allocateAsset(
        selectedAsset.tag,
        allocationData.employeeId,
        allocationData.expectedReturnDate,
        currentUser?.name || 'System Operator',
        allocationData.notes
      );
      showToast(`Asset ${selectedAsset.tag} successfully allocated.`, 'success');
      setIsAllocateOpen(false);
      setSelectedAsset(null);
      setAllocationData({ employeeId: '', expectedReturnDate: '', notes: '' });
      setBlockedAllocationError(null);
      setTransferAssetTag(null);
      loadData();
    } catch (err: any) {
      // Catch double-allocation error specifically to show inline transfer option
      if (err.message.includes('Double Allocation Blocked')) {
        setBlockedAllocationError(err.message);
        setTransferAssetTag(selectedAsset.tag);
      } else {
        showToast(err.message, 'error');
      }
    }
  };

  const handleRequestTransfer = () => {
    if (!transferAssetTag || !currentUser) return;
    
    // Find who currently has the asset allocated
    const activeAlloc = allocations.find(
      a => a.assetTag === transferAssetTag && (a.status === 'Active' || a.status === 'Overdue')
    );
    
    const currentHolderName = activeAlloc?.employeeName || 'another employee';
    const targetEmployee = employees.find(e => e.id === allocationData.employeeId);
    
    // Add transfer requested notification
    addNotification(
      'Asset Transfer Requested',
      `Transfer requested for ${transferAssetTag} from ${currentHolderName} to ${targetEmployee?.name || 'new employee'}. Requested by ${currentUser.name}.`,
      'warning'
    );

    showToast(`Transfer request submitted for ${transferAssetTag}. Current holder (${currentHolderName}) and administrators have been notified.`, 'info', 6000);
    
    // Close out states
    setIsAllocateOpen(false);
    setSelectedAsset(null);
    setBlockedAllocationError(null);
    setTransferAssetTag(null);
  };

  const handleReturnAsset = (tag: string) => {
    if (window.confirm(`Are you sure you want to process return of Asset ${tag}?`)) {
      try {
        returnAsset(tag, 'Normal return checklist cleared.');
        showToast(`Asset ${tag} returned to available inventory.`, 'success');
        loadData();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleDecommission = (tag: string, action: 'Retired' | 'Disposed') => {
    if (window.confirm(`Proceed with decommission action (${action}) for Asset ${tag}?`)) {
      try {
        updateAssetStatus(tag, action);
        showToast(`Asset ${tag} status changed to ${action}.`, 'success');
        loadData();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }
  };

  // Filter Assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || asset.categoryId === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const isPowerUser = ['Admin', 'Asset Manager'].includes(currentRole || '');

  // Helper to color statuses
  const getStatusPill = (status: AssetStatus) => {
    const map: Record<AssetStatus, string> = {
      'Available': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'Allocated': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Reserved': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'Under Maintenance': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Lost': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      'Retired': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      'Disposed': 'bg-slate-700/10 text-slate-550 border-slate-700/20'
    };
    return map[status] || 'bg-slate-500/10 text-slate-450';
  };

  return (
    <div className="flex flex-col gap-6 w-full overflow-y-auto max-h-[105vh] pb-10 pr-2">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Asset Directory</h2>
          <p className="text-xs text-slate-400">Search corporate assets, audit status logs, assign hardware, or decommission retired equipment.</p>
        </div>

        {isPowerUser && (
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Register New Asset
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Name, Asset Tag, or Serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-44 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 text-xs focus:outline-none transition-all cursor-pointer font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Reserved">Reserved</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Lost">Lost</option>
            <option value="Retired">Retired</option>
            <option value="Disposed">Disposed</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-auto shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-48 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-350 text-xs focus:outline-none transition-all cursor-pointer font-medium"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid List */}
      {filteredAssets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-xs font-semibold">
          No assets match your search parameters. Try expanding filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAssets.map(asset => {
            const currentAllocation = allocations.find(
              a => a.assetTag === asset.tag && (a.status === 'Active' || a.status === 'Overdue')
            );

            return (
              <div 
                key={asset.tag}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 group shadow-lg"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-wide">{asset.tag}</span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getStatusPill(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-200 mt-2 font-outfit truncate">{asset.name}</h3>
                  
                  <div className="mt-3 flex flex-col gap-1.5 text-[11px] text-slate-400 font-medium">
                    <p className="flex justify-between border-b border-slate-800/40 pb-1">
                      <span className="text-slate-500">Category</span>
                      <span className="text-slate-300 font-semibold">{asset.categoryName}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-800/40 pb-1">
                      <span className="text-slate-500">Serial No.</span>
                      <span className="text-slate-350 font-mono truncate max-w-[150px]">{asset.serialNumber}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-800/40 pb-1">
                      <span className="text-slate-500">Location</span>
                      <span className="text-slate-300">{asset.location}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Asset Cost</span>
                      <span className="text-slate-300 font-bold">${asset.cost.toLocaleString()}</span>
                    </p>
                  </div>

                  {currentAllocation && (
                    <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl mt-4 text-[10px] flex flex-col gap-1">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Assigned Holder</span>
                      <div className="flex justify-between font-semibold text-slate-300">
                        <span>{currentAllocation.employeeName}</span>
                        <span className={currentAllocation.status === 'Overdue' ? 'text-rose-400' : 'text-slate-400'}>
                          Due: {currentAllocation.expectedReturnDate}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {isPowerUser && (
                  <div className="border-t border-slate-800/80 pt-3.5 flex gap-2 justify-end mt-2">
                    {asset.status === 'Available' && (
                      <button
                        onClick={() => {
                          setSelectedAsset(asset);
                          setIsAllocateOpen(true);
                        }}
                        className="flex items-center gap-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-indigo-500/25 transition-all w-full justify-center"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Allocate Asset
                      </button>
                    )}

                    {asset.status === 'Allocated' && (
                      <button
                        onClick={() => handleReturnAsset(asset.tag)}
                        className="flex items-center gap-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-500/25 transition-all w-full justify-center"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Check-in / Return
                      </button>
                    )}

                    {['Available', 'Lost'].includes(asset.status) && (
                      <>
                        <button
                          onClick={() => handleDecommission(asset.tag, 'Retired')}
                          className="p-2 text-slate-500 hover:text-slate-200 hover:bg-slate-850 rounded-lg transition-all"
                          title="Retire Asset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDecommission(asset.tag, 'Disposed')}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all"
                          title="Dispose / Scrap Asset"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </>
                    )}

                    {!['Available', 'Allocated', 'Lost'].includes(asset.status) && (
                      <span className="text-[10px] text-slate-500 italic py-1 font-semibold">
                        System Managed ({asset.status})
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Register Asset */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center gap-2 text-indigo-400">
              <FolderPlus className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-250 font-outfit">Register Corporate Asset</h3>
            </div>

            <form onSubmit={handleRegisterAsset} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Asset Tag Prefix (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AST-501"
                  value={newAssetData.tag}
                  onChange={(e) => setNewAssetData({ ...newAssetData, tag: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono uppercase"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Asset Model/Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPad Pro 12.9"
                  value={newAssetData.name}
                  onChange={(e) => setNewAssetData({ ...newAssetData, name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Inventory Category</label>
                <select
                  required
                  value={newAssetData.categoryId}
                  onChange={(e) => setNewAssetData({ ...newAssetData, categoryId: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Serial Identifier (Mfg)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SN-883FHKDKA"
                  value={newAssetData.serialNumber}
                  onChange={(e) => setNewAssetData({ ...newAssetData, serialNumber: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Assigned Site Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SF HQ - Floor 3"
                  value={newAssetData.location}
                  onChange={(e) => setNewAssetData({ ...newAssetData, location: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Purchase Date</label>
                <input
                  type="date"
                  required
                  value={newAssetData.purchaseDate}
                  onChange={(e) => setNewAssetData({ ...newAssetData, purchaseDate: e.target.value })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[11px] font-semibold text-slate-400">Procurement Cost (USD)</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={newAssetData.cost || ''}
                  onChange={(e) => setNewAssetData({ ...newAssetData, cost: Number(e.target.value) })}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 md:col-span-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-250 hover:bg-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
                >
                  Submit Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Allocate Asset (With double allocation transfer option) */}
      {isAllocateOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 animate-scale-in">
            
            {/* Header */}
            <div>
              <h3 className="text-lg font-bold text-slate-200 font-outfit">Allocate Corporate Equipment</h3>
              <p className="text-xs text-slate-450 mt-1">Assigning: <span className="font-mono text-indigo-400 font-bold">{selectedAsset.tag}</span> - {selectedAsset.name}</p>
            </div>

            {/* Double Allocation Error Indicator */}
            {blockedAllocationError ? (
              <div className="bg-rose-950/20 border border-rose-900/60 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-400">Double Allocation Blocked</h4>
                    <p className="text-[11px] text-rose-450 leading-relaxed mt-1">{blockedAllocationError}</p>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-rose-900/20 pt-3 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBlockedAllocationError(null);
                      setTransferAssetTag(null);
                      setIsAllocateOpen(false);
                      setSelectedAsset(null);
                    }}
                    className="bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800/80 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-grow text-center"
                  >
                    Close Dialog
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestTransfer}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-grow"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" /> Request Transfer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAllocateSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Select Employee Holder</label>
                  <select
                    required
                    value={allocationData.employeeId}
                    onChange={(e) => setAllocationData({ ...allocationData, employeeId: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
                  >
                    <option value="" disabled>Select Employee</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Expected Return Date</label>
                  <input
                    type="date"
                    required
                    value={allocationData.expectedReturnDate}
                    onChange={(e) => setAllocationData({ ...allocationData, expectedReturnDate: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Allocation Notes</label>
                  <textarea
                    placeholder="e.g. Standard remote worker package. Checked battery cycles."
                    rows={3}
                    value={allocationData.notes}
                    onChange={(e) => setAllocationData({ ...allocationData, notes: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                {/* Submit action */}
                <div className="flex justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAllocateOpen(false);
                      setSelectedAsset(null);
                    }}
                    className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-250 hover:bg-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
                  >
                    Confirm Allocation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
