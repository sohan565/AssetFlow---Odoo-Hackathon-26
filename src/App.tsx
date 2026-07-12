import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { Sidebar } from './components/Sidebar';

// Pages
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { AssetDirectory } from './pages/AssetDirectory';
import { ResourceBooking } from './pages/ResourceBooking';
import { MaintenanceHub } from './pages/MaintenanceHub';
import { AssetAudit } from './pages/AssetAudit';
import { OrgSetup } from './pages/OrgSetup';

// Icons for Guards
import { ShieldAlert, Terminal } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, currentRole, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">Initializing Core ERP Engine...</p>
      </div>
    );
  }

  // Not logged in -> Auth Screen
  if (!currentUser || !currentRole) {
    return <Auth />;
  }

  // Route guarding helper
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'assets':
        return <AssetDirectory />;
      case 'booking':
        return <ResourceBooking />;
      case 'maintenance':
        return <MaintenanceHub />;
      
      case 'audit':
        // Guard check: Manager / Admin
        if (!['Admin', 'Asset Manager'].includes(currentRole)) {
          return <AccessDeniedRequiredRole role="Asset Manager or Admin" />;
        }
        return <AssetAudit />;

      case 'org-setup':
        // Guard check: Admin only
        if (currentRole !== 'Admin') {
          return <AccessDeniedRequiredRole role="Administrator" />;
        }
        return <OrgSetup />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Sidebar Navigation Panel */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Console Viewport */}
      <main className="flex-grow p-8 overflow-hidden bg-slate-950 flex flex-col gap-6 relative">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Viewport Content */}
        <div className="relative z-10 flex-grow h-full flex flex-col">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

// Access Denied Component
const AccessDeniedRequiredRole: React.FC<{ role: string }> = ({ role }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center shadow-xl max-w-2xl mx-auto my-auto animate-scale-in gap-5">
      <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-rose-400">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-200 font-outfit">Authorization Required</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          Your current security token role is insufficient. Accessing this dashboard requires standard <span className="font-bold text-indigo-400">{role}</span> privileges.
        </p>
      </div>
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 w-full max-w-md font-mono text-[10px] text-slate-500 text-left flex gap-2">
        <Terminal className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        <div>
          <p># Security Exception Raised</p>
          <p>ERROR: ROLE_UNAUTHORIZED</p>
          <p>ACTION: BLOCK_VIEWPORT_NAVIGATION</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
