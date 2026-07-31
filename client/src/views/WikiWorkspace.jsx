import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Sidebar from '../components/Sidebar';
import BranchManager from '../components/BranchManager';
import MarkdownEditor from '../components/MarkdownEditor';
import DiffViewer from '../components/DiffViewer';
import VersionTreeGraph from '../components/VersionTreeGraph';
import ConflictResolver from '../components/ConflictResolver';
import BlameView from '../components/BlameView';
import { FileText, GitCommit, ArrowLeftRight, Network, Eye, Plus, Check } from 'lucide-react';

export default function WikiWorkspace({
  pages,
  activePage,
  setActivePage,
  onRefreshPages,
  onCreatePageClick,
}) {
  const [activeBranch, setActiveBranch] = useState('main');
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'diff' | 'graph' | 'blame' | 'merge'
  const [pageVersions, setPageVersions] = useState([]);
  const [activeVersion, setActiveVersion] = useState(null);
  const [mergeSourceBranch, setMergeSourceBranch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activePage?._id) {
      // Default branch fallback
      setActiveBranch(activePage.defaultBranch || 'main');
      fetchVersions();
    }
  }, [activePage?._id]);

  useEffect(() => {
    if (activePage?.branches && activeBranch) {
      const branchObj = activePage.branches.find((b) => b.name === activeBranch);
      if (branchObj && branchObj.headVersionId) {
        // Fetch head version content
        const headId = typeof branchObj.headVersionId === 'object' ? branchObj.headVersionId._id : branchObj.headVersionId;
        fetchVersionById(headId);
      }
    }
  }, [activeBranch, activePage]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const versions = await api.getPageVersions(activePage._id);
      setPageVersions(versions);
      if (versions.length > 0) {
        setActiveVersion(versions[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionById = async (id) => {
    try {
      const v = await api.getPageById ? await api.getPageVersions(activePage._id) : null;
      if (v) {
        const found = v.find((item) => item._id === id);
        if (found) setActiveVersion(found);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBranch = async (branchName, sourceBranch) => {
    const updatedPage = await api.createBranch(activePage._id, branchName, sourceBranch);
    setActivePage(updatedPage);
    setActiveBranch(branchName);
    onRefreshPages();
  };

  const handleCommitVersion = async (content, message) => {
    const newVersion = await api.commitVersion({
      pageId: activePage._id,
      branchName: activeBranch,
      content,
      message,
    });
    setActiveVersion(newVersion);
    await fetchVersions();
    await onRefreshPages();
  };

  const handleOpenMergeModal = () => {
    setMergeSourceBranch(activeBranch);
    setActiveTab('merge');
  };

  const handleMergeComplete = async () => {
    setActiveBranch('main');
    setActiveTab('edit');
    await fetchVersions();
    await onRefreshPages();
  };

  if (!activePage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117] text-slate-400 font-mono text-sm">
        Select a wiki document from sidebar or create a new page.
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Workspace Sidebar */}
      <Sidebar
        pages={pages}
        activePage={activePage}
        setActivePage={setActivePage}
        onCreatePageClick={onCreatePageClick}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0d1117] p-6 space-y-4">
        {/* Workspace Toolbar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-git-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>{activePage.title}</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Category: <span className="text-slate-300">{activePage.category}</span> | Slug: <span className="text-slate-500">/{activePage.slug}</span>
            </p>
          </div>

          {/* Branch Manager Bar */}
          <BranchManager
            page={activePage}
            activeBranch={activeBranch}
            onBranchChange={setActiveBranch}
            onCreateBranch={handleCreateBranch}
            onOpenMergeModal={handleOpenMergeModal}
          />
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-2 border-b border-git-border pb-2">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-all ${
              activeTab === 'edit'
                ? 'bg-git-highlight text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Markdown Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-all ${
              activeTab === 'graph'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-400 hover:text-purple-200 hover:bg-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>DAG Version Tree Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('diff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-all ${
              activeTab === 'diff'
                ? 'bg-git-highlight text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Myers Diff Viewer</span>
          </button>

          <button
            onClick={() => setActiveTab('blame')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center space-x-2 transition-all ${
              activeTab === 'blame'
                ? 'bg-git-highlight text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Git Blame</span>
          </button>
        </div>

        {/* Dynamic Tab Body */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'edit' && (
            <MarkdownEditor
              initialContent={activeVersion?.content || ''}
              onCommitVersion={handleCommitVersion}
              activeBranch={activeBranch}
              headVersion={activeVersion}
            />
          )}

          {activeTab === 'graph' && (
            <VersionTreeGraph
              page={activePage}
              pageVersions={pageVersions}
              activeVersion={activeVersion}
              onSelectVersion={(v) => {
                setActiveVersion(v);
                setActiveTab('diff');
              }}
            />
          )}

          {activeTab === 'diff' && (
            <DiffViewer
              pageVersions={pageVersions}
              currentVersion={activeVersion}
            />
          )}

          {activeTab === 'blame' && (
            <BlameView activeVersion={activeVersion} />
          )}

          {activeTab === 'merge' && (
            <ConflictResolver
              page={activePage}
              sourceBranch={mergeSourceBranch}
              targetBranch="main"
              onMergeComplete={handleMergeComplete}
              onCancel={() => setActiveTab('edit')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
