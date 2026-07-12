import { useState } from "react";
import { Building2, Mail, ShieldCheck, UserRound, Plus, Edit, Trash2 } from "lucide-react";
import { BentoCard, StatusPill } from "./BentoCard";
import { ROLES, useApp } from "../context/AppContext";
import { Role, Department } from "../types";
import { Modal, Field, GhostButton, PrimaryButton, inputClass } from "./Modal";

const roleTone: Record<Role, "green" | "blue" | "amber" | "purple"> = {
  Admin: "green",
  "Asset Manager": "blue",
  "Department Head": "amber",
  Employee: "purple",
};

export function OrganizationSetup() {
  const {
    role,
    setRole,
    employees,
    departments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createCategory,
    promoteEmployee,
    toggleEmployeeStatus,
    assets
  } = useApp();

  const [activeTab, setActiveTab] = useState<"depts" | "cats" | "employees">("depts");

  // Department Modal state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    parentId: "" as string | number,
    headEmployeeId: "" as string | number,
    isActive: 1,
  });

  // Category Modal state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({
    name: "",
    parentId: "",
    description: "",
    depreciationRate: "10",
  });

  // Handle department submit
  const handleDeptSubmit = async () => {
    if (!deptForm.name || !deptForm.code) return;
    const pId = deptForm.parentId ? Number(deptForm.parentId) : undefined;
    const hId = deptForm.headEmployeeId ? Number(deptForm.headEmployeeId) : undefined;

    if (editingDept) {
      await updateDepartment(editingDept.id, deptForm.name, deptForm.code, pId, hId, deptForm.isActive);
    } else {
      await createDepartment(deptForm.name, deptForm.code, pId, hId);
    }
    setDeptModalOpen(false);
    setEditingDept(null);
  };

  // Handle category submit
  const handleCatSubmit = async () => {
    if (!catForm.name) return;
    const pId = catForm.parentId ? Number(catForm.parentId) : undefined;
    const rate = Number(catForm.depreciationRate) || 0;
    await createCategory(catForm.name, pId, catForm.description, rate);
    setCatModalOpen(false);
    setCatForm({ name: "", parentId: "", description: "", depreciationRate: "10" });
  };

  // Get unique categories from assets
  const categories = Array.from(new Set(assets.map(a => a.category)));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="tracking-tight">Organization Setup</h1>
        <p className="text-muted-foreground mt-1">
          Manage workspace settings, departments, categories, and employees directory.
        </p>
      </div>

      {/* Top Section: Workspace & RBAC Switcher */}
      <div className="grid gap-6 md:grid-cols-2">
        <BentoCard title="Workspace Profile" icon={<Building2 className="size-4" />}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs block">Organization Name</span>
              <span className="font-semibold text-foreground text-sm block mt-0.5">AssetFlow Enterprise</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Region</span>
              <span className="font-semibold text-foreground text-sm block mt-0.5">San Francisco, US</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Plan</span>
              <span className="block mt-1"><StatusPill tone="green">Enterprise ERP</StatusPill></span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Active Departments</span>
              <span className="font-semibold text-foreground text-sm block mt-0.5">{departments.length} Active</span>
            </div>
          </div>
        </BentoCard>

        <BentoCard title="Permission Override (Testing)" icon={<ShieldCheck className="size-4" />}>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                  role === r
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Current session role: <span className="text-emerald-300 font-semibold">{role}</span>
          </div>
        </BentoCard>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("depts")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "depts"
              ? "border-emerald-400 text-emerald-300"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab("cats")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "cats"
              ? "border-emerald-400 text-emerald-300"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Asset Categories
        </button>
        <button
          onClick={() => setActiveTab("employees")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "employees"
              ? "border-emerald-400 text-emerald-300"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Employee Directory
        </button>
      </div>

      {/* Tab Content */}
      <BentoCard>
        {activeTab === "depts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Department Directory</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Define corporate structures and allocate heads.</p>
              </div>
              <PrimaryButton
                onClick={() => {
                  setEditingDept(null);
                  setDeptForm({ name: "", code: "", parentId: "", headEmployeeId: "", isActive: 1 });
                  setDeptModalOpen(true);
                }}
              >
                <Plus className="size-4 mr-1.5" />
                Add Department
              </PrimaryButton>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/40">
                    <th className="pb-3 font-normal">Code</th>
                    <th className="pb-3 font-normal">Department Name</th>
                    <th className="pb-3 font-normal">Department Head</th>
                    <th className="pb-3 font-normal">Status</th>
                    <th className="pb-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {departments.map((d) => (
                    <tr key={d.id} className={d.isActive === 0 ? "opacity-50" : ""}>
                      <td className="py-3 font-[var(--font-mono)] text-xs text-emerald-300">{d.code}</td>
                      <td className="py-3 font-semibold">{d.name}</td>
                      <td className="py-3">{d.headEmployeeId ? employees.find(e => e.id === String(d.headEmployeeId))?.name ?? "Unassigned" : "Unassigned"}</td>
                      <td className="py-3">
                        <StatusPill tone={d.isActive === 1 ? "green" : "red"}>
                          {d.isActive === 1 ? "Active" : "Inactive"}
                        </StatusPill>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingDept(d);
                              setDeptForm({
                                name: d.name,
                                code: d.code,
                                parentId: d.parentId ?? "",
                                headEmployeeId: d.headEmployeeId ?? "",
                                isActive: d.isActive,
                              });
                              setDeptModalOpen(true);
                            }}
                            className="rounded-lg bg-white/5 border border-white/10 p-1.5 hover:bg-white/10 hover:text-emerald-300 transition-colors"
                          >
                            <Edit className="size-3.5" />
                          </button>
                          <button
                            onClick={() => deleteDepartment(d.id)}
                            className="rounded-lg bg-rose-400/5 border border-rose-400/10 p-1.5 hover:bg-rose-400/10 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No departments found. Create one to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "cats" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Asset Categories</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Manage depreciable groupings and warranty periods.</p>
              </div>
              <PrimaryButton onClick={() => setCatModalOpen(true)}>
                <Plus className="size-4 mr-1.5" />
                Add Category
              </PrimaryButton>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {categories.map((c) => (
                <div key={c} className="rounded-xl border border-border bg-white/[0.02] p-4 space-y-2">
                  <div className="font-semibold text-emerald-300 text-base">{c}</div>
                  <div className="text-xs text-muted-foreground">
                    Depreciation Rate: <span className="text-foreground font-semibold">10% / year</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Classified as: <span className="text-foreground">Corporate Asset Group</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "employees" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold">Employee Directory</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Promote employee access permissions or deactivate accounts.</p>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/40">
                    <th className="pb-3 font-normal">Employee</th>
                    <th className="pb-3 font-normal">Department</th>
                    <th className="pb-3 font-normal">System Role</th>
                    <th className="pb-3 font-normal">Account Status</th>
                    <th className="pb-3 font-normal text-right">Promote Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="py-3">
                        <div className="font-semibold">{emp.name}</div>
                        <div className="text-xs text-muted-foreground">{emp.email || "no email"}</div>
                      </td>
                      <td className="py-3 text-muted-foreground">{emp.department}</td>
                      <td className="py-3">
                        <StatusPill tone={roleTone[emp.role]}>{emp.role}</StatusPill>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => toggleEmployeeStatus(emp.id, 1)}
                          className="text-xs font-semibold hover:underline text-emerald-300"
                        >
                          Active
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <select
                          className="rounded-lg border border-border bg-[#0e121a] px-2.5 py-1.5 text-xs outline-none focus:border-emerald-400/40 text-foreground"
                          value={emp.role}
                          onChange={(e) => promoteEmployee(emp.id, e.target.value)}
                        >
                          <option value="Employee">Employee</option>
                          <option value="Department Head">Department Head</option>
                          <option value="Asset Manager">Asset Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </BentoCard>

      {/* Department Add/Edit Modal */}
      <Modal
        open={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? "Modify Department" : "Register Department"}
        subtitle="Specify identifiers, head, and active state."
        footer={
          <>
            <GhostButton onClick={() => setDeptModalOpen(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={handleDeptSubmit}>
              {editingDept ? "Save Changes" : "Create Department"}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Department Name">
            <input
              className={inputClass}
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="e.g. Research & Development"
            />
          </Field>
          <Field label="Code Identifier">
            <input
              className={inputClass}
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              placeholder="e.g. RD-HQ"
            />
          </Field>
          <Field label="Department Head">
            <select
              className={inputClass}
              value={deptForm.headEmployeeId}
              onChange={(e) => setDeptForm({ ...deptForm, headEmployeeId: e.target.value })}
            >
              <option value="">Select Employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-[#10141d]">
                  {emp.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Parent Department (Optional)">
            <select
              className={inputClass}
              value={deptForm.parentId}
              onChange={(e) => setDeptForm({ ...deptForm, parentId: e.target.value })}
            >
              <option value="">None (Top Level)</option>
              {departments.filter(d => !editingDept || d.id !== editingDept.id).map((d) => (
                <option key={d.id} value={d.id} className="bg-[#10141d]">
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          {editingDept && (
            <Field label="Status">
              <select
                className={inputClass}
                value={deptForm.isActive}
                onChange={(e) => setDeptForm({ ...deptForm, isActive: Number(e.target.value) })}
              >
                <option value={1} className="bg-[#10141d]">Active</option>
                <option value={0} className="bg-[#10141d]">Inactive</option>
              </select>
            </Field>
          )}
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Register Category"
        subtitle="Manage depreciations for asset directory classes."
        footer={
          <>
            <GhostButton onClick={() => setCatModalOpen(false)}>Cancel</GhostButton>
            <PrimaryButton onClick={handleCatSubmit}>Create Category</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Category Name">
            <input
              className={inputClass}
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              placeholder="e.g. Server Hardware"
            />
          </Field>
          <Field label="Depreciation Rate (% per year)">
            <input
              type="number"
              className={inputClass}
              value={catForm.depreciationRate}
              onChange={(e) => setCatForm({ ...catForm, depreciationRate: e.target.value })}
              placeholder="10"
            />
          </Field>
          <Field label="Description">
            <textarea
              className={`${inputClass} h-20 resize-none py-2`}
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              placeholder="Description of category holdings..."
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
