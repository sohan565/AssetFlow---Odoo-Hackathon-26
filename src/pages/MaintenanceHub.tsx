import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMaintenances, updateMaintenanceStatus } from '../services/api';
import type { Maintenance } from '../services/types';
import { useToast } from '../components/Toast';
import { 
  Wrench, 
  Hourglass, 
  Play, 
  CheckCircle2, 
  DollarSign, 
  MessageSquareCode,
  CalendarCheck
} from 'lucide-react';

export const MaintenanceHub: React.FC = () => {
  const { currentRole } = useAuth();
  const { showToast } = useToast();
  
  // Data State
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);

  // Resolution Form State
  const [selectedMntId, setSelectedMntId] = useState<string | null>(null);
  const [resolveCost, setResolveCost] = useState<number>(0);
  const [resolveNotes, setResolveNotes] = useState('');

  const loadData = () => {
    setMaintenances(getMaintenances());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = (id: string) => {
    try {
      updateMaintenanceStatus(id, 'Approved');
      showToast('Maintenance request approved! Asset state updated to "Under Maintenance".', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMntId) return;

    try {
      updateMaintenanceStatus(selectedMntId, 'Resolved', Number(resolveCost), resolveNotes.trim());
      showToast('Repair resolved successfully. Asset restored to "Available" status.', 'success');
      setSelectedMntId(null);
      setResolveCost(0);
      setResolveNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Group by status
  const pendingRequests = maintenances.filter(m => m.status === 'Pending');
  const inProgressRequests = maintenances.filter(m => m.status === 'In Progress' || m.status === 'Approved');
  const resolvedRequests = maintenances.filter(m => m.status === 'Resolved');

  const canManage = ['Admin', 'Asset Manager', 'Department Head'].includes(currentRole || '');

  return (
    <div className="flex flex-col gap-6 w-full overflow-y-auto max-h-[105vh] pb-10 pr-2">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Maintenance Hub</h2>
          <p className="text-xs text-slate-400">Track and approve hardware servicing workflows, and manage repair logs.</p>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Column 1: Pending */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-md min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-amber-400">
            <div className="flex items-center gap-2">
              <Hourglass className="w-4 h-4" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-200">Pending Approval</h3>
            </div>
            <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded font-bold">
              {pendingRequests.length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {pendingRequests.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No pending repair requests.</p>
            ) : (
              pendingRequests.map(m => (
                <div key={m.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3 shadow hover:border-slate-700/60 transition-all">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono">{m.assetTag}</span>
                      <span className="text-[9px] font-bold text-slate-500">{m.requestDate}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mt-1 font-outfit truncate">{m.assetName}</h4>
                    <p className="text-[11px] text-slate-450 leading-relaxed mt-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-900">
                      {m.description}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-900/80">
                    <span>By: {m.requesterName}</span>
                    {canManage && (
                      <button
                        onClick={() => handleApprove(m.id)}
                        className="flex items-center gap-1 bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                      >
                        <Play className="w-3 h-3" /> Approve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-md min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-indigo-400">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-200">In Repair Pipeline</h3>
            </div>
            <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-0.5 rounded font-bold">
              {inProgressRequests.length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {inProgressRequests.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No active repairs in progress.</p>
            ) : (
              inProgressRequests.map(m => (
                <div key={m.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 shadow hover:border-slate-750 transition-all">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono">{m.assetTag}</span>
                      <span className="bg-indigo-500/10 text-indigo-400 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-indigo-500/20">
                        In Progress
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mt-1 font-outfit truncate">{m.assetName}</h4>
                    <p className="text-[11px] text-slate-450 leading-relaxed mt-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-900">
                      {m.description}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-900/80">
                    <span>By: {m.requesterName}</span>
                    {canManage && (
                      <button
                        onClick={() => setSelectedMntId(m.id)}
                        className="flex items-center gap-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Resolved */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-md min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-200">Resolved Archive</h3>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded font-bold">
              {resolvedRequests.length}
            </span>
          </div>

          <div className="flex flex-col gap-3 animate-fade-in">
            {resolvedRequests.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No resolved archives found.</p>
            ) : (
              resolvedRequests.map(m => (
                <div key={m.id} className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 opacity-75 hover:opacity-100 transition-all">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold text-slate-500 font-mono">{m.assetTag}</span>
                      <span className="text-[9px] text-slate-600">{m.resolutionDate}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-300 mt-1 font-outfit truncate">{m.assetName}</h4>
                  </div>
                  
                  <div className="bg-slate-900/20 border border-slate-900 p-2.5 rounded-lg text-[10px] text-slate-450 flex flex-col gap-1.5 font-medium">
                    <p className="italic">"{m.notes || 'No resolution notes provided.'}"</p>
                    <p className="flex justify-between border-t border-slate-900/60 pt-1.5 text-slate-500">
                      <span>Repair Cost</span>
                      <span className="text-emerald-400 font-bold">${m.cost?.toLocaleString() || 0}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Resolve Repair Form */}
      {selectedMntId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 animate-scale-in">
            
            <div className="flex items-center gap-2 text-emerald-400">
              <CalendarCheck className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-200 font-outfit">Resolve Asset Repair</h3>
            </div>

            <form onSubmit={handleResolveSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Total Repair Invoice ($ USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={resolveCost || ''}
                    onChange={(e) => setResolveCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Resolution Checkup Notes</label>
                <textarea
                  required
                  rows={4}
                  placeholder="e.g. Swapped bloated battery with original factory unit. Restored thermal paste. Tested and verified boot cycles."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex gap-2 items-start text-[10px] font-semibold leading-relaxed">
                <MessageSquareCode className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Completing this service order automatically triggers the SQLite database wrapper. The asset status will reset back to "Available".</p>
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMntId(null);
                    setResolveCost(0);
                    setResolveNotes('');
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-250 hover:bg-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
