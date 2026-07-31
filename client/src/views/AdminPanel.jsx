import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Shield, Users, FileText, GitBranch, GitCommit, Activity, Lock, RefreshCw, CheckCircle } from 'lucide-react';

export default function AdminPanel({ pages, onRefreshPages }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'stats' | 'audit' | 'protection'

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [uData, sData, lData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminStats(),
        api.getAuditLogs(),
      ]);
      setUsers(uData);
      setStats(sData);
      setAuditLogs(lData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'employee' : 'admin';
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleBranchProtection = async (pageId, currentProtected) => {
    const newProtected = currentProtected.includes('main') ? [] : ['main'];
    try {
      await api.updateBranchProtection(pageId, newProtected);
      onRefreshPages();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-git-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-3">
            <Shield className="w-6 h-6 text-violet-400" />
            <span>Admin Control Panel</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            System Administration, Role Management, Audit Logs, and Branch Protection Policies
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-git-border rounded-lg text-xs font-mono text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Analytics Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-git-panel border border-git-border p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Total Accounts</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 font-mono">{stats.totalUsers}</p>
            <p className="text-[10px] text-slate-500 font-mono">{stats.totalEmployees} Employees</p>
          </div>

          <div className="bg-git-panel border border-git-border p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Wiki Pages</span>
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 font-mono">{stats.totalPages}</p>
            <p className="text-[10px] text-slate-500 font-mono">{stats.totalBranches} Active Branches</p>
          </div>

          <div className="bg-git-panel border border-git-border p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Commit Nodes</span>
              <GitCommit className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 font-mono">{stats.totalCommits}</p>
            <p className="text-[10px] text-slate-500 font-mono">SHA-256 Validated</p>
          </div>

          <div className="bg-git-panel border border-git-border p-4 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>Merge Requests</span>
              <GitBranch className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100 font-mono">{stats.totalMergeRequests}</p>
            <p className="text-[10px] text-amber-400 font-mono">{stats.openMergeRequests} Open PRs</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-git-border">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-medium font-mono border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-violet-500 text-violet-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          User & Role Management ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('protection')}
          className={`px-4 py-2 text-xs font-medium font-mono border-b-2 transition-colors ${
            activeTab === 'protection' ? 'border-violet-500 text-violet-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Branch Protection Policies
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-medium font-mono border-b-2 transition-colors ${
            activeTab === 'audit' ? 'border-violet-500 text-violet-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-git-panel/60 border border-git-border rounded-xl p-6">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-mono italic">Loading Admin Data...</div>
        ) : activeTab === 'users' ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 font-mono">Employee & User Directory</h3>

            <div className="overflow-x-auto border border-git-border rounded-lg bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-git-border text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-git-border/40">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-900/60">
                      <td className="p-3 flex items-center space-x-2">
                        <img src={u.avatar} alt="" className="w-6 h-6 rounded-full bg-slate-800" />
                        <span className="font-semibold text-slate-200">{u.name}</span>
                      </td>
                      <td className="p-3 text-slate-400">{u.email}</td>
                      <td className="p-3 text-slate-400">{u.department || 'Engineering'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            u.role === 'admin'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleRole(u._id, u.role)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-git-border transition-colors text-[11px]"
                        >
                          Toggle to {u.role === 'admin' ? 'Employee' : 'Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'protection' ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 font-mono">Branch Protection Policies per Page</h3>
            <p className="text-xs text-slate-400 font-sans">
              Protected branches restrict direct unreviewed edits and enforce Merge Request approvals.
            </p>

            <div className="space-y-2">
              {pages.map((p) => {
                const isMainProtected = p.protectedBranches?.includes('main');
                return (
                  <div key={p._id} className="flex items-center justify-between p-3 bg-slate-950 border border-git-border rounded-lg">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{p.title}</h4>
                      <p className="text-[10px] font-mono text-slate-400">Category: {p.category} | Branches: {p.branches?.length || 1}</p>
                    </div>

                    <button
                      onClick={() => handleToggleBranchProtection(p._id, p.protectedBranches || [])}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        isMainProtected
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-slate-900 text-slate-400 border-git-border hover:bg-slate-800'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isMainProtected ? 'main Protected' : 'main Unprotected'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 font-mono">Audit Activity Log Stream</h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log._id} className="p-3 bg-slate-950 border border-git-border/60 rounded-lg text-xs font-mono flex items-start justify-between">
                  <div>
                    <span className="text-cyan-400 font-semibold">{log.actorName || 'System'}</span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-slate-200">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
