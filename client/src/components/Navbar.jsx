import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GitBranch, Shield, User as UserIcon, LogOut, FileText, Layers, GitPullRequest } from 'lucide-react';

export default function Navbar({ activeView, setActiveView }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="h-16 border-b border-git-border bg-git-panel/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-git-border">
          <div className="p-1.5 bg-gradient-to-tr from-cyan-500 to-violet-500 rounded-md text-slate-950 font-bold">
            <GitBranch className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-slate-100 flex items-center gap-2">
              MiniGit <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono border border-cyan-800/50">Wiki v1.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">Version-Controlled Docs Platform</p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <nav className="flex items-center space-x-1 ml-6 bg-slate-900/60 p-1 rounded-lg border border-git-border">
          <button
            onClick={() => setActiveView('wiki')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'wiki'
                ? 'bg-git-highlight text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Wiki Workspace</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveView('admin')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'admin'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-violet-400 hover:text-violet-200 hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>
      </div>

      {/* User Information & Actions */}
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3">
            {/* Role Badge */}
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium flex items-center space-x-1 border ${
                isAdmin
                  ? 'bg-purple-950/70 border-purple-700/60 text-purple-300'
                  : 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300'
              }`}
            >
              <Shield className="w-3 h-3 inline mr-1" />
              <span>{user.role?.toUpperCase()}</span>
            </span>

            {/* Profile Avatar */}
            <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-git-border">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.name}`}
                alt={user.name}
                className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700"
              />
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-400 leading-tight font-mono">{user.department || 'Engineering'}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-colors border border-transparent hover:border-git-border"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-mono">Not Logged In</div>
        )}
      </div>
    </header>
  );
}
