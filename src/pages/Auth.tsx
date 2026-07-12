import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDepartments } from '../services/api';
import type { Department } from '../services/types';
import { useToast } from '../components/Toast';
import { KeyRound, Mail, UserPlus, Sparkles, Building2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const { login, signup } = useAuth();
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [deptId, setDeptId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDepartments(getDepartments());
  }, [isLogin]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    try {
      await login(email);
      showToast('Logged in successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Login failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !deptId) {
      showToast('Please fill out all fields.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await signup(name, email, deptId);
      showToast('Account created! Your role is standard "Employee" until promoted by an Admin.', 'success', 6000);
    } catch (err: any) {
      showToast(err.message || 'Signup failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Demo accounts helper
  const handleQuickLogin = async (demoEmail: string) => {
    try {
      await login(demoEmail);
      showToast(`Quick Logged in as ${demoEmail}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col gap-6 relative z-10">
        
        {/* Title */}
        <div className="text-center flex flex-col gap-2">
          <div className="mx-auto bg-indigo-600 p-3 rounded-2xl w-fit shadow-xl shadow-indigo-600/20 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-2">
            {isLogin ? 'Sign In to System' : 'Create ERP Account'}
          </h2>
          <p className="text-sm text-slate-400">
            {isLogin ? 'Manage assets, bookings, and audits' : 'Get started as an Employee'}
          </p>
        </div>

        {/* Form Container */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Company Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl mt-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 text-sm"
            >
              Sign In to Dashboard
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Full Name</label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Company Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="e.g. marcus@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Department</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select
                  required
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm appearance-none"
                >
                  <option value="" disabled className="bg-slate-950 text-slate-500">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-950 text-slate-350">
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl mt-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 text-sm"
            >
              Register & Sign In
            </button>
          </form>
        )}

        {/* Toggle between login/signup */}
        <div className="text-center mt-2 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {isLogin ? "Need a new account? Register here" : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Demo Quick Access (Admin, Manager, Head, Employee) */}
        {isLogin && (
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-indigo-500/10 flex flex-col gap-2 mt-2">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 justify-center">
              <Sparkles className="w-3.5 h-3.5" /> Hackathon Demo Quick Access
            </span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => handleQuickLogin('admin@company.com')}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-left px-3 py-2 rounded-xl hover:bg-slate-850 transition-all text-xs"
              >
                <p className="font-semibold text-slate-200">Alice (Admin)</p>
                <p className="text-[10px] text-slate-500">admin@company.com</p>
              </button>
              <button
                onClick={() => handleQuickLogin('manager@company.com')}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-left px-3 py-2 rounded-xl hover:bg-slate-850 transition-all text-xs"
              >
                <p className="font-semibold text-slate-200">Robert (Manager)</p>
                <p className="text-[10px] text-slate-500">manager@company.com</p>
              </button>
              <button
                onClick={() => handleQuickLogin('sarah.c@company.com')}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-left px-3 py-2 rounded-xl hover:bg-slate-850 transition-all text-xs"
              >
                <p className="font-semibold text-slate-200">Sarah (Head)</p>
                <p className="text-[10px] text-slate-500">sarah.c@company.com</p>
              </button>
              <button
                onClick={() => handleQuickLogin('john.doe@company.com')}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-left px-3 py-2 rounded-xl hover:bg-slate-850 transition-all text-xs"
              >
                <p className="font-semibold text-slate-200">John (Employee)</p>
                <p className="text-[10px] text-slate-500">john.doe@company.com</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
