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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#060a14' }}>
        {/* Aurora glows on loading screen */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none aurora-glow-1" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none aurora-glow-2" />
        <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin relative z-10" />
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase relative z-10">Initializing AssetFlow Engine...</p>
      </div>
    );
  }

  if (!currentUser || !currentRole) {
    return <Auth />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':    return <Dashboard />;
      case 'assets':       return <AssetDirectory />;
      case 'booking':      return <ResourceBooking />;
      case 'maintenance':  return <MaintenanceHub />;
      case 'audit':
        if (!['Admin', 'Asset Manager'].includes(currentRole)) {
          return <AccessDeniedRequiredRole role="Asset Manager or Admin" />;
        }
        return <AssetAudit />;
      case 'org-setup':
        if (currentRole !== 'Admin') {
          return <AccessDeniedRequiredRole role="Administrator" />;
        }
        return <OrgSetup />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden select-none" style={{ background: '#060a14' }}>
      {/* Global aurora background glows — fixed behind everything */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-indigo-600/8 blur-[160px] aurora-glow-1" />
        <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] rounded-full bg-purple-600/8 blur-[160px] aurora-glow-2" />
        <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[130px] aurora-glow-3" />
        {/* Subtle horizon lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/10 to-transparent" />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main viewport */}
      <main className="flex-grow overflow-hidden flex flex-col relative z-10" style={{ background: 'transparent' }}>
        <div className="flex-grow h-full flex flex-col overflow-y-auto p-8">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

const AccessDeniedRequiredRole: React.FC<{ role: string }> = ({ role }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center bg-navy-800/60 border border-slate-800/50 rounded-3xl p-12 text-center shadow-xl max-w-2xl mx-auto my-auto animate-scale-in gap-5 backdrop-blur-md">
      <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-rose-400">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-200">Authorization Required</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          Your current role is insufficient. This dashboard requires{' '}
          <span className="font-bold text-indigo-400">{role}</span> privileges.
        </p>
      </div>
      <div className="bg-navy-950 p-4 rounded-xl border border-slate-800/60 w-full max-w-md font-mono text-[10px] text-slate-500 text-left flex gap-2">
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
