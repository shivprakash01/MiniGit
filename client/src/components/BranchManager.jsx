import React, { useState } from 'react';
import { GitBranch, Plus, GitMerge, Shield, ChevronDown, Check } from 'lucide-react';

export default function BranchManager({
  page,
  activeBranch,
  onBranchChange,
  onCreateBranch,
  onOpenMergeModal,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [creating, setCreating] = useState(false);

  const branches = page?.branches || [{ name: 'main' }];
  const isProtected = page?.protectedBranches?.includes(activeBranch);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    try {
      setCreating(true);
      await onCreateBranch(newBranchName.trim(), activeBranch);
      setNewBranchName('');
      setShowCreateModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Branch Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center space-x-2 bg-slate-900 border border-git-border hover:border-slate-500 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 transition-colors shadow-sm"
        >
          <GitBranch className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-emerald-300">{activeBranch}</span>
          {isProtected && (
            <Shield className="w-3 h-3 text-amber-400 inline" title="Protected Branch" />
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>

        {showDropdown && (
          <div className="absolute left-0 mt-2 w-64 bg-git-panel border border-git-border rounded-lg shadow-xl z-50 p-2 space-y-1">
            <div className="text-[11px] font-mono font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider flex justify-between">
              <span>Switch Branch</span>
              <span className="text-slate-400">{branches.length} branches</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {branches.map((b) => (
                <button
                  key={b.name}
                  onClick={() => {
                    onBranchChange(b.name);
                    setShowDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono text-left transition-colors ${
                    activeBranch === b.name
                      ? 'bg-slate-800 text-cyan-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center space-x-2 truncate">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{b.name}</span>
                  </span>
                  {activeBranch === b.name && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>

            <div className="border-t border-git-border pt-1">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  setShowCreateModal(true);
                }}
                className="w-full flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 py-1.5 px-2 rounded text-xs font-medium border border-cyan-800/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Branch</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Merge / Pull Request Action Button */}
      {activeBranch !== 'main' && (
        <button
          onClick={onOpenMergeModal}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm"
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Merge into main</span>
        </button>
      )}

      {/* Modal: Create Branch */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-git-panel border border-git-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span>Create New Branch</span>
            </h3>

            <p className="text-xs text-slate-400">
              Fork a new branch from <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-mono">{activeBranch}</code>.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">New Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g. feature/update-docs, fix/typo"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full bg-slate-900 border border-git-border rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newBranchName.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Fork Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
