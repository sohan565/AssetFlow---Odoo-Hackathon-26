import { useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { BentoCard, StatusPill } from "./BentoCard";
import { Field, GhostButton, inputClass, Modal, PrimaryButton } from "./Modal";
import { useApp } from "../context/AppContext";
import { TicketPriority, TicketStatus } from "../types";

const priorityTone: Record<TicketPriority, "red" | "amber" | "blue"> = {
  High: "red",
  Medium: "amber",
  Low: "blue",
};

const COLUMNS: { key: TicketStatus; tone: "amber" | "purple" | "green" }[] = [
  { key: "Reported", tone: "amber" },
  { key: "In Progress", tone: "purple" },
  { key: "Resolved", tone: "green" },
];

// Ordered transitions for the "advance" action.
const NEXT: Record<TicketStatus, TicketStatus | null> = {
  Reported: "In Progress",
  "In Progress": "Resolved",
  Resolved: null,
};

export function MaintenanceHub() {
  const { tickets, assets, currentUser, raiseTicket, setTicketStatus, assetName } =
    useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    assetId: assets[0]?.id ?? "",
    issue: "",
    priority: "Medium" as TicketPriority,
  });

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

  const stats = [
    { label: "Reported", value: tickets.filter((t) => t.status === "Reported").length, tone: "amber" as const },
    { label: "In Progress", value: tickets.filter((t) => t.status === "In Progress").length, tone: "purple" as const },
    { label: "Resolved", value: tickets.filter((t) => t.status === "Resolved").length, tone: "green" as const },
    { label: "Total Tickets", value: tickets.length, tone: "blue" as const },
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
      <div className="grid gap-6 lg:grid-cols-3">
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
                    className="rounded-xl border border-border bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-[var(--font-mono)] text-muted-foreground">
                        {t.id}
                      </span>
                      <StatusPill tone={priorityTone[t.priority]}>
                        {t.priority}
                      </StatusPill>
                    </div>
                    <div className="mt-2 text-sm">{assetName(t.assetId)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{t.issue}</div>
                    {NEXT[t.status] && (
                      <button
                        onClick={() => setTicketStatus(t.id, NEXT[t.status]!)}
                        className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-400/15 transition-colors"
                      >
                        Move to {NEXT[t.status]}
                      </button>
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Raise Maintenance Request"
        subtitle="Report an issue; the asset is moved to Maintenance."
        footer={
          <>
            <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={submit}>
              <Plus className="size-4" /> Submit Ticket
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
    </div>
  );
}
