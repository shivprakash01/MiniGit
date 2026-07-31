import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  GitBranch,
  GitCommit,
  Folder,
  FileCode,
  PlusCircle,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FilePlus,
  Play,
  Database,
  Terminal,
  Layers,
  Search,
  ExternalLink,
  RefreshCw,
  Code
} from 'lucide-react';

export default function MiniGitApp() {
  const [repos, setRepos] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);
  const [activeTab, setActiveTab] = useState('code'); // 'code', 'status', 'commits', 'checkout'

  // Modals & Forms
  const [showInitModal, setShowInitModal] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');

  // Working Directory State
  const [workingFiles, setWorkingFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Git Status State
  const [gitStatus, setGitStatus] = useState({ staged: [], modified: [], untracked: [], headCommitId: null });
  const [commitMessage, setCommitMessage] = useState('');

  // Commit Log State
  const [commits, setCommits] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState(null);

  // Status Alerts / Loading
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch repositories on mount
  useEffect(() => {
    fetchRepos();
  }, []);

  // Fetch active repo details when activeRepo changes
  useEffect(() => {
    if (activeRepo) {
      refreshRepoData(activeRepo._id);
    }
  }, [activeRepo]);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const data = await api.listRepos();
      setRepos(data);
      if (data.length > 0 && !activeRepo) {
        setActiveRepo(data[0]);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const refreshRepoData = async (repoId) => {
    try {
      const [filesRes, statusRes, logRes] = await Promise.all([
        api.getWorkingFiles(repoId),
        api.getStatus(repoId),
        api.getLog(repoId)
      ]);
      setWorkingFiles(filesRes.files || []);
      setGitStatus(statusRes);
      setCommits(logRes);

      if (filesRes.files && filesRes.files.length > 0 && !selectedFile) {
        loadFileContent(repoId, filesRes.files[0]);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const loadFileContent = async (repoId, filename) => {
    try {
      setSelectedFile(filename);
      const res = await api.getFileContent(repoId, filename);
      setFileContent(res.content || '');
    } catch (err) {
      setFileContent('');
    }
  };

  // 1. INIT Command
  const handleInitRepo = async (e) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;
    try {
      setLoading(true);
      const res = await api.initRepo(newRepoName.trim(), newRepoDesc.trim());
      showToast(`Repository "${res.repository}" initialized with .minigit structure!`);
      setNewRepoName('');
      setNewRepoDesc('');
      setShowInitModal(false);
      await fetchRepos();
      setActiveRepo(res.repo);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Save/Create Working File
  const handleSaveWorkingFile = async () => {
    if (!activeRepo || !selectedFile.trim()) return;
    try {
      setLoading(true);
      await api.saveWorkingFile(activeRepo._id, selectedFile.trim(), fileContent);
      showToast(`Saved "${selectedFile}" to working directory`);
      await refreshRepoData(activeRepo._id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. ADD Command (Staging)
  const handleAddFile = async (filename) => {
    if (!activeRepo) return;
    try {
      setLoading(true);
      const targetFile = filename || selectedFile;
      const res = await api.addFile(activeRepo._id, targetFile, targetFile === selectedFile ? fileContent : null);
      showToast(`Staged "${res.filename}" (SHA-256: ${res.hash.substring(0, 8)}...)`);
      await refreshRepoData(activeRepo._id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 4. COMMIT Command
  const handleCommit = async (e) => {
    e.preventDefault();
    if (!activeRepo || !commitMessage.trim()) return;
    try {
      setLoading(true);
      const res = await api.createCommit(activeRepo._id, commitMessage.trim());
      showToast(`Commit created [${res.commitId}]: "${res.message}"`);
      setCommitMessage('');
      await refreshRepoData(activeRepo._id);
      setActiveTab('commits');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 6. CHECKOUT Command
  const handleCheckout = async (commitId) => {
    if (!activeRepo || !commitId) return;
    try {
      setLoading(true);
      const res = await api.checkoutCommit(activeRepo._id, commitId);
      showToast(`Switched repository to commit ${commitId}`);
      await refreshRepoData(activeRepo._id);
      setActiveTab('code');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-700 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* GitHub Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-lg text-emerald-400">
            <div className="p-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
              <Terminal className="w-5 h-5 text-emerald-400" />
            </div>
            <span>MiniGit</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
              Engine v1.0
            </span>
          </div>

          {/* Repo Selector */}
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-slate-400" />
            <select
              value={activeRepo?._id || ''}
              onChange={(e) => {
                const found = repos.find((r) => r._id === e.target.value);
                setActiveRepo(found);
              }}
              className="bg-slate-800 border border-slate-700 rounded-md px-3 py-1 text-sm font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {repos.length === 0 && <option value="">No Repositories</option>}
              {repos.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* MongoDB Atlas Connected Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/60 border border-emerald-700/50 rounded-full text-xs text-emerald-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            MongoDB Atlas Connected
          </div>

          <button
            onClick={() => setShowInitModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-md text-sm font-medium transition-all shadow-md shadow-emerald-900/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Init Repo</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      {!activeRepo ? (
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center mb-4 text-slate-500">
            <Folder className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">No Repository Selected</h2>
          <p className="text-slate-400 max-w-md text-sm mb-6">
            Initialize a new repository using MiniGit's internal engine (`POST /api/repos/init`) to create `.minigit` object storage & HEAD reference.
          </p>
          <button
            onClick={() => setShowInitModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-lg transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Initialize New Repository</span>
          </button>
        </main>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Repository Subheader & Tabs */}
          <div className="border-b border-slate-800 bg-slate-900/40 px-6 pt-4 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-100 font-mono">{activeRepo.name}</h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono border border-slate-700">
                    HEAD: {gitStatus.headCommitId ? gitStatus.headCommitId : 'Uncommitted (ROOT)'}
                  </span>
                </div>
                {activeRepo.description && <p className="text-xs text-slate-400 mt-1">{activeRepo.description}</p>}
              </div>

              <button
                onClick={() => refreshRepoData(activeRepo._id)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-md transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-6 text-sm font-medium">
              {[
                { id: 'code', label: 'Code & Files', icon: Code, badge: workingFiles.length },
                { id: 'status', label: 'Git Status & Add', icon: Terminal, badge: gitStatus.staged.length + gitStatus.modified.length + gitStatus.untracked.length },
                { id: 'commits', label: 'Commit History (Log)', icon: GitCommit, badge: commits.length },
                { id: 'checkout', label: 'Checkout / Time Travel', icon: RotateCcw }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-3 border-b-2 transition-all ${
                      active
                        ? 'border-emerald-500 text-emerald-400 font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={`text-xs px-2 py-0.2 rounded-full font-mono ${active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: CODE & WORKING DIRECTORY */}
          {activeTab === 'code' && (
            <div className="flex-1 flex overflow-hidden">
              {/* File Sidebar */}
              <div className="w-64 border-r border-slate-800 bg-slate-900/30 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Working Directory</span>
                  <button
                    onClick={() => {
                      const fname = prompt('Enter filename (e.g. README.md or src/index.js):');
                      if (fname) {
                        setSelectedFile(fname);
                        setFileContent('');
                        setIsEditing(true);
                      }
                    }}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-400 transition-all"
                    title="New File"
                  >
                    <FilePlus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {workingFiles.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-3 text-center">No files in working directory</div>
                  ) : (
                    workingFiles.map((fname) => (
                      <button
                        key={fname}
                        onClick={() => loadFileContent(activeRepo._id, fname)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-mono flex items-center justify-between transition-all ${
                          selectedFile === fname
                            ? 'bg-slate-800 text-emerald-400 font-medium border border-slate-700'
                            : 'text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="truncate">{fname}</span>
                        {gitStatus.staged.some((s) => s.filename === fname) && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Staged" />
                        )}
                        {gitStatus.untracked.includes(fname) && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Untracked" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Editor / Viewer Area */}
              <div className="flex-1 flex flex-col bg-slate-950">
                {selectedFile ? (
                  <div className="flex-1 flex flex-col">
                    <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-mono text-slate-200">
                        <FileCode className="w-4 h-4 text-emerald-400" />
                        <span>{selectedFile}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleSaveWorkingFile}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs font-medium text-slate-200 transition-all"
                        >
                          Save File
                        </button>
                        <button
                          onClick={() => handleAddFile(selectedFile)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow-md shadow-emerald-900/30 flex items-center gap-1.5 transition-all"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>git add {selectedFile}</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      placeholder="Write file content here..."
                      className="flex-1 p-6 bg-slate-950 text-slate-200 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <FileCode className="w-12 h-12 mb-3 text-slate-600" />
                    <p className="text-sm">Select or create a file in the sidebar to view & edit content</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GIT STATUS & ADD */}
          {activeTab === 'status' && (
            <div className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-6">
              {/* Commit Panel Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                <h3 className="text-base font-semibold text-slate-100 mb-3 flex items-center gap-2">
                  <GitCommit className="w-5 h-5 text-emerald-400" />
                  <span>Create Commit (git commit -m)</span>
                </h3>
                <form onSubmit={handleCommit} className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter commit message (e.g. Initial commit or Update README)..."
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={gitStatus.staged.length === 0}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                      gitStatus.staged.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <GitCommit className="w-4 h-4" />
                    <span>Commit Staged</span>
                  </button>
                </form>
              </div>

              {/* Status Categorization Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* STAGED FILES */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <h4 className="font-semibold text-slate-200 text-sm">Staged for Commit</h4>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                      {gitStatus.staged.length}
                    </span>
                  </div>

                  {gitStatus.staged.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">No staged files</p>
                  ) : (
                    <div className="space-y-2">
                      {gitStatus.staged.map((s) => (
                        <div key={s.filename} className="p-3 bg-slate-950 border border-emerald-900/40 rounded-lg font-mono text-xs text-emerald-300 flex items-center justify-between">
                          <span>{s.filename}</span>
                          <span className="text-[10px] text-slate-500 font-mono">SHA: {s.hash.substring(0, 8)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* MODIFIED FILES */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-sky-500" />
                      <h4 className="font-semibold text-slate-200 text-sm">Modified (Unstaged)</h4>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                      {gitStatus.modified.length}
                    </span>
                  </div>

                  {gitStatus.modified.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">No modified files</p>
                  ) : (
                    <div className="space-y-2">
                      {gitStatus.modified.map((m) => (
                        <div key={m.filename} className="p-3 bg-slate-950 border border-sky-900/40 rounded-lg font-mono text-xs text-sky-300 flex items-center justify-between">
                          <span>{m.filename}</span>
                          <button
                            onClick={() => handleAddFile(m.filename)}
                            className="text-xs px-2 py-1 bg-sky-900 hover:bg-sky-800 text-sky-100 rounded transition-all"
                          >
                            + Stage
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* UNTRACKED FILES */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <h4 className="font-semibold text-slate-200 text-sm">Untracked Files</h4>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                      {gitStatus.untracked.length}
                    </span>
                  </div>

                  {gitStatus.untracked.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4 text-center">No untracked files</p>
                  ) : (
                    <div className="space-y-2">
                      {gitStatus.untracked.map((u) => (
                        <div key={u} className="p-3 bg-slate-950 border border-amber-900/40 rounded-lg font-mono text-xs text-amber-300 flex items-center justify-between">
                          <span>{u}</span>
                          <button
                            onClick={() => handleAddFile(u)}
                            className="text-xs px-2 py-1 bg-amber-900 hover:bg-amber-800 text-amber-100 rounded transition-all"
                          >
                            + Stage
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMMIT LOG */}
          {activeTab === 'commits' && (
            <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
              <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-emerald-400" />
                <span>Commit History (`git log`)</span>
              </h3>

              {commits.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
                  <GitCommit className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-base font-medium text-slate-300 mb-1">No commits created yet</p>
                  <p className="text-xs">Stage your files using `git add` and run `git commit` to create your first snapshot.</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
                  {commits.map((c) => {
                    const isHead = gitStatus.headCommitId === c.commitId;
                    return (
                      <div key={c.commitId} className="relative group">
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${
                            isHead
                              ? 'bg-emerald-500 border-slate-950 ring-4 ring-emerald-500/20'
                              : 'bg-slate-800 border-slate-700 group-hover:border-slate-500'
                          }`}
                        />

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg hover:border-slate-700 transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-bold text-slate-100 text-base">{c.message}</h4>
                                {isHead && (
                                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold">
                                    HEAD
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{new Date(c.timestamp).toLocaleString()}</span>
                              </p>
                            </div>

                            <button
                              onClick={() => handleCheckout(c.commitId)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-xs font-mono text-slate-200 flex items-center gap-1.5 transition-all"
                              title="Checkout this commit"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                              <span>checkout {c.commitId}</span>
                            </button>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                            <div>
                              <span className="text-slate-500">Commit ID: </span>
                              <span className="text-emerald-400">{c.commitId}</span>
                              {c.parentCommit && (
                                <span className="ml-4 text-slate-500">
                                  Parent: <span className="text-slate-300">{c.parentCommit}</span>
                                </span>
                              )}
                            </div>
                            <span>{c.files?.length || 0} files in snapshot</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CHECKOUT / TIME TRAVEL */}
          {activeTab === 'checkout' && (
            <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mb-6">
                <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-emerald-400" />
                  <span>Time Travel Restore (`git checkout`)</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Selecting a commit restores every file in your working directory from the snapshot stored inside <code className="font-mono text-emerald-400">.minigit/objects/&lt;hash&gt;</code>.
                </p>
              </div>

              <div className="space-y-4">
                {commits.map((c) => (
                  <div key={c.commitId} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between hover:border-slate-700 transition-all">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-emerald-400 font-bold">[{c.commitId}]</span>
                        <span className="text-slate-200 font-semibold">{c.message}</span>
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">
                        {new Date(c.timestamp).toLocaleString()} • {c.files.length} file snapshot(s)
                      </span>
                    </div>

                    <button
                      onClick={() => handleCheckout(c.commitId)}
                      disabled={gitStatus.headCommitId === c.commitId}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono flex items-center gap-2 transition-all ${
                        gitStatus.headCommitId === c.commitId
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{gitStatus.headCommitId === c.commitId ? 'Current HEAD' : 'Restore State'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* INIT REPOSITORY MODAL */}
      {showInitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Folder className="w-5 h-5 text-emerald-400" />
              <span>Initialize New Repository</span>
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Simulates `git init`. Creates `.minigit` object database & HEAD references on local filesystem and saves metadata in MongoDB.
            </p>

            <form onSubmit={handleInitRepo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Repository Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. demo-project"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Internal Git implementation demonstration"
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInitModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all"
                >
                  Init Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
