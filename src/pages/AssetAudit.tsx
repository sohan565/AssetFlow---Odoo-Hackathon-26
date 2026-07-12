import React, { useState, useEffect } from 'react';

import { getAudits, checkAuditAsset, completeAudit, getAssets } from '../services/api';
import type { Audit, Asset } from '../services/types';
import { useToast } from '../components/Toast';
import { 
  ClipboardCheck, 
  Calendar, 
  Check, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  FileBarChart2,
  Clock,
  Printer
} from 'lucide-react';

export const AssetAudit: React.FC = () => {
  const { showToast } = useToast();

  // Data State
  const [audits, setAudits] = useState<Audit[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Selection state
  const [activeAudit, setActiveAudit] = useState<Audit | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Finalize checklist modal
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
  const [finalSummary, setFinalSummary] = useState('');

  // Asset Checklist Notes State
  const [checklistNotes, setChecklistNotes] = useState<Record<string, string>>({});

  const loadData = () => {
    setAudits(getAudits());
    setAssets(getAssets());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartAudit = (audit: Audit) => {
    setActiveAudit(audit);
    setIsAuditing(true);
    // In our state engine we keep track locally
    showToast(`Audit workspace opened for "${audit.title}"`, 'info');
  };

  const handleCheckItem = (assetTag: string, status: 'Verified' | 'Missing' | 'Damaged') => {
    if (!activeAudit) return;

    try {
      const note = checklistNotes[assetTag] || '';
      checkAuditAsset(activeAudit.id, assetTag, status, note);
      
      // Update locally
      const updatedAudits = getAudits();
      const current = updatedAudits.find(a => a.id === activeAudit.id);
      if (current) {
        setActiveAudit(current);
      }

      if (status === 'Missing') {
        showToast(`Asset "${assetTag}" flagged missing and transitioned status to "Lost".`, 'warning');
      } else if (status === 'Damaged') {
        showToast(`Asset "${assetTag}" flagged damaged. Auto-opened a new repair request.`, 'warning');
      } else {
        showToast(`Asset "${assetTag}" verified.`, 'success');
      }
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleFinalizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAudit || !finalSummary.trim()) return;

    try {
      completeAudit(activeAudit.id, finalSummary.trim());
      showToast('Audit checklist finalized and discrepancy report generated!', 'success');
      setIsFinalizeOpen(false);
      setIsAuditing(false);
      setActiveAudit(null);
      setFinalSummary('');
      setChecklistNotes({});
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleNoteChange = (assetTag: string, noteVal: string) => {
    setChecklistNotes(prev => ({
      ...prev,
      [assetTag]: noteVal
    }));
  };

  return (
    <div className="flex flex-col gap-6 w-full overflow-y-auto max-h-[105vh] pb-10 pr-2">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Asset Auditing Workspace</h2>
          <p className="text-xs text-slate-400">Perform physical stock verification checks, locate missing equipment, and publish discrepancy logs.</p>
        </div>
      </div>

      {isAuditing && activeAudit ? (
        // -----------------------------------------------------------------
        // AUDITING LIST WORKSPACE VIEW
        // -----------------------------------------------------------------
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Active Checklist */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
            <div className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-900/60">
              <div>
                <h3 className="font-semibold text-sm text-slate-200">Checking: {activeAudit.title}</h3>
                <p className="text-[10px] text-slate-450 mt-0.5">Assigned Auditor: {activeAudit.auditorName}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAuditing(false);
                    setActiveAudit(null);
                    setChecklistNotes({});
                  }}
                  className="bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-250 border border-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                >
                  Exit Session
                </button>
                <button
                  onClick={() => setIsFinalizeOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
                >
                  Finalize Audit
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[500px] flex flex-col gap-4">
              {assets.filter(a => !['Retired', 'Disposed'].includes(a.status)).map(asset => {
                const checkStatus = activeAudit.checkedAssets[asset.tag]?.status;
                
                return (
                  <div 
                    key={asset.tag}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      checkStatus === 'Verified' ? 'bg-emerald-950/10 border-emerald-900/30' :
                      checkStatus === 'Missing' ? 'bg-rose-950/10 border-rose-900/30' :
                      checkStatus === 'Damaged' ? 'bg-amber-950/10 border-amber-900/30' :
                      'bg-slate-950 border-slate-850'
                    }`}
                  >
                    {/* Asset details */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 font-mono">{asset.tag}</span>
                        <span className="text-[10px] text-slate-500">ΓÇó {asset.categoryName}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-250 mt-1 font-outfit">{asset.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Current Status: <span className="text-slate-400 font-semibold">{asset.status}</span> | Loc: <span className="text-slate-400">{asset.location}</span></p>
                      
                      {/* Input Note */}
                      <input
                        type="text"
                        placeholder="Add verification notes (optional)..."
                        value={checklistNotes[asset.tag] || activeAudit.checkedAssets[asset.tag]?.notes || ''}
                        onChange={(e) => handleNoteChange(asset.tag, e.target.value)}
                        className="bg-slate-900 border border-slate-800/80 text-[10px] rounded px-2.5 py-1.5 text-slate-300 w-full mt-2.5 max-w-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Action checks */}
                    <div className="flex items-center gap-2 shrink-0 md:justify-end">
                      <button
                        onClick={() => handleCheckItem(asset.tag, 'Verified')}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                          checkStatus === 'Verified'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-emerald-700/40'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Verify
                      </button>
                      <button
                        onClick={() => handleCheckItem(asset.tag, 'Missing')}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                          checkStatus === 'Missing'
                            ? 'bg-rose-600 border-rose-600 text-white shadow-lg'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/40'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Missing
                      </button>
                      <button
                        onClick={() => handleCheckItem(asset.tag, 'Damaged')}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${
                          checkStatus === 'Damaged'
                            ? 'bg-amber-600 border-amber-600 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-900/40'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Damaged
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guidelines info */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ClipboardCheck className="w-4.5 h-4.5 text-indigo-400" /> Auditor Instructions
            </h3>
            <div className="text-xs text-slate-400 flex flex-col gap-3.5 leading-relaxed font-medium">
              <p>≡ƒôì Complete the checklist by verifying the location and physical status of every non-decommissioned corporate asset.</p>
              <p className="bg-rose-950/20 border border-rose-900/30 p-3 rounded-xl text-rose-400">
                ΓÜá∩╕Å Marking an asset as <span className="font-bold">"Missing"</span> immediately updates the SQLite state engine, setting status to <span className="font-bold">"Lost"</span> and dispatching alerts to administrators.
              </p>
              <p className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-xl text-amber-400">
                ≡ƒöº Marking an asset as <span className="font-bold">"Damaged"</span> automatically logs a maintenance request under the hub and shifts the status to <span className="font-bold">"Under Maintenance"</span>.
              </p>
              <p>≡ƒôä Finalizing compiles details into the corporate discrepancy report and saves it to SQLite database archives.</p>
            </div>
          </div>

        </div>
      ) : (
        // -----------------------------------------------------------------
        // AUDITS SCHEDULE & ARCHIVE LIST VIEW
        // -----------------------------------------------------------------
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Scheduled & Active Audits */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Clock className="w-4.5 h-4.5 text-indigo-400" /> Scheduled Audits
              </h3>

              <div className="flex flex-col gap-4">
                {audits.filter(a => a.status !== 'Completed').map(aud => (
                  <div key={aud.id} className="bg-slate-950 border border-slate-805 p-4 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700 transition-all">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 font-outfit">{aud.title}</h4>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2.5">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Planned: {aud.scheduledDate}</span>
                        <span>ΓÇó Auditor: {aud.auditorName}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartAudit(aud)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                    >
                      <ClipboardCheck className="w-4 h-4" /> Start Audit
                    </button>
                  </div>
                ))}
                {audits.filter(a => a.status !== 'Completed').length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No scheduled audits planned.</p>
                )}
              </div>
            </div>

            {/* Audit History / Reports Archives */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileText className="w-4.5 h-4.5 text-indigo-400" /> Archived Discrepancy Reports
              </h3>

              <div className="flex flex-col gap-5">
                {audits.filter(a => a.status === 'Completed').map(aud => (
                  <div key={aud.id} className="bg-slate-950 border border-slate-850 p-6 rounded-2xl flex flex-col gap-4 shadow-sm border-t-2 border-t-indigo-500">
                    
                    {/* Discrepancy Report Header */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Stock Verification report</span>
                        <h4 className="text-sm font-bold text-slate-250 font-outfit mt-1">{aud.title}</h4>
                        <div className="text-[10px] text-slate-500 flex items-center gap-3 mt-1.5">
                          <span>Finalized: {aud.completedDate}</span>
                          <span>Auditor: {aud.auditorName}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => window.print()}
                        className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
                        title="Print Report"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* PDF Style Details metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                      <div className="flex flex-col gap-1 border-r border-slate-850 pr-2">
                        <span className="text-[9px] font-semibold text-slate-500 uppercase">Checked</span>
                        <span className="text-lg font-bold text-slate-200">{aud.discrepancyReport?.totalChecked || 0}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-r border-slate-850 px-2">
                        <span className="text-[9px] font-semibold text-slate-500 uppercase">Verified</span>
                        <span className="text-lg font-bold text-emerald-400">{aud.discrepancyReport?.verified || 0}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-r border-slate-850 px-2">
                        <span className="text-[9px] font-semibold text-slate-500 uppercase">Missing</span>
                        <span className="text-lg font-bold text-rose-500">{aud.discrepancyReport?.missingCount || 0}</span>
                      </div>
                      <div className="flex flex-col gap-1 pl-2">
                        <span className="text-[9px] font-semibold text-slate-500 uppercase">Damaged</span>
                        <span className="text-lg font-bold text-amber-500">{aud.discrepancyReport?.damagedCount || 0}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-450 bg-slate-900/20 border border-slate-900 p-3 rounded-lg flex flex-col gap-2">
                      <p className="font-bold text-slate-350">Summary Findings:</p>
                      <p className="italic">" {aud.discrepancyReport?.summary} "</p>
                    </div>

                    {/* Discrepancy item lists */}
                    {(aud.discrepancyReport?.missingTags && aud.discrepancyReport.missingTags.length > 0) && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase text-rose-500 tracking-wider">Missing Tags List (Action required)</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {aud.discrepancyReport.missingTags.map(t => (
                            <span key={t} className="bg-rose-500/10 text-rose-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-rose-500/20">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(aud.discrepancyReport?.damagedTags && aud.discrepancyReport.damagedTags.length > 0) && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold uppercase text-amber-500 tracking-wider">Damaged Tags List (Under servicing)</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {aud.discrepancyReport.damagedTags.map(t => (
                            <span key={t} className="bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/20">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {audits.filter(a => a.status === 'Completed').length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-6">No completed audit reports recorded.</p>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar statistics summary */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-4 shadow-xl h-fit">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileBarChart2 className="w-4.5 h-4.5 text-indigo-400" /> Stock Statistics
            </h3>
            <div className="flex flex-col gap-4 text-xs font-semibold text-slate-400">
              <div className="flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                <span className="text-slate-500">Completed Reports</span>
                <span className="text-slate-200">{audits.filter(a => a.status === 'Completed').length}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                <span className="text-slate-500">Unresolved Missing Items</span>
                <span className="text-rose-500">{assets.filter(a => a.status === 'Lost').length} Lost</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                <span className="text-slate-500">Currently in Service</span>
                <span className="text-amber-500">{assets.filter(a => a.status === 'Under Maintenance').length} Units</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Modal: Finalize Audit Form */}
      {isFinalizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col gap-4 animate-scale-in">
            
            <div className="flex items-center gap-2 text-indigo-400">
              <CheckCircle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-slate-250 font-outfit">Finalize Physical Audit</h3>
            </div>

            <form onSubmit={handleFinalizeSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Audit Discrepancy Findings Summary</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide an executive summary of findings. Include notes on missing assets, damaged units found, storage rooms organization, or discrepancies..."
                  value={finalSummary}
                  onChange={(e) => setFinalSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 rounded-xl px-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsFinalizeOpen(false)}
                  className="bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-250 hover:bg-slate-850 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/10"
                >
                  Publish Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
