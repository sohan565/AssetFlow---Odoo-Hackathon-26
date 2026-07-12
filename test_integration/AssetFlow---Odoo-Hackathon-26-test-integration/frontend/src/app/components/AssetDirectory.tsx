import { useState } from "react";
import { MapPin, Plus, Search } from "lucide-react";
import { BentoCard, StatusPill } from "./BentoCard";
import { Field, GhostButton, inputClass, Modal, PrimaryButton } from "./Modal";
import { useApp } from "../context/AppContext";
import { AssetCategory, AssetStatus } from "../types";

const statusTone: Record<AssetStatus, "green" | "purple" | "amber" | "muted"> = {
  Available: "green",
  Allocated: "purple",
  Maintenance: "amber",
  Retired: "muted",
};

const CATEGORIES: (AssetCategory | "All")[] = [
  "All",
  "Hardware",
  "Software",
  "Furniture",
  "Vehicles",
  "Facilities",
];

const STATUSES: (AssetStatus | "All")[] = [
  "All",
  "Available",
  "Allocated",
  "Maintenance",
  "Retired",
];

export function AssetDirectory() {
  const {
    assets,
    registerAsset,
    returnAsset,
    allocateAsset,
    employees,
    allocations,
    employeeName,
    createTransfer,
    fetchAssetHistory
  } = useApp();

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<AssetCategory | "All">("All");
  const [status, setStatus] = useState<AssetStatus | "All">("All");
  const [open, setOpen] = useState(false);
  const [allocatingAsset, setAllocatingAsset] = useState<any | null>(null);
  const [allocForm, setAllocForm] = useState({
    employeeId: "",
    expectedReturnDate: "",
  });

  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<{ transitions: any[]; allocations: any[] }>({
    transitions: [],
    allocations: [],
  });

  const [transferringAsset, setTransferringAsset] = useState<any | null>(null);
  const [transferForm, setTransferForm] = useState({
    toEmployeeId: "",
  });

  const [form, setForm] = useState({
    name: "",
    assetTag: "",
    category: "Hardware" as AssetCategory,
    location: "",
    purchaseValue: "",
  });

  const submitAllocation = () => {
    if (!allocatingAsset) return;
    const empId = allocForm.employeeId || employees[0]?.id || "";
    if (!empId) return;
    allocateAsset(allocatingAsset.id, empId, allocForm.expectedReturnDate);
    setAllocatingAsset(null);
  };

  const loadAssetHistory = async (assetId: string) => {
    const data = await fetchAssetHistory(assetId);
    setHistoryData(data);
  };

  const submitTransfer = () => {
    if (!transferringAsset) return;
    const activeAlloc = allocations.find(al => al.assetId === transferringAsset.id && al.status === "Active");
    if (!activeAlloc) return;
    const toId = transferForm.toEmployeeId || employees[0]?.id || "";
    if (!toId) return;

    createTransfer(transferringAsset.id, activeAlloc.employeeId, toId, "System Requested");
    setTransferringAsset(null);
  };

  const filtered = assets.filter((a) => {
    const matchesCat = cat === "All" || a.category === cat;
    const matchesStatus = status === "All" || a.status === status;
    const q = query.toLowerCase();
    const matchesQuery =
      a.name.toLowerCase().includes(q) || a.assetTag.toLowerCase().includes(q);
    return matchesCat && matchesStatus && matchesQuery;
  });

  const submit = () => {
    if (!form.name || !form.assetTag) return;
    registerAsset({
      name: form.name,
      assetTag: form.assetTag,
      category: form.category,
      location: form.location || "Unassigned",
      purchaseValue: Number(form.purchaseValue) || 0,
      status: "Available",
    });
    setForm({ name: "", assetTag: "", category: "Hardware", location: "", purchaseValue: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tracking-tight">Asset Directory</h1>
          <p className="text-muted-foreground mt-1">
            Search corporate assets, audit status, holders, and location.
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
          <Plus className="size-4" /> Register New Asset
        </button>
      </div>

      <BentoCard>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-white/[0.03] px-3 py-2 flex-1 min-w-56">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or asset tag…"
              className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground/70"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  cat === c
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                status === s
                  ? "border-purple-400/40 bg-purple-400/10 text-purple-200"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </BentoCard>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((a) => (
          <BentoCard key={a.id} className="!p-5">
            <div
              onClick={() => {
                setSelectedAsset(a);
                loadAssetHistory(a.id);
              }}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground font-[var(--font-mono)]">
                    {a.assetTag}
                  </div>
                  <h3 className="mt-0.5 tracking-tight">{a.name}</h3>
                </div>
                <StatusPill tone={statusTone[a.status]}>{a.status}</StatusPill>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">{a.category}</div>
              <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {a.location}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
              <div>
                <div className="text-xs text-muted-foreground">Purchase value</div>
                <div className="font-[var(--font-display)] font-bold">
                  {a.purchaseValue ? `$${a.purchaseValue.toLocaleString()}` : "—"}
                </div>
              </div>
              {(() => {
                if (a.status === "Allocated") {
                  const activeAlloc = allocations.find((al) => al.assetId === a.id && al.status === "Active");
                  const holderName = activeAlloc ? employeeName(activeAlloc.employeeId) : "Unknown";
                  return (
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground font-semibold">Held by {holderName}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => returnAsset(a.id)}
                          className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 text-xs text-emerald-200 hover:bg-emerald-400/15 transition-colors font-semibold"
                        >
                          Check In
                        </button>
                        <button
                          onClick={() => {
                            setTransferringAsset(a);
                            setTransferForm({
                              toEmployeeId: employees[0]?.id ?? "",
                            });
                          }}
                          className="rounded-lg border border-purple-400/30 bg-purple-400/10 px-2.5 py-1.5 text-xs text-purple-200 hover:bg-purple-400/15 transition-colors font-semibold"
                        >
                          Transfer
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })() || (
                a.status === "Maintenance" ? (
                  <span className="text-sm text-amber-300">Under maintenance</span>
                ) : a.status === "Retired" ? (
                  <span className="text-sm text-muted-foreground">Retired</span>
                ) : (
                  <button
                    onClick={() => {
                      setAllocatingAsset(a);
                      setAllocForm({
                        employeeId: employees[0]?.id ?? "",
                        expectedReturnDate: "",
                      });
                    }}
                    className="rounded-xl border border-purple-400/30 bg-purple-400/10 px-3.5 py-2 text-sm text-purple-200 hover:bg-purple-400/15 transition-colors font-semibold"
                  >
                    Allocate asset
                  </button>
                )
              )}
            </div>
          </BentoCard>
        ))}
      </div>
      {filtered.length === 0 && (
        <BentoCard>
          <div className="py-10 text-center text-muted-foreground">
            No assets match your search.
          </div>
        </BentoCard>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Register New Asset"
        subtitle="Add an asset to the organization inventory."
        footer={
          <>
            <GhostButton onClick={() => setOpen(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={submit}>
              <Plus className="size-4" /> Register Asset
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Asset name">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder='e.g. MacBook Pro M3 Max 16"'
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Asset tag">
              <input
                className={inputClass}
                value={form.assetTag}
                onChange={(e) => setForm({ ...form, assetTag: e.target.value })}
                placeholder="AST-###"
              />
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as AssetCategory })
                }
              >
                {["Hardware", "Software", "Furniture", "Vehicles", "Facilities"].map(
                  (c) => (
                    <option key={c} value={c} className="bg-[#10141d]">
                      {c}
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location">
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. San Francisco HQ"
              />
            </Field>
            <Field label="Purchase value ($)">
              <input
                type="number"
                className={inputClass}
                value={form.purchaseValue}
                onChange={(e) => setForm({ ...form, purchaseValue: e.target.value })}
                placeholder="0"
              />
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={allocatingAsset !== null}
        onClose={() => setAllocatingAsset(null)}
        title={`Allocate Asset: ${allocatingAsset?.name}`}
        subtitle={`Assign ${allocatingAsset?.assetTag} to an employee.`}
        footer={
          <>
            <GhostButton onClick={() => setAllocatingAsset(null)}>Cancel</GhostButton>
            <PrimaryButton onClick={submitAllocation}>
              Allocate
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Employee">
            <select
              className={inputClass}
              value={allocForm.employeeId}
              onChange={(e) => setAllocForm({ ...allocForm, employeeId: e.target.value })}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-[#10141d]">
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Expected Return Date">
            <input
              type="date"
              className={inputClass}
              value={allocForm.expectedReturnDate}
              onChange={(e) => setAllocForm({ ...allocForm, expectedReturnDate: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={transferringAsset !== null}
        onClose={() => setTransferringAsset(null)}
        title={`Request Transfer: ${transferringAsset?.name}`}
        subtitle="This asset is currently taken. Submit a transfer request."
        footer={
          <>
            <GhostButton onClick={() => setTransferringAsset(null)}>Cancel</GhostButton>
            <PrimaryButton onClick={submitTransfer}>Request Transfer</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-300">
            <strong>Conflict Detected:</strong> This resource is currently held by{" "}
            {transferringAsset ? (() => {
              const activeAlloc = allocations.find(al => al.assetId === transferringAsset.id && al.status === "Active");
              return activeAlloc ? employeeName(activeAlloc.employeeId) : "another department";
            })() : ""}. The system will route this request to the department head.
          </div>
          <Field label="Transfer to (Target Employee)">
            <select
              className={inputClass}
              value={transferForm.toEmployeeId}
              onChange={(e) => setTransferForm({ ...transferForm, toEmployeeId: e.target.value })}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-[#10141d]">
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={selectedAsset !== null}
        onClose={() => setSelectedAsset(null)}
        title={`Asset Specifications & Lifecycle Trail`}
        subtitle={selectedAsset ? `${selectedAsset.name} [${selectedAsset.assetTag}]` : ""}
        footer={
          <GhostButton onClick={() => setSelectedAsset(null)}>Close Specs</GhostButton>
        }
      >
        {selectedAsset && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="border border-border rounded-xl p-3 bg-white/[0.01]">
                <span className="text-muted-foreground block">Serial Number</span>
                <span className="font-semibold text-foreground font-[var(--font-mono)] mt-0.5 block">{selectedAsset.id || "AF-SN-0021"}</span>
              </div>
              <div className="border border-border rounded-xl p-3 bg-white/[0.01]">
                <span className="text-muted-foreground block">Category Class</span>
                <span className="font-semibold text-foreground mt-0.5 block">{selectedAsset.category}</span>
              </div>
              <div className="border border-border rounded-xl p-3 bg-white/[0.01]">
                <span className="text-muted-foreground block">Location/Subunit</span>
                <span className="font-semibold text-foreground mt-0.5 block">{selectedAsset.location}</span>
              </div>
              <div className="border border-border rounded-xl p-3 bg-white/[0.01]">
                <span className="text-muted-foreground block">Current State</span>
                <span className="font-semibold text-emerald-300 mt-0.5 block">{selectedAsset.status}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">Lifecycle & Allocations Timeline</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {historyData.allocations.map((h, i) => (
                  <div key={i} className="flex gap-2.5 items-start text-xs border-l border-emerald-400/20 pl-3.5 pb-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-emerald-200">
                        Allocated to {employeeName(h.employee_id)}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                        Date: {h.allocated_date} • Expected Return: {h.expected_return_date || "Not Specified"}
                      </div>
                    </div>
                  </div>
                ))}
                {historyData.transitions.map((h, i) => (
                  <div key={i} className="flex gap-2.5 items-start text-xs border-l border-purple-400/20 pl-3.5 pb-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-purple-200">
                        State Shift: {h.from_state} ➔ {h.to_state}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 mt-0.5 font-[var(--font-mono)]">
                        Logged: {h.changed_at} by UID {h.changed_by || "System"}
                      </div>
                    </div>
                  </div>
                ))}
                {historyData.allocations.length === 0 && historyData.transitions.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">No logged history events for this asset.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
