import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '../components/StatCard';
import { 
  getAssets, 
  getAllocations, 
  getBookings, 
  getNotifications, 
  markNotificationRead, 
  clearNotifications,
  raiseMaintenanceRequest 
} from '../services/api';
import type { Asset, Allocation, Booking, SystemNotification } from '../services/types';
import { useToast } from '../components/Toast';
import { 
  Folder, 
  Layers, 
  CalendarRange, 
  AlertOctagon, 
  Clock, 
  UserSquare2, 
  Wrench, 
  BellRing,
  CheckCheck
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { showToast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [maintenanceDesc, setMaintenanceDesc] = useState('');
  const [selectedAssetTag, setSelectedAssetTag] = useState<string | null>(null);

  const loadData = () => {
    setAssets(getAssets());
    setAllocations(getAllocations());
    setBookings(getBookings());
    setNotifications(getNotifications());
  };

  useEffect(() => {
    loadData();
    // Poll notifications every 3 seconds for hackathon interactivity
    const interval = setInterval(() => {
      setNotifications(getNotifications());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalAssets = assets.length;
  const availableAssets = assets.filter(a => a.status === 'Available').length;
  const activeBookings = bookings.filter(b => b.status === 'Approved').length;
  const overdueAllocations = allocations.filter(a => a.status === 'Overdue');
  const overdueCount = overdueAllocations.length;

  // Filter personal allocations for employee views
  const myAllocations = allocations.filter(
    a => a.employeeId === currentUser?.id && a.status === 'Active'
  );

  const handleRaiseMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetTag || !maintenanceDesc.trim() || !currentUser) return;

    try {
      raiseMaintenanceRequest(selectedAssetTag, maintenanceDesc, currentUser.id);
      showToast(`Maintenance request logged for ${selectedAssetTag}`, 'success');
      setMaintenanceDesc('');
      setSelectedAssetTag(null);
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    loadData();
  };

  const handleClearNotifications = () => {
    clearNotifications();
    loadData();
    showToast('Notifications cleared', 'info');
  };

  return (
    <div className="flex flex-col gap-6 w-full overflow-y-auto max-h-[105vh] pb-10 pr-2">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Console Dashboard</h2>
        <p className="text-xs text-slate-400">
          Welcome back, {currentUser?.name}. Viewing system metrics for{' '}
          <span className="font-semibold text-indigo-400">{currentRole}</span>.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Total Inventory Assets" 
          value={totalAssets} 
          icon={Folder} 
          description="Total tracked assets in organization"
          color="indigo"
        />
        <StatCard 
          title="Ready / Available" 
          value={availableAssets} 
          icon={Layers} 
          description="Assets ready for immediate allocation"
          color="emerald"
        />
        <StatCard 
          title="Active Resource Bookings" 
          value={activeBookings} 
          icon={CalendarRange} 
          description="Approved shared resource bookings"
          color="amber"
        />
        <StatCard 
          title="Overdue Returns" 
          value={overdueCount} 
          icon={AlertOctagon} 
          description="Items past their expected return window"
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Overdue Table + Personal Allocations */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Overdue Alerts (Red alert container) */}
          <div className="bg-slate-900 border border-rose-950/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-rose-950/20 border-b border-rose-950/60 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <Clock className="w-5 h-5" />
                <h3 className="font-semibold text-sm tracking-wide">Critical Overdue Returns</h3>
              </div>
              <span className="bg-rose-500/10 text-rose-400 text-xs px-2.5 py-0.5 rounded-full border border-rose-500/20 font-bold">
                {overdueCount} Alerts
              </span>
            </div>
            
            <div className="p-6">
              {overdueAllocations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-slate-500 gap-2">
                  <CheckCheck className="w-8 h-8 text-emerald-500" />
                  <p className="text-sm font-medium">All allocated assets are within return schedules.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800">
                        <th className="pb-3 font-semibold">Asset Info</th>
                        <th className="pb-3 font-semibold">Holder</th>
                        <th className="pb-3 font-semibold">Expected Return</th>
                        <th className="pb-3 font-semibold">Allocated By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {overdueAllocations.map(alc => (
                        <tr key={alc.id} className="text-slate-350 hover:bg-slate-850/30 transition-colors">
                          <td className="py-3 font-semibold text-slate-200">
                            <div>{alc.assetName}</div>
                            <span className="text-[10px] text-indigo-400 font-mono">{alc.assetTag}</span>
                          </td>
                          <td className="py-3 font-medium">{alc.employeeName}</td>
                          <td className="py-3 font-bold text-rose-400">{alc.expectedReturnDate}</td>
                          <td className="py-3 text-slate-450">{alc.allocatedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Personal Allocations (Available for all roles, especially Employees) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="border-b border-slate-800/80 px-6 py-4 flex items-center gap-2 text-indigo-400">
              <UserSquare2 className="w-5 h-5" />
              <h3 className="font-semibold text-sm text-slate-200">My Allocated Assets</h3>
            </div>
            
            <div className="p-6">
              {myAllocations.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  You currently have no active allocations assigned to you.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myAllocations.map(alc => (
                    <div 
                      key={alc.id} 
                      className="bg-slate-950 border border-slate-800/65 p-4 rounded-xl flex flex-col justify-between gap-3 group hover:border-slate-750 transition-all"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-indigo-400 font-mono">{alc.assetTag}</span>
                          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-500/20">
                            Active
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-250 mt-1">{alc.assetName}</h4>
                        <div className="text-xs text-slate-500 mt-2 flex flex-col gap-0.5">
                          <p>Allocated: <span className="font-medium text-slate-400">{alc.allocatedDate}</span></p>
                          <p>Expected Return: <span className="font-medium text-slate-400">{alc.expectedReturnDate}</span></p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedAssetTag(alc.assetTag)}
                        className="flex items-center justify-center gap-1.5 w-full bg-slate-900 hover:bg-amber-600/10 hover:text-amber-400 text-xs font-semibold py-2 rounded-lg border border-slate-800 hover:border-amber-600/20 transition-all mt-1"
                      >
                        <Wrench className="w-3.5 h-3.5" /> Raise Repair Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Notification Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
          <div className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <BellRing className="w-5 h-5" />
              <h3 className="font-semibold text-sm text-slate-200">Alert Center</h3>
            </div>
            {notifications.length > 0 && (
              <button 
                onClick={handleClearNotifications}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="p-6 flex-grow overflow-y-auto max-h-[400px] flex flex-col gap-3">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No new notifications.</p>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.read && handleMarkRead(notif.id)}
                  className={`p-3.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    notif.read 
                      ? 'bg-slate-950/30 border-slate-850/60 opacity-60' 
                      : 'bg-slate-950 border-slate-800/85 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        notif.type === 'alert' ? 'bg-rose-500' :
                        notif.type === 'warning' ? 'bg-amber-500' :
                        notif.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`} />
                      <h4 className="text-xs font-semibold text-slate-200">{notif.title}</h4>
                    </div>
                    {!notif.read && (
                      <span className="bg-indigo-500/10 text-indigo-400 text-[8px] font-bold uppercase px-1 rounded">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{notif.message}</p>
                  <span className="text-[9px] text-slate-600 mt-1 block">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Raise Maintenance Dialog Modal */}
      {selectedAssetTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 animate-scale-in">
            <div>
              <h3 className="text-lg font-bold text-slate-200">Raise Repair Request</h3>
              <p className="text-xs text-slate-500 mt-1">Specify repair details for equipment: <span className="font-mono text-indigo-400 font-bold">{selectedAssetTag}</span></p>
            </div>

            <form onSubmit={handleRaiseMaintenance} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Describe Issue / Malfunction</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Swollen battery, screen flickering, broken hinge..."
                  value={maintenanceDesc}
                  onChange={(e) => setMaintenanceDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedAssetTag(null)}
                  className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
