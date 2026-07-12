import { useState } from "react";
import { ScanLine, ShieldCheck } from "lucide-react";
import { BentoCard, StatusPill } from "./BentoCard";
import { inputClass } from "./Modal";
import { useApp } from "../context/AppContext";
import { AuditEntry } from "../types";

const conditions: AuditEntry["condition"][] = ["Good", "Damaged", "Missing"];
const conditionTone: Record<AuditEntry["condition"], "green" | "amber" | "red"> = {
  Good: "green",
  Damaged: "amber",
  Missing: "red",
};

export function AuditingWorkspace() {
  const { assets, auditEntries, currentUser, assetByTag, logAudit } = useApp();

  const [tag, setTag] = useState("");
  const [scanned, setScanned] = useState<ReturnType<typeof assetByTag>>(undefined);
  const [scanError, setScanError] = useState("");
  const [condition, setCondition] = useState<AuditEntry["condition"]>("Good");
  const [note, setNote] = useState("");

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

  const verified = auditEntries.length;
  const discrepancies = auditEntries.filter((e) => e.condition !== "Good").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="tracking-tight">Auditing Workspace</h1>
        <p className="text-muted-foreground mt-1">
          Physically verify assets by scanning tags and logging their condition.
        </p>
      </div>

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
              className="shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-2.5 text-sm text-emerald-200 hover:bg-emerald-400/15 transition-colors"
            >
              Scan
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Try: {assets.slice(0, 3).map((a) => a.assetTag).join(", ")}
          </p>

          {scanError && (
            <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-300">
              {scanError}
            </div>
          )}

          {scanned && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-white/[0.02] p-3">
                <div className="text-sm">{scanned.name}</div>
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
                <span className="text-sm text-muted-foreground">Condition</span>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {conditions.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
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
                placeholder="Condition notes (optional)…"
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
                  <div className="text-xs text-muted-foreground">Verified</div>
                  <div className="font-[var(--font-display)] text-2xl font-extrabold">
                    {verified}
                  </div>
                </div>
              </div>
            </BentoCard>
            <BentoCard>
              <div className="text-xs text-muted-foreground">Discrepancies</div>
              <div className="mt-2 font-[var(--font-display)] text-2xl font-extrabold text-amber-300">
                {discrepancies}
              </div>
            </BentoCard>
            <BentoCard>
              <div className="text-xs text-muted-foreground">Audited by</div>
              <div className="mt-2 text-sm">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground">{currentUser.role}</div>
            </BentoCard>
          </div>

          <BentoCard title="Audit Trail">
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
                      <span className="absolute -left-[22px] top-1 size-3 rounded-full bg-emerald-400 ring-4 ring-emerald-400/15" />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm">
                          Verified{" "}
                          <span className="font-[var(--font-mono)] text-muted-foreground">
                            {e.assetTag}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground font-[var(--font-mono)] shrink-0">
                          {e.time}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{e.auditor}</span>
                        <span>•</span>
                        <StatusPill tone={conditionTone[e.condition]}>
                          {e.condition}
                        </StatusPill>
                        {e.note && <span>— {e.note}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
