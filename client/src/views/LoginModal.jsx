import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GitBranch, Shield, User as UserIcon, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginModal() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('employee');
  const [department, setDepartment] = useState('Engineering');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register({ name, email, password, role, department });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickPreset = (type) => {
    if (type === 'admin') {
      setEmail('admin@minigit.com');
      setPassword('admin123');
    } else {
      setEmail('employee@minigit.com');
      setPassword('emp123');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d1117]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-git-panel border border-git-border rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-6">
        {/* Logo Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-cyan-500 to-violet-500 rounded-xl text-slate-950 shadow-lg mb-2">
            <GitBranch className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Welcome to MiniGit Wiki</h2>
          <p className="text-xs text-slate-400 font-mono">DAG Version-Controlled Team Documentation</p>
        </div>

        {/* Quick Demo Presets */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-git-border space-y-2">
          <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider block">
            1-Click Demo Login Presets:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickPreset('admin')}
              className="py-1.5 px-3 bg-purple-950/70 border border-purple-800/60 hover:bg-purple-900/80 text-purple-300 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center space-x-1"
            >
              <Shield className="w-3.5 h-3.5 inline mr-1" />
              <span>Admin Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickPreset('employee')}
              className="py-1.5 px-3 bg-emerald-950/70 border border-emerald-800/60 hover:bg-emerald-900/80 text-emerald-300 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center space-x-1"
            >
              <UserIcon className="w-3.5 h-3.5 inline mr-1" />
              <span>Employee Demo</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-800 text-red-300 text-xs p-3 rounded-lg font-mono">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Mercer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-git-border rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900 border border-git-border rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="employee">Employee Panel</option>
                    <option value="admin">Admin Panel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-900 border border-git-border rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                required
                placeholder="email@minigit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-git-border rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-git-border rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center text-xs font-mono text-slate-400">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-cyan-400 hover:underline font-semibold"
          >
            {isRegister ? 'Sign In' : 'Register Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
