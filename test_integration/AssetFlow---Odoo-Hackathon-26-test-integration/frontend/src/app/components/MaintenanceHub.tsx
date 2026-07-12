import { useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { BentoCard, StatusPill } from "./BentoCard";
import { Field, GhostButton, inputClass, Modal, PrimaryButton } from "./Modal";
import { isManagerial, useApp } from "../context/AppContext";
import { TicketPriority, TicketStatus } from "../types";

const priorityTone: Record<TicketPriority, "red" | "amber" | "blue"> = {
  High: "red",
  Medium: "amber",
  Low: "blue",
};

const COLUMNS: { key: TicketStatus; tone: "amber" | "blue" | "purple" | "green" | "red" }[] = [
  { key: "Pending Approval", tone: "amber" },
  { key: "Approved", tone: "blue" },
  { key: "In Progress", tone: "purple" },
  { key: "Resolved", tone: "green" },
];

export function MaintenanceHub() {
  const {
    tickets,
    assets,
    currentUser,
    role,
    raiseTicket,
    setTicketStatus,
    assetName,
    approveTicket,
    rejectTicket,
    assignTechnician
  } = useApp();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    assetId: assets[0]?.id ?? "",
    issue: "",
    priority: "Medium" as TicketPriority,
  });

  // Action Modals state
  const [approvingTicket, setApprovingTicket] = useState<any | null>(null);
  const [rejectingTicket, setRejectingTicket] = useState<any | null>(null);
  const [assigningTicket, setAssigningTicket] = useState<any | null>(null);

  const [approveForm, setApproveForm] = useState({ comments: "", estimatedCost: "150" });
  const [rejectForm, setRejectForm] = useState({ comments: "" });
  const [assignForm, setAssignForm] = useState({ technician: "" });

  const manager = isManagerial(role);

  const submit = () => {
    if (!form.assetId || !form.issue) return;
    raiseTicket({
      assetId: form.assetId,
      issue: form.issue,
      priority: form.priority,
      reportedBy: currentUser.id,
    });
    setForm({ assetId: assets[0]?.id ?? "", issue: "", priority: "Medium" });
    setOpen(false);
  };

  const handleApproveSubmit = async () => {
    if (!approvingTicket) return;
    const cost = Number(approveForm.estimatedCost) || 0;
    await approveTicket(approvingTicket.id, currentUser.id, approveForm.comments, cost);
    setApprovingTicket(null);
    setApproveForm({ comments: "", estimatedCost: "150" });
  };

  const handleRejectSubmit = async () => {
    if (!rejectingTicket) return;
    await rejectTicket(rejectingTicket.id, currentUser.id, rejectForm.comments);
    setRejectingTicket(null);
    setRejectForm({ comments: "" });
  };

  const handleAssignSubmit = async () => {
    if (!assigningTicket || !assignForm.technician) return;
    await assignTechnician(assigningTicket.id, assignForm.technician);
    setAssigningTicket(null);
    setAssignForm({ technician: "" });
  };

  const stats = [
    { label: "Pending Approval", value: tickets.filter((t) => t.status === "Pending Approval").length, tone: "amber" as const },
    { label: "Approved", value: tickets.filter((t) => t.status === "Approved").length, tone: "blue" as const },
    { label: "In Progress", value: tickets.filter((t) => t.status === "In Progress").length, tone: "purple" as const },
    { label: "Resolved", value: tickets.filter((t) => t.status === "Resolved").length, tone: "green" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tracking-tight">Maintenance Hub</h1>
          <p className="text-muted-foreground mt-1">
            Raise repair requests and track tickets through the approval workflow.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-[#06231a] font-[var(--font-display)] font-semibold"
          style={{
            background: "linear-gradient(135deg, #34d399, #2dd4bf)",
            boxShadow: "0 12px 30px -12px rgba(52,211,153,0.7)",
          }}
        >
          <Plus className="size-4" /> Raise Maintenance Request
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <BentoCard key={s.label}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-2 font-[var(--font-display)] text-3xl font-extrabold tracking-tight">
              {s.value}
            </div>
            <div className="mt-2">
              <StatusPill tone={s.tone}>Live</StatusPill>
            </div>
          </BentoCard>
        ))}
      </div>

      {/* Kanban board */}
      <div className="grid gap-6 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = tickets.filter((t) => t.status === col.key);
          return (
            <BentoCard
              key={col.key}
              title={col.key}
              icon={<Wrench className="size-4" />}
              action={<StatusPill tone={col.tone}>{items.length}</StatusPill>}
            >
              <div className="space-y-3">
                {items.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-border bg-white/[0.02] p-4 flex flex-col justify-between min-h-[140px]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-[var(--font-mono)] text-emerald-400">
                          #{t.id}
                        </span>
                        <StatusPill tone={priorityTone[t.priority]}>
                          {t.priority}
                        </StatusPill>
                      </div>
                      <div className="mt-2 text-sm font-semibold">{assetName(t.assetId)}</div>
                      <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{t.issue}</div>
                    </div>
                    {manager && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                        {t.status === "Pending Approval" && (
                          <>
                            <button
                              onClick={() => setApprovingTicket(t)}
                              className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-200 hover:bg-emerald-400/15 transition-colors font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingTicket(t)}
                              className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-xs text-rose-200 hover:bg-rose-400/15 transition-colors font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {t.status === "Approved" && (
                          <button
                            onClick={() => setAssigningTicket(t)}
                            className="w-full rounded-lg border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-xs text-purple-200 hover:bg-purple-400/15 transition-colors font-semibold"
                          >
                            Assign Technician
                          </button>
                        )}
                        {t.status === "In Progress" && (
                          <button
                            onClick={() => setTicketStatus(t.id, "Resolved")}
                            className="w-full rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-400/15 transition-colors font-semibold"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No tickets here.
                  </div>
                )}
              </div>
            </BentoCard>
          );
        })}
      </div>

      {/* Raise Maintenance Request Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Raise Maintenance Request"
        subtitle="Report an issue; the ticket is routed for approval."
        footer={
          <>
            <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={submit}>
              <Plus className="size-4 mr-1.5" /> Submit Ticket
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Asset">
            <select
              className={inputClass}
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#10141d]">
                  {a.name} ({a.assetTag})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Issue description">
            <textarea
              rows={3}
              className={inputClass}
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              placeholder="Describe the problem…"
            />
          </Field>
          <Field label="Priority">
            <select
              className={inputClass}
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as TicketPriority })
              }
            >
              {["High", "Medium", "Low"].map((p) => (
                <option key={p} value={p} className="bg-[#10141d]">
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>

      {/* Approve Ticket Modal */}
      <Modal
        open={approvingTicket !== null}
        onClose={() => setApprovingTicket(null)}
        title="Approve Maintenance Request"
        subtitle="Submit estimation details and comments."
        footer={
          <>
            <GhostButton onClick={() => setApprovingTicket(null)}>Cancel</GhostButton>
            <PrimaryButton onClick={handleApproveSubmit}>Approve Request</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Estimated Repair Cost ($)">
            <input
              type="number"
              className={inputClass}
              value={approveForm.estimatedCost}
              onChange={(e) => setApproveForm({ ...approveForm, estimatedCost: e.target.value })}
              placeholder="150"
            />
          </Field>
          <Field label="Manager Comments">
            <textarea
              rows={3}
              className={inputClass}
              value={approveForm.comments}
              onChange={(e) => setApproveForm({ ...approveForm, comments: e.target.value })}
              placeholder="Approve with details..."
            />
          </Field>
        </div>
      </Modal>

      {/* Reject Ticket Modal */}
      <Modal
        open={rejectingTicket !== null}
        onClose={() => setRejectingTicket(null)}
        title="Reject Maintenance Request"
        subtitle="Provide rejection rationale."
        footer={
          <>
            <GhostButton onClick={() => setRejectingTicket(null)}>Cancel</GhostButton>
            <PrimaryButton onClick={handleRejectSubmit} className="bg-rose-500 hover:bg-rose-600">Reject Request</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Rejection Comments">
            <textarea
              rows={3}
              className={inputClass}
              value={rejectForm.comments}
              onChange={(e) => setRejectForm({ ...rejectForm, comments: e.target.value })}
              placeholder="State reason for rejecting request..."
            />
          </Field>
        </div>
      </Modal>

      {/* Assign Technician Modal */}
      <Modal
        open={assigningTicket !== null}
        onClose={() => setAssigningTicket(null)}
        title="Assign Technician"
        subtitle="Specify assigned contractor/internal tech to begin work."
        footer={
          <>
            <GhostButton onClick={() => setAssigningTicket(null)}>Cancel</GhostButton>
            <PrimaryButton onClick={handleAssignSubmit}>Assign & Start Work</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Technician Name">
            <input
              className={inputClass}
              value={assignForm.technician}
              onChange={(e) => setAssignForm({ ...assignForm, technician: e.target.value })}
              placeholder="e.g. John Miller (Internal IT)"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
