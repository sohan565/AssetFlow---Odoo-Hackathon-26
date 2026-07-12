import React, { useState, useEffect } from 'react';
import { 
  getDepartments, 
  addDepartment, 
  getCategories, 
  addCategory, 
  getEmployees, 
  promoteEmployee 
} from '../services/api';
import type { Department, Category, Employee, UserRole } from '../services/types';
import { useToast } from '../components/Toast';
import { Building2, Layers3, Users, Plus, ShieldCheck } from 'lucide-react';

export const OrgSetup: React.FC = () => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'depts' | 'cats' | 'employees'>('depts');
  
  // Data State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form State
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');

  const loadData = () => {
    setDepartments(getDepartments());
    setCategories(getCategories());
    setEmployees(getEmployees());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;

    try {
      addDepartment(deptName.trim(), deptCode.trim());
      showToast(`Department "${deptName}" created successfully!`, 'success');
      setDeptName('');
      setDeptCode('');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catCode.trim()) return;

    try {
      addCategory(catName.trim(), catCode.trim());
      showToast(`Category "${catName}" added!`, 'success');
      setCatName('');
      setCatCode('');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRoleChange = (employeeId: string, name: string, nextRole: UserRole) => {
    try {
      promoteEmployee(employeeId, nextRole);
      showToast(`Elevated "${name}" to role: "${nextRole}"`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full overflow-y-auto max-h-[105vh] pb-10 pr-2">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Organization Setup</h2>
        <p className="text-xs text-slate-400">Configure corporate hierarchies, inventory groupings, and employee database authorizations.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveSubTab('depts')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeSubTab === 'depts' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" /> Departments
        </button>
        <button
          onClick={() => setActiveSubTab('cats')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeSubTab === 'cats' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Layers3 className="w-4 h-4" /> Categories
        </button>
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeSubTab === 'employees' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" /> Employees & Promotion
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-2">
        {activeSubTab === 'depts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create form */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit flex flex-col gap-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" /> Register Department
              </h3>
              
              <form onSubmit={handleAddDept} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Department Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Research & Development"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Department Code (Short)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RAD"
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono uppercase"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10"
                >
                  Create Department
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 mb-4">Established Departments</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 pb-3">
                      <th className="pb-3 font-semibold">Department Code</th>
                      <th className="pb-3 font-semibold">Department Name</th>
                      <th className="pb-3 font-semibold">Department ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {departments.map((d) => (
                      <tr key={d.id} className="text-slate-350 hover:bg-slate-850/20 transition-all">
                        <td className="py-3.5 font-bold text-indigo-400 font-mono">{d.code}</td>
                        <td className="py-3.5 font-medium text-slate-200">{d.name}</td>
                        <td className="py-3.5 text-slate-500 font-mono text-[10px]">{d.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'cats' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create form */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit flex flex-col gap-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" /> Add Asset Category
              </h3>
              
              <form onSubmit={handleAddCat} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Network Switches"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Category Code (Short prefix)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NET"
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono uppercase"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10"
                >
                  Create Category
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-slate-200 mb-4">Configured Asset Categories</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 pb-3">
                      <th className="pb-3 font-semibold">Category Prefix</th>
                      <th className="pb-3 font-semibold">Category Label</th>
                      <th className="pb-3 font-semibold">Category ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {categories.map((c) => (
                      <tr key={c.id} className="text-slate-350 hover:bg-slate-850/20 transition-all">
                        <td className="py-3.5 font-bold text-indigo-400 font-mono">{c.code}</td>
                        <td className="py-3.5 font-medium text-slate-200">{c.name}</td>
                        <td className="py-3.5 text-slate-500 font-mono text-[10px]">{c.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'employees' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Company Employee Directory</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Manage access privileges and roles. Promoted users instantly receive elevated route keys.</p>
              </div>
              <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-bold">
                {employees.length} Members
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 pb-3">
                    <th className="pb-3 font-semibold">Name & Email</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Current Role</th>
                    <th className="pb-3 font-semibold text-right">Modify System Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="text-slate-350 hover:bg-slate-850/20 transition-all">
                      <td className="py-3.5 font-medium text-slate-200">
                        <div className="font-semibold text-slate-200">{emp.name}</div>
                        <div className="text-[10px] text-slate-500">{emp.email}</div>
                      </td>
                      <td className="py-3.5 font-medium text-slate-350">{emp.departmentName}</td>
                      <td className="py-3.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          emp.role === 'Admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          emp.role === 'Asset Manager' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          emp.role === 'Department Head' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                          <select
                            value={emp.role}
                            onChange={(e) => handleRoleChange(emp.id, emp.name, e.target.value as UserRole)}
                            className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none transition-all cursor-pointer font-semibold"
                          >
                            <option value="Employee">Employee</option>
                            <option value="Department Head">Dept Head</option>
                            <option value="Asset Manager">Asset Manager</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
