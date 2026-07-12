import { Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { BentoCard, StatusPill } from "./BentoCard";
import { ROLES, useApp } from "../context/AppContext";
import { Role } from "../types";

const roleTone: Record<Role, "green" | "blue" | "amber" | "purple"> = {
  Admin: "green",
  "Asset Manager": "blue",
  "Department Head": "amber",
  Employee: "purple",
};

export function OrganizationSetup() {
  const { role, setRole, employees } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="tracking-tight">Organization Setup</h1>
        <p className="text-muted-foreground mt-1">
          Manage workspace details, roles, and access overrides.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <BentoCard title="Workspace" icon={<Building2 className="size-4" />}>
          <div className="space-y-4 text-sm">
            <label className="block">
              <span className="text-muted-foreground">Organization name</span>
              <input
                defaultValue="AssetFlow Enterprise"
                className="mt-1.5 w-full rounded-xl border border-border bg-white/[0.03] px-3 py-2.5 outline-none focus:border-emerald-400/40"
              />
            </label>
            <label className="block">
              <span className="text-muted-foreground">Primary region</span>
              <input
                defaultValue="San Francisco, US"
                className="mt-1.5 w-full rounded-xl border border-border bg-white/[0.03] px-3 py-2.5 outline-none focus:border-emerald-400/40"
              />
            </label>
            <div className="flex items-center justify-between pt-1">
              <span className="text-muted-foreground">Plan</span>
              <StatusPill tone="green">Enterprise ERP</StatusPill>
            </div>
          </div>
        </BentoCard>

        <BentoCard
          title="Role Overrides (RBAC)"
          icon={<ShieldCheck className="size-4" />}
        >
          <p className="text-sm text-muted-foreground mb-3">
            Switch the active permission context for testing.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                  role === r
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border bg-white/[0.02] p-3 text-sm">
            Active role:{" "}
            <span className="text-emerald-300 font-[var(--font-display)] font-semibold">
              {role}
            </span>
          </div>
        </BentoCard>

        <BentoCard title="Employee Directory" icon={<UserRound className="size-4" />}>
          <div className="space-y-3">
            {employees.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.02] px-3 py-2.5"
              >
                <span className="grid place-items-center size-9 rounded-full bg-white/5 text-sm font-[var(--font-display)]">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="size-3" /> {m.department}
                  </div>
                </div>
                <StatusPill tone={roleTone[m.role]}>{m.role}</StatusPill>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
