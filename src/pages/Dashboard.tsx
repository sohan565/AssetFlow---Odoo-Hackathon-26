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
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

/* ── Custom tooltip — uses any to avoid recharts internal type version mismatches ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AssetTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const v = Number(payload[0]?.value ?? 0);
  return (
    <div style={{ background: '#0c1120', border: '1px solid #334155', borderRadius: 12, padding: '8px 14px', fontSize: 12 }}>
      <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#22c55e', fontWeight: 600 }}>${(v / 1000000).toFixed(2)}M</p>
    </div>
  );
};


/* ── Spark data for the mini asset value chart ── */
const assetValueTrend = [
  { m: 'Jan', v: 3200000 }, { m: 'Feb', v: 3450000 }, { m: 'Mar', v: 3100000 },
  { m: 'Apr', v: 3700000 }, { m: 'May', v: 3600000 }, { m: 'Jun', v: 3900000 },
  { m: 'Jul', v: 3750000 }, { m: 'Aug', v: 4000000 }, { m: 'Sep', v: 3850000 },
  { m: 'Oct', v: 4100000 }, { m: 'Nov', v: 4250000 }, { m: 'Dec', v: 4285190 },
];

const bookingTrend = [
  { m: 'Jan', inflow: 6, outflow: 3 }, { m: 'Feb', inflow: 9, outflow: 5 },
  { m: 'Mar', inflow: 11, outflow: 7 }, { m: 'Apr', inflow: 8, outflow: 4 },
  { m: 'May', inflow: 12, outflow: 8 }, { m: 'Jun', inflow: 10, outflow: 6 },
  { m: 'Jul', inflow: 9, outflow: 7 }, { m: 'Aug', inflow: 14, outflow: 9 },
  { m: 'Sep', inflow: 11, outflow: 5 }, { m: 'Oct', inflow: 13, outflow: 8 },
  { m: 'Nov', inflow: 15, outflow: 10 }, { m: 'Dec', inflow: 12, outflow: 7 },
];

/* ── Shared card style ── */
const card = 'rounded-2xl border border-slate-800/50 backdrop-blur-md overflow-hidden';
const cardBg = { background: 'rgba(12, 17, 32, 0.82)' };

