import { useState } from "react";
import { ScanLine, ShieldCheck, Plus, Lock, Calendar, ClipboardList } from "lucide-react";
import { BentoCard, StatusPill } from "./BentoCard";
import { Field, GhostButton, inputClass, Modal, PrimaryButton } from "./Modal";
import { isManagerial, useApp } from "../context/AppContext";
import { AuditEntry } from "../types";

const conditions: AuditEntry["condition"][] = ["Good", "Damaged", "Missing"];
const conditionTone: Record<AuditEntry["condition"], "green" | "amber" | "red"> = {
  Good: "green",
  Damaged: "amber",
  Missing: "red",
};

export function AuditingWorkspace() {
  const {
    assets,
    auditEntries,
    currentUser,
    role,
    assetByTag,
    logAudit,
    auditCycles,
    createAuditCycle,
    closeAuditCycle,
    employees,
    departments
  } = useApp();

  const [activeTab, setActiveTab] = useState<"cycles" | "workspace">("workspace");

  // Auditor workspace scanner state
  const [tag, setTag] = useState("");
  const [scanned, setScanned] = useState<ReturnType<typeof assetByTag>>(undefined);
  const [scanError, setScanError] = useState("");
  const [condition, setCondition] = useState<AuditEntry["condition"]>("Good");
  const [note, setNote] = useState("");

  // Audit cycle planner state
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    cycleName: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [newAssign, setNewAssign] = useState({
    auditorId: "",
    departmentId: "",
    categoryId: "",
  });

  const manager = isManagerial(role);

  const scan = () => {
    if (!tag.trim()) return;
    const found = assetByTag(tag);
    if (found) {
      setScanned(found);
      setScanError("");
    } else {
      setScanned(undefined);
      setScanError(`No asset found for tag "${tag}".`);
    }
  };

  const save = () => {
    if (!scanned) return;
    logAudit({
      assetTag: scanned.assetTag,
      condition,
      note,
      auditor: currentUser.name,
    });
    setTag("");
    setScanned(undefined);
    setNote("");
    setCondition("Good");
  };

  const addAssignmentScope = () => {
    const auditor = newAssign.auditorId || (employees.filter(e => e.role === "auditor" || e.role === "manager")[0]?.id) || employees[0]?.id;
    if (!auditor) return;
    setAssignmentsList([
      ...assignmentsList,
      {
        auditorId: auditor,
        departmentId: newAssign.departmentId || null,
        categoryId: newAssign.categoryId || null
      }
    ]);
    setNewAssign({ auditorId: "", departmentId: "", categoryId: "" });
  };

  const submitAuditCycle = async () => {
    if (!cycleForm.cycleName) return;
    const scopes = assignmentsList.length > 0 ? assignmentsList : [{
      auditorId: currentUser.id,
      departmentId: null,
      categoryId: null
    }];
    await createAuditCycle(cycleForm.cycleName, cycleForm.startDate, cycleForm.endDate, currentUser.id, scopes);
    setCycleModalOpen(false);
    setAssignmentsList([]);
    setCycleForm({
      cycleName: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
  };

  const verified = auditEntries.length;
  const discrepancies = auditEntries.filter((e) => e.condition !== "Good").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="tracking-tight">Auditing Workspace</h1>
        <p className="text-muted-foreground mt-1">
          Perform inventory scans, assign verification scopes, and trace discrepancy reports.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "workspace"
              ? "border-emerald-400 text-emerald-300"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Auditor Workspace
        </button>
        {manager && (
          <button
            onClick={() => setActiveTab("cycles")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "cycles"
                ? "border-emerald-400 text-emerald-300"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Audit Cycle Planner
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "workspace" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Scan + condition */}
          <BentoCard
            glow
            title="Scan Asset Tag"
            icon={<ScanLine className="size-4" />}
            className="lg:col-span-1"
          >
            <div className="flex items-center gap-2">
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scan()}
                placeholder="e.g. AST-101"
                className={inputClass}
              />
              <button
                onClick={scan}
                className="shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2.5 text-sm text-emerald-200 hover:bg-emerald-400/15 transition-colors font-semibold"
              >
                Scan
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Try: {assets.slice(0, 3).map((a) => a.assetTag).join(", ") || "AST-01"}
            </p>

            {scanError && (
              <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-xs text-rose-300">
                {scanError}
              </div>
            )}

            {scanned && (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-border bg-white/[0.02] p-3">
                  <div className="text-sm font-semibold">{scanned.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-[var(--font-mono)]">{scanned.assetTag}</span>
                    <span>•</span>
                    <span>{scanned.location}</span>
                  </div>
                  <div className="mt-2">
                    <StatusPill tone="muted">{scanned.status}</StatusPill>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground font-semibold">Asset Condition Status</span>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {conditions.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCondition(c)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                          condition === c
                            ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Verification note comments..."
                  className={inputClass}
                />

                <button
                  onClick={save}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-[#06231a] font-[var(--font-display)] font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #34d399, #2dd4bf)",
                    boxShadow: "0 12px 30px -12px rgba(52,211,153,0.7)",
                  }}
                >
                  Log Verification
                </button>
              </div>
            )}
          </BentoCard>

          {/* Summary + trail */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <BentoCard>
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center size-10 rounded-xl bg-emerald-400/15 text-emerald-300">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground">Verified Items</div>
                    <div className="font-[var(--font-display)] text-2xl font-extrabold mt-0.5">
                      {verified}
                    </div>
                  </div>
                </div>
              </BentoCard>
              <BentoCard>
                <div className="text-xs text-muted-foreground">Discrepancy Alerts</div>
                <div className="mt-2 font-[var(--font-display)] text-2xl font-extrabold text-amber-300">
                  {discrepancies}
                </div>
              </BentoCard>
              <BentoCard>
                <div className="text-xs text-muted-foreground">Active Auditor</div>
                <div className="mt-1 text-sm font-semibold">{currentUser.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{currentUser.role}</div>
              </BentoCard>
            </div>

            <BentoCard title="Asset Verification Log">
              {auditEntries.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  No verifications logged yet. Scan an asset tag to begin your audit.
                </div>
              ) : (
                <div className="relative pl-6">
                  <span className="absolute left-[7px] top-1 bottom-1 w-px bg-white/10" />
                  <div className="space-y-5">
                    {auditEntries.map((e) => (
                      <div key={e.id} className="relative">
                        <span className="absolute -left-[22px] top-1.5 size-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/15" />
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">
                            Verified{" "}
                            <span className="font-[var(--font-mono)] text-emerald-300 text-xs font-normal ml-1">
                              {e.assetTag}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground font-[var(--font-mono)] shrink-0">
                            {e.time}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Auditor: {e.auditor}</span>
                          <span>•</span>
                          <StatusPill tone={conditionTone[e.condition]}>
                            {e.condition}
                          </StatusPill>
                          {e.note && <span className="text-foreground">— {e.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </BentoCard>
          </div>
        </div>
      )}

      {activeTab === "cycles" && manager && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold">Planned & Active Audit Cycles</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-normal">Define audit scopes and closure thresholds.</p>
            </div>
            <PrimaryButton onClick={() => setCycleModalOpen(true)}>
              <Plus className="size-4 mr-1.5" />
              Schedule Audit Cycle
            </PrimaryButton>
          </div>

          <div className="grid gap-6">
            {auditCycles.map((c) => (
              <BentoCard
                key={c.id}
                title={c.cycleName}
                icon={<ClipboardList className="size-4 text-emerald-300" />}
                action={
                  <div className="flex items-center gap-2.5">
                    <StatusPill tone={c.status === "Completed" ? "green" : "amber"}>{c.status}</StatusPill>
                    {c.status === "In Progress" && (
                      <button
                        onClick={() => closeAuditCycle(c.id)}
                        className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/15 transition-colors font-semibold"
                      >
                        <Lock className="size-3" />
                        Close & Conclude
                      </button>
                    )}
                  </div>
                }
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-1">
                  <div>
                    <span className="text-muted-foreground block">Period Scope</span>
                    <span className="font-semibold mt-0.5 block">{c.startDate} to {c.endDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Created By</span>
                    <span className="font-semibold mt-0.5 block">{c.creatorName || "Manager"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Cycle Status</span>
                    <span className="font-semibold mt-0.5 block">{c.status}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Audit Type</span>
                    <span className="font-semibold mt-0.5 block">Full Internal Verification</span>
                  </div>
                </div>
              </BentoCard>
            ))}
            {auditCycles.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No audit cycles registered. Schedule a cycle to assign auditors.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Audit Cycle Modal */}
      <Modal
        open={cycleModalOpen}
        onClose={() => setCycleModalOpen(false)}
        title="Schedule Structured Audit Cycle"
        subtitle="Specify cycle dates and scope auditor assignments."
        footer={
          <>
            <GhostButton onClick={() => setCycleModalOpen(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={submitAuditCycle}>Schedule Cycle</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Cycle Title Name">
            <input
              className={inputClass}
              value={cycleForm.cycleName}
              onChange={(e) => setCycleForm({ ...cycleForm, cycleName: e.target.value })}
              placeholder="e.g. Q3 Hardware Audit Cycle"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <input
                type="date"
                className={inputClass}
                value={cycleForm.startDate}
                onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
              />
            </Field>
            <Field label="End Date">
              <input
                type="date"
                className={inputClass}
                value={cycleForm.endDate}
                onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
              />
            </Field>
          </div>

          <div className="border-t border-border/40 pt-3">
            <span className="text-xs text-muted-foreground block font-semibold mb-2">Auditor Assignments Scope</span>
            <div className="space-y-2 mb-3">
              {assignmentsList.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs border border-border bg-white/[0.01] rounded-xl px-3 py-2">
                  <span>
                    <strong>Auditor:</strong> {employees.find(e => e.id === a.auditorId)?.name || "Auditor"}
                  </span>
                  <span>
                    <strong>Dept:</strong> {a.departmentId ? departments.find(d => String(d.id) === a.departmentId)?.name : "All"}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <select
                className="rounded-lg border border-border bg-[#0e121a] px-2.5 py-2 text-xs text-foreground outline-none"
                value={newAssign.auditorId}
                onChange={(e) => setNewAssign({ ...newAssign, auditorId: e.target.value })}
              >
                <option value="">Select Auditor...</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id} className="bg-[#10141d]">{e.name}</option>
                ))}
              </select>
              <select
                className="rounded-lg border border-border bg-[#0e121a] px-2.5 py-2 text-xs text-foreground outline-none"
                value={newAssign.departmentId}
                onChange={(e) => setNewAssign({ ...newAssign, departmentId: e.target.value })}
              >
                <option value="">Select Department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id} className="bg-[#10141d]">{d.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addAssignmentScope}
                className="rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold py-2 hover:bg-emerald-400/15 transition-colors"
              >
                Add Scope
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
