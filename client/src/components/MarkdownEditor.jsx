import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Edit3, Eye, GitCommit, Save, Code, List, Heading, Bold, Italic } from 'lucide-react';

export default function MarkdownEditor({
  initialContent = '',
  onCommitVersion,
  activeBranch,
  headVersion,
}) {
  const [content, setContent] = useState(initialContent);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview' | 'split'
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const hasChanges = content !== initialContent;

  const handleCommitSubmit = async (e) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;

    try {
      setCommitting(true);
      await onCommitVersion(content, commitMessage.trim());
      setCommitMessage('');
      setShowCommitModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCommitting(false);
    }
  };

  const insertMarkdown = (prefix, suffix = '') => {
    setContent((prev) => prev + `${prefix}text${suffix}`);
  };

  return (
    <div className="flex flex-col h-full bg-git-panel/40 border border-git-border rounded-xl overflow-hidden shadow-inner">
      {/* Editor Toolbar Header */}
      <div className="h-12 bg-git-panel border-b border-git-border px-4 flex items-center justify-between">
        {/* Left Formatting Controls */}
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-lg border border-git-border mr-3">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                activeTab === 'edit' ? 'bg-git-highlight text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                activeTab === 'preview' ? 'bg-git-highlight text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                activeTab === 'split' ? 'bg-git-highlight text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          {activeTab !== 'preview' && (
            <div className="hidden sm:flex items-center space-x-1 text-slate-400 border-l border-git-border pl-3">
              <button
                onClick={() => insertMarkdown('**', '**')}
                className="p-1.5 hover:bg-slate-800 rounded hover:text-slate-200"
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertMarkdown('*', '*')}
                className="p-1.5 hover:bg-slate-800 rounded hover:text-slate-200"
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertMarkdown('### ')}
                className="p-1.5 hover:bg-slate-800 rounded hover:text-slate-200"
                title="Heading"
              >
                <Heading className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => insertMarkdown('- ')}
                className="p-1.5 hover:bg-slate-800 rounded hover:text-slate-200"
                title="List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Commit Action */}
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-full animate-pulse">
              Uncommitted Changes
            </span>
          )}

          <button
            onClick={() => setShowCommitModal(true)}
            disabled={!hasChanges}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-git-accent to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <GitCommit className="w-4 h-4" />
            <span>Commit Changes</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Input Area */}
        {(activeTab === 'edit' || activeTab === 'split') && (
          <div className={`flex-1 flex bg-[#0d1117] ${activeTab === 'split' ? 'border-r border-git-border' : ''}`}>
            {/* Line Numbers Gutter */}
            <div className="w-12 bg-slate-950 py-4 text-right pr-3 text-[11px] font-mono text-slate-600 select-none border-r border-git-border/40">
              {content.split('\n').map((_, idx) => (
                <div key={idx} className="leading-6">
                  {idx + 1}
                </div>
              ))}
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your Markdown documentation here..."
              className="flex-1 p-4 bg-[#0d1117] text-slate-100 font-mono text-xs leading-6 resize-none focus:outline-none placeholder-slate-600 selection:bg-cyan-500 selection:text-white"
            />
          </div>
        )}

        {/* Live Preview Area */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-950/90 prose prose-invert max-w-none prose-sm prose-pre:bg-slate-900 prose-pre:border prose-pre:border-git-border">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {content || '_No markdown content to preview._'}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Modal: Commit Version */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-git-panel border border-git-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              <span>Create New Commit Version</span>
            </h3>

            <p className="text-xs text-slate-400">
              Target Branch: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-mono">{activeBranch}</code>
            </p>

            <form onSubmit={handleCommitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Commit Message</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Add authentication architecture overview"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-git-border rounded-lg p-3 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCommitModal(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={committing || !commitMessage.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-git-accent hover:bg-emerald-600 text-white disabled:opacity-50"
                >
                  {committing ? 'Committing...' : 'Commit Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
