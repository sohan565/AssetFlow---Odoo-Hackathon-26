import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Folder, 
  Calendar, 
  Wrench, 
  ClipboardCheck, 
  Settings, 
  User, 
  AlertTriangle, 
  Bell, 
  ChevronRight, 
  ArrowRightLeft, 
  Laptop, 
  Search,
  CheckCircle,
  Clock
} from 'lucide-react';

interface AlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  isNew: boolean;
}

interface OverdueAsset {
  id: string;
  name: string;
  tag: string;
  holder: string;
  expectedReturn: string;
  allocatedBy: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [role, setRole] = useState<'Admin' | 'Asset Manager' | 'Auditor' | 'Employee'>('Admin');

  // Seeded mock data matching the screenshot
  const overdueAssets: OverdueAsset[] = [
    {
      id: '1',
      name: 'MacBook Pro M3 Max 16"',
      tag: 'AST-101',
      holder: 'John Doe',
      expectedReturn: '2026-02-02',
      allocatedBy: 'Robert Miller'
    },
    {
      id: '2',
      name: 'Lenovo ThinkPad X1 Carbon',
      tag: 'AST-103',
      holder: 'Jane Smith',
      expectedReturn: '2024-06-12',
      allocatedBy: 'Robert Miller'
    }
  ];

  const alerts: AlertItem[] = [
    {
      id: '1',
      type: 'overdue',
      title: 'Return Overdue Alert',
      message: 'Asset "MacBook Pro M3 Max 16"" assigned to John Doe is past its expected return date.',
      time: '11:00 AM',
      isNew: true
    },
    {
      id: '2',
      type: 'overdue',
      title: 'Return Overdue Alert',
      message: 'Jane Smith is overdue to return AST-103 (Lenovo ThinkPad X1 Carbon). Expected return date was 2024-06-12.',
      time: '09:00 AM',
      isNew: true
    }
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans flex relative overflow-hidden">
      {/* Dynamic Aurora Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-[#0a0f1d]/80 border-r border-slate-900/60 p-6 flex flex-col justify-between z-10 backdrop-blur-md">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Laptop className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">AssetFlow</h1>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold">Enterprise ERP</span>
            </div>
          </div>

          {/* User profile card */}
          <div className="bg-[#121829]/60 border border-slate-800/40 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-800/60 flex items-center justify-center font-bold text-indigo-400">
                A
              </div>
              <div>
                <h3 className="font-semibold text-sm">Alice Johnson</h3>
                <span className="text-[11px] text-slate-500">admin@company.com</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/40">
              <span className="text-slate-500">Current Role</span>
              <span className="px-2 py-0.5 rounded-md bg-rose-950/40 text-rose-400 border border-rose-900/40 font-semibold text-[10px] uppercase">
                {role}
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1.5">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'Asset Directory', icon: Folder },
              { name: 'Resource Booking', icon: Calendar },
              { name: 'Maintenance Hub', icon: Wrench },
              { name: 'Auditing Workspace', icon: ClipboardCheck },
              { name: 'Organization Setup', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121829]/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Hackathon Role Override Menu */}
        <div className="pt-4 border-t border-slate-900/60">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-2">Hackathon Role Override</label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full bg-[#121829] border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="Admin">Switch to Admin</option>
            <option value="Asset Manager">Switch to Manager</option>
            <option value="Auditor">Switch to Auditor</option>
            <option value="Employee">Switch to Employee</option>
          </select>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 p-8 overflow-y-auto z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Console Dashboard</h2>
            <p className="text-xs text-slate-500 mt-1">
              Welcome back, Alice Johnson. Viewing system metrics for <span className="text-indigo-400 font-semibold">{role}</span>.
            </p>
          </div>
          
          {/* Global search bar */}
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search assets, tag, or code..." 
              className="w-full bg-[#0d1324] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
            />
          </div>
        </div>

