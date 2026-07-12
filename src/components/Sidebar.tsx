import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../services/types';
import {
  LayoutDashboard,
  FolderTree,
  CalendarRange,
  Wrench,
  ClipboardCheck,
  Settings,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { currentUser, currentRole, logout, overrideRole } = useAuth();

  if (!currentUser || !currentRole) return null;

  const roles: UserRole[] = ['Employee', 'Department Head', 'Asset Manager', 'Admin'];

  const navItems = [
    { id: 'dashboard',   label: 'Dashboard',           icon: LayoutDashboard, roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'assets',      label: 'Asset Directory',      icon: FolderTree,      roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'booking',     label: 'Resource Booking',     icon: CalendarRange,   roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'maintenance', label: 'Maintenance Hub',      icon: Wrench,          roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] },
    { id: 'audit',       label: 'Auditing Workspace',   icon: ClipboardCheck,  roles: ['Admin', 'Asset Manager'] },
    { id: 'org-setup',   label: 'Organization Setup',   icon: Settings,        roles: ['Admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentRole));

  const rolePillStyle = {
    Admin:            'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'Asset Manager':  'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'Department Head':'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    Employee:         'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };

  return (
    <aside
      className="w-72 h-screen flex flex-col justify-between p-5 shrink-0 z-20 border-r border-slate-800/40"
      style={{ background: 'rgba(8, 13, 26, 0.85)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex flex-col gap-7">
        {/* ── Brand ── */}
        <div className="flex items-center gap-3 px-1 pt-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              AssetFlow
            </h1>
            <span className="text-[10px] font-semibold tracking-widest text-indigo-400 uppercase">Enterprise ERP</span>
          </div>
        </div>

        {/* ── User Card ── */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3 border border-slate-700/30"
          style={{ background: 'rgba(15, 22, 40, 0.7)', backdropFilter: 'blur(10px)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-indigo-300 font-bold text-base border border-indigo-500/20"
              style={{ background: 'rgba(99,102,241,0.1)' }}
            >
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-100 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-700/30 pt-2.5">
            <span className="text-xs text-slate-500">Current Role</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${rolePillStyle[currentRole as keyof typeof rolePillStyle] || ''}`}>
              {currentRole}
            </span>
          </div>
        </div>

        {/* ── Nav Links ── */}
        <nav className="flex flex-col gap-1">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group text-left ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
                style={
                  isActive
                    ? { background: 'linear-gradient(135deg, #6366f1, #7c3aed)', boxShadow: '0 4px 15px rgba(99,102,241,0.2)' }
                    : {}
                }
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.08)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '';
                }}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-col gap-3 border-t border-slate-700/30 pt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-600 px-1">
            Hackathon Role Override
          </label>
          <select
            value={currentRole}
            onChange={e => {
              const selectedRole = e.target.value as UserRole;
              overrideRole(selectedRole);
              if (['Employee', 'Department Head'].includes(selectedRole) && ['org-setup', 'audit'].includes(currentTab)) {
                setCurrentTab('dashboard');
              } else if (selectedRole === 'Asset Manager' && currentTab === 'org-setup') {
                setCurrentTab('dashboard');
              }
            }}
            className="w-full text-indigo-300 text-xs px-3 py-2.5 rounded-xl focus:outline-none transition-all font-semibold border border-indigo-500/20"
            style={{ background: 'rgba(99,102,241,0.07)' }}
          >
            {roles.map(r => (
              <option key={r} value={r} style={{ background: '#0c1120', color: '#cbd5e1' }}>
                🔧 Switch to {r}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 transition-all hover:text-rose-300"
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ''; }}
        >
          <LogOut className="w-4 h-4" />
          Logout System
        </button>
      </div>
    </aside>
  );
};
