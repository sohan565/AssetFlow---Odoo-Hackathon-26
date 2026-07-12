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
  const { assets, registerAsset, returnAsset, allocateAsset, employees } = useApp();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<AssetCategory | "All">("All");
  const [status, setStatus] = useState<AssetStatus | "All">("All");
  const [open, setOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    assetTag: "",
    category: "Hardware" as AssetCategory,
    location: "",
    purchaseValue: "",
  });

  const [allocForm, setAllocForm] = useState({
    employeeId: "",
    expectedReturnDate: "",
  });

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

  const submitAllocation = () => {
    const targetEmployeeId = allocForm.employeeId || (employees[0]?.id ?? "");
    if (!selectedAssetId || !targetEmployeeId) return;
    allocateAsset(selectedAssetId, targetEmployeeId, allocForm.expectedReturnDate);
    setAllocForm({ employeeId: "", expectedReturnDate: "" });
    setAllocOpen(false);
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
            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
              <div>
                <div className="text-xs text-muted-foreground">Purchase value</div>
                <div className="font-[var(--font-display)] font-bold">
                  {a.purchaseValue ? `$${a.purchaseValue.toLocaleString()}` : "—"}
                </div>
              </div>
              {a.status === "Allocated" ? (
                <button
                  onClick={() => returnAsset(a.id)}
                  className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2 text-sm text-emerald-200 hover:bg-emerald-400/15 transition-colors"
                >
                  Check in / Return
                </button>
              ) : a.status === "Maintenance" ? (
                <span className="text-sm text-amber-300">Under maintenance</span>
              ) : a.status === "Retired" ? (
                <span className="text-sm text-muted-foreground">Retired</span>
              ) : (
                <button
                  onClick={() => {
                    setSelectedAssetId(a.id);
                    setAllocForm({ employeeId: employees[0]?.id ?? "", expectedReturnDate: "" });
                    setAllocOpen(true);
                  }}
                  className="rounded-xl border border-purple-400/30 bg-purple-400/10 px-3.5 py-2 text-sm text-purple-200 hover:bg-purple-400/15 transition-colors"
                >
                  Allocate asset
                </button>
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
        open={allocOpen}
        onClose={() => setAllocOpen(false)}
        title="Allocate Asset"
        subtitle="Assign this asset to an employee."
        footer={
          <>
            <GhostButton onClick={() => setAllocOpen(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={submitAllocation}>
              Allocate Asset
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Employee">
            <select
              className={inputClass}
              value={allocForm.employeeId || (employees[0]?.id ?? "")}
              onChange={(e) => setAllocForm({ ...allocForm, employeeId: e.target.value })}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id} className="bg-[#10141d]">
                  {e.name} ({e.role} - {e.department})
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
    </div>
  );
}
