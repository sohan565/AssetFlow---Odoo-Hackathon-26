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

  // Define navigation tabs based on role
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] 
    },
    { 
      id: 'assets', 
      label: 'Asset Directory', 
      icon: FolderTree, 
      roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] 
    },
    { 
      id: 'booking', 
      label: 'Resource Booking', 
      icon: CalendarRange, 
      roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] 
    },
    { 
      id: 'maintenance', 
      label: 'Maintenance Hub', 
      icon: Wrench, 
      roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'] // All can see, but controls will be guarded
    },
    { 
      id: 'audit', 
      label: 'Auditing Workspace', 
      icon: ClipboardCheck, 
      roles: ['Admin', 'Asset Manager'] 
    },
    { 
      id: 'org-setup', 
      label: 'Organization Setup', 
      icon: Settings, 
      roles: ['Admin'] 
    }
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-80 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6 shrink-0 z-10">
      <div className="flex flex-col gap-8">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">AssetFlow</h1>
            <span className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">Enterprise ERP</span>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-slate-950/50 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold text-lg">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-100 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-1">
            <span className="text-xs text-slate-400">Current Role</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
              currentRole === 'Admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
              currentRole === 'Asset Manager' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
              currentRole === 'Department Head' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {currentRole}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col gap-1.5">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent hover:border-slate-850'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-800/80 pt-4">
        {/* Hackathon Role Switcher (Developer utility) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Hackathon Role Overrides
          </label>
          <select
            value={currentRole}
            onChange={(e) => {
              const selectedRole = e.target.value as UserRole;
              overrideRole(selectedRole);
              // Fallback default tabs if switched out of admin or manager
              if (selectedRole === 'Employee' && ['org-setup', 'audit'].includes(currentTab)) {
                setCurrentTab('dashboard');
              } else if (selectedRole === 'Department Head' && ['org-setup', 'audit'].includes(currentTab)) {
                setCurrentTab('dashboard');
              } else if (selectedRole === 'Asset Manager' && currentTab === 'org-setup') {
                setCurrentTab('dashboard');
              }
            }}
            className="w-full bg-slate-950 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
          >
            {roles.map(r => (
              <option key={r} value={r} className="bg-slate-950 text-slate-300">
                🔧 Switch to {r}
              </option>
            ))}
          </select>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition-all"
        >
          <LogOut className="w-5 h-5 text-rose-400" />
          Logout System
        </button>
      </div>
    </aside>
  );
};