        {/* BENTO GRID KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Card 1: Total Inventory */}
          <div className="bg-[#0b0f1a]/80 border border-slate-850 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md hover:border-indigo-500/30 transition-all group">
            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 rounded-full bg-indigo-500/5 blur-xl group-hover:bg-indigo-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">Total Inventory Assets</span>
                <span className="text-4xl font-extrabold tracking-tight">9</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-950/40 text-indigo-400 border border-indigo-900/40">
                <Folder className="w-5 h-5" />
              </div>
            </div>
            <span className="text-xs text-slate-500">Total tracked assets in organization</span>
          </div>

          {/* Card 2: Ready / Available */}
          <div className="bg-[#0b0f1a]/80 border border-slate-850 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md hover:border-emerald-500/30 transition-all group">
            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 rounded-full bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">Ready / Available</span>
                <span className="text-4xl font-extrabold tracking-tight text-emerald-400">4</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <span className="text-xs text-slate-500">Assets ready for immediate allocation</span>
          </div>

          {/* Card 3: Active Bookings */}
          <div className="bg-[#0b0f1a]/80 border border-slate-850 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md hover:border-amber-500/30 transition-all group">
            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 rounded-full bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">Active Resource Bookings</span>
                <span className="text-4xl font-extrabold tracking-tight text-amber-400">2</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-950/40 text-amber-400 border border-amber-900/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <span className="text-xs text-slate-500">Approved shared resource bookings</span>
          </div>

          {/* Card 4: Overdue Returns */}
          <div className="bg-[#0b0f1a]/80 border border-slate-850 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md hover:border-rose-500/30 transition-all group">
            <div className="absolute top-[-10%] right-[-10%] w-24 h-24 rounded-full bg-rose-500/5 blur-xl group-hover:bg-rose-500/10 transition-all"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block mb-1">Overdue Returns</span>
                <span className="text-4xl font-extrabold tracking-tight text-rose-400">2</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-950/40 text-rose-400 border border-rose-900/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <span className="text-xs text-slate-500">Items past their expected return window</span>
          </div>
        </div>

        {/* TWO-COLUMN DETAILS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Table: Critical Overdue Returns (Wider) */}
          <div className="md:col-span-2 bg-[#0b0f1a]/80 border border-slate-900 rounded-2xl p-6 flex flex-col relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-sm tracking-wide">Critical Overdue Returns</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-rose-950/40 text-rose-400 border border-rose-900/40 font-semibold text-[10px]">
                2 Alerts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-900 pb-3">
                    <th className="font-semibold pb-3">Asset Info</th>
                    <th className="font-semibold pb-3">Holder</th>
                    <th className="font-semibold pb-3">Expected Return</th>
                    <th className="font-semibold pb-3">Allocated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {overdueAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4">
                        <span className="font-medium block text-slate-200">{asset.name}</span>
                        <span className="text-[10px] text-slate-600 block">{asset.tag}</span>
                      </td>
                      <td className="py-4 text-slate-300">{asset.holder}</td>
                      <td className="py-4 font-semibold text-rose-500">{asset.expectedReturn}</td>
                      <td className="py-4 text-slate-300">{asset.allocatedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts Center Widget (Narrower) */}
          <div className="bg-[#0b0f1a]/80 border border-slate-900 rounded-2xl p-6 flex flex-col backdrop-blur-md">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm tracking-wide">Alert Center</h3>
              </div>
              <button className="text-[10px] text-indigo-400 font-bold tracking-wider hover:text-indigo-300 transition-colors uppercase">
                Clear All
              </button>
            </div>

            {/* Notification items */}
            <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="bg-[#121829]/50 border border-slate-850 rounded-xl p-4 flex flex-col gap-1.5 hover:border-slate-800 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      {alert.title}
                    </span>
                    {alert.isNew && (
                      <span className="text-[9px] bg-indigo-950 text-indigo-400 border border-indigo-900/60 font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs leading-normal">{alert.message}</p>
                  <span className="text-[9px] text-slate-600 mt-1 self-start font-medium">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: MY ALLOCATED ASSETS */}
        <div className="bg-[#0b0f1a]/80 border border-slate-900 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm tracking-wide">My Allocated Assets</h3>
          </div>
          <div className="text-xs text-slate-500 italic py-2">
            You do not currently hold any checked-out assets. (Use the directory to allocate assets to yourself or others).
          </div>
        </div>
      </main>
    </div>
  );
}