/* ── Shared panel header ── */
const PanelHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ icon, title, badge, action }) => (
  <div className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-2.5">
      {icon}
      <h3 className="font-semibold text-sm text-slate-200">{title}</h3>
      {badge}
    </div>
    {action}
  </div>
);

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
    const interval = setInterval(() => setNotifications(getNotifications()), 3000);
    return () => clearInterval(interval);
  }, []);

  const totalAssets = assets.length;
  const availableAssets = assets.filter(a => a.status === 'Available').length;
  const activeBookings = bookings.filter(b => b.status === 'Approved').length;
  const overdueAllocations = allocations.filter(a => a.status === 'Overdue');
  const overdueCount = overdueAllocations.length;
  const myAllocations = allocations.filter(a => a.employeeId === currentUser?.id && a.status === 'Active');

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

  const handleMarkRead = (id: string) => { markNotificationRead(id); loadData(); };
  const handleClearNotifications = () => { clearNotifications(); loadData(); showToast('Notifications cleared', 'info'); };

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-white">Console Dashboard</h2>
        <p className="text-xs text-slate-500">
          Welcome back,{' '}
          <span className="text-slate-300 font-medium">{currentUser?.name}</span>.
          Viewing system metrics for{' '}
          <span className="font-semibold text-indigo-400">{currentRole}</span>.
        </p>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Inventory Assets" value={totalAssets}     icon={Folder}       description="Total tracked assets in organization" color="indigo" />
        <StatCard title="Ready / Available"       value={availableAssets} icon={Layers}       description="Assets ready for immediate allocation"  color="emerald" />
        <StatCard title="Active Bookings"          value={activeBookings}  icon={CalendarRange} description="Approved shared resource bookings"     color="amber" />
        <StatCard title="Overdue Returns"          value={overdueCount}    icon={AlertOctagon} description="Items past their expected return window" color="rose" />
      </div>

      {/* ── Charts Row: Asset Value Trend + Booking Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Asset Value Area Chart */}
        <div className={`${card} lg:col-span-3`} style={cardBg}>
          <PanelHeader
            icon={<Folder className="w-4 h-4 text-indigo-400" />}
            title="Total Assets Value Trend"
          />
          <div className="px-4 pt-4 pb-2">
            <p className="text-3xl font-extrabold text-white">$4,285,190</p>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">+12.4% <span className="text-slate-500 font-normal">vs last month</span></p>
          </div>
          <div className="h-44 px-2 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={assetValueTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip content={<AssetTooltip />} />
                <Area type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2.5} fill="url(#assetGrad)" dot={false} activeDot={{ r: 4, fill: '#22c55e', stroke: '#0c1120', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Inflow/Outflow Bar Chart */}
        <div className={`${card} lg:col-span-2`} style={cardBg}>
          <PanelHeader
            icon={<CalendarRange className="w-4 h-4 text-indigo-400" />}
            title="Booking Activity"
          />
          <div className="px-6 pt-3 pb-1 flex gap-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Created</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2 h-2 rounded-full bg-purple-500" /> Closed</span>
          </div>
          <div className="h-44 px-2 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={3}>
                <defs>
                  <linearGradient id="inflowG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="outflowG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#0c1120', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#94a3b8' }} cursor={{ fill: 'rgba(148,163,184,0.04)' }} />
                <Bar dataKey="inflow" name="Created" fill="url(#inflowG)" radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="outflow" name="Closed" fill="url(#outflowG)" radius={[3, 3, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left Column: Overdue + Personal Allocations */}
        <div className="xl:col-span-2 flex flex-col gap-5">
          {/* Overdue Returns Panel */}
          {['Admin', 'Asset Manager'].includes(currentRole || '') && (
            <div className={card} style={cardBg}>
              <PanelHeader
                icon={<Clock className="w-4 h-4 text-rose-400" />}
                title="Critical Overdue Returns"
                badge={
                  overdueCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                      {overdueCount} Alert{overdueCount > 1 ? 's' : ''}
                    </span>
                  )
                }
              />
              <div className="p-6">
                {overdueAllocations.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No overdue returns at this time.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800/60">
                          <th className="font-semibold pb-3">Asset Info</th>
                          <th className="font-semibold pb-3">Holder</th>
                          <th className="font-semibold pb-3">Expected Return</th>
                          <th className="font-semibold pb-3">Allocated By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {overdueAllocations.map(alc => (
                          <tr key={alc.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-3.5">
                              <span className="font-medium text-slate-200 block">{alc.assetName}</span>
                              <span className="text-[10px] text-slate-600 font-mono">{alc.assetTag}</span>
                            </td>
                            <td className="py-3.5 text-slate-300">{alc.employeeName}</td>
                            <td className="py-3.5 font-bold text-rose-400">{alc.expectedReturnDate}</td>
                            <td className="py-3.5 text-slate-400">{alc.allocatedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personal Allocations Panel */}
          <div className={card} style={cardBg}>
            <PanelHeader
              icon={<UserSquare2 className="w-4 h-4 text-indigo-400" />}
              title="My Allocated Assets"
            />
            <div className="p-6">
              {myAllocations.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  You currently have no active allocations assigned to you.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myAllocations.map(alc => (
                    <div
                      key={alc.id}
                      className="border border-slate-800/50 p-4 rounded-xl flex flex-col justify-between gap-3 group hover:border-indigo-500/20 transition-all"
                      style={{ background: 'rgba(99,102,241,0.04)' }}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-indigo-400 font-mono">{alc.assetTag}</span>
                          <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-500/20">Active</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-200 mt-1">{alc.assetName}</h4>
                        <div className="text-xs text-slate-500 mt-2 flex flex-col gap-0.5">
                          <p>Allocated: <span className="font-medium text-slate-400">{alc.allocatedDate}</span></p>
                          <p>Expected Return: <span className="font-medium text-slate-400">{alc.expectedReturnDate}</span></p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedAssetTag(alc.assetTag)}
                        className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-2 rounded-lg border border-slate-700/40 text-slate-400 hover:border-amber-500/30 hover:text-amber-400 transition-all"
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

        {/* Right Column: Alert Center */}
        <div className={`${card} flex flex-col`} style={cardBg}>
          <PanelHeader
            icon={<BellRing className="w-4 h-4 text-indigo-400" />}
            title="Alert Center"
            action={
              notifications.length > 0 && (
                <button
                  onClick={handleClearNotifications}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                >
                  Clear All
                </button>
              )
            }
          />
          <div className="p-5 flex-grow overflow-y-auto max-h-[480px] flex flex-col gap-2.5">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No new notifications.</p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkRead(notif.id)}
                  className={`p-3.5 rounded-xl border flex flex-col gap-1 cursor-pointer transition-all ${
                    notif.read
                      ? 'border-slate-800/30 opacity-50'
                      : 'border-slate-700/40 hover:border-slate-600/60'
                  }`}
                  style={!notif.read ? { background: 'rgba(99,102,241,0.04)' } : { background: 'transparent' }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        notif.type === 'alert'   ? 'bg-rose-500' :
                        notif.type === 'warning' ? 'bg-amber-500' :
                        notif.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`} />
                      <h4 className="text-xs font-semibold text-slate-200">{notif.title}</h4>
                    </div>
                    {!notif.read && (
                      <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase px-1.5 py-0.5 rounded shrink-0">New</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{notif.message}</p>
                  <span className="text-[9px] text-slate-600 mt-1">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Maintenance Request Modal ── */}
      {selectedAssetTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md rounded-3xl border border-slate-700/50 shadow-2xl p-6 flex flex-col gap-4 animate-scale-in"
            style={{ background: 'rgba(12, 17, 32, 0.97)', backdropFilter: 'blur(20px)' }}
          >
            <div>
              <h3 className="text-lg font-bold text-slate-100">Raise Repair Request</h3>
              <p className="text-xs text-slate-500 mt-1">
                Specify repair details for:{' '}
                <span className="font-mono text-indigo-400 font-bold">{selectedAssetTag}</span>
              </p>
            </div>
            <form onSubmit={handleRaiseMaintenance} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Describe Issue / Malfunction</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Swollen battery, screen flickering, broken hinge..."
                  value={maintenanceDesc}
                  onChange={e => setMaintenanceDesc(e.target.value)}
                  className="w-full border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none"
                  style={{ background: 'rgba(99,102,241,0.05)' }}
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedAssetTag(null)}
                  className="border border-slate-700/50 text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', boxShadow: '0 4px 15px rgba(99,102,241,0.25)' }}
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
