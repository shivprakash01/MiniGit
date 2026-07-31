import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { GitMerge, AlertTriangle, CheckCircle, ArrowRight, Check } from 'lucide-react';

export default function ConflictResolver({
  page,
  sourceBranch,
  targetBranch = 'main',
  onMergeComplete,
  onCancel,
}) {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [resolvedText, setResolvedText] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, [page._id, sourceBranch, targetBranch]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      const data = await api.previewMerge(page._id, sourceBranch, targetBranch);
      setPreviewData(data);
      setResolvedText(data.mergedText);
      setCommitMessage(`Merge branch '${sourceBranch}' into '${targetBranch}'`);
    } catch (err) {
      alert(err.message);
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const handleKeepOurs = () => {
    if (previewData?.targetHead?.content) {
      setResolvedText(previewData.targetHead.content);
    }
  };

  const handleKeepTheirs = () => {
    if (previewData?.sourceHead?.content) {
      setResolvedText(previewData.sourceHead.content);
    }
  };

  const handleExecuteMerge = async () => {
    try {
      setExecuting(true);
      const res = await api.executeMerge({
        pageId: page._id,
        sourceBranch,
        targetBranch,
        resolvedContent: resolvedText,
        commitMessage,
      });
      onMergeComplete(res);
    } catch (err) {
      alert(err.message);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono italic">
        Computing 3-way merge diff against Lowest Common Ancestor (LCA)...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-git-panel/40 border border-git-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-git-panel border-b border-git-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-950/80 border border-purple-700/60 rounded-lg text-purple-400">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <span>Merge Request:</span>
              <span className="font-mono text-cyan-400">{sourceBranch}</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="font-mono text-emerald-400">{targetBranch}</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Common Ancestor LCA: {previewData?.lcaVersion?.commitHash?.substring(0, 7) || 'Root'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {previewData?.hasConflicts ? (
          <div className="flex items-center space-x-2 bg-amber-950/70 border border-amber-800/60 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{previewData.conflicts?.length || 1} Conflict(s) Detected</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-mono">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Clean Auto-Merge Possible</span>
          </div>
        )}
      </div>

      {/* Quick Conflict Resolution Presets */}
      {previewData?.hasConflicts && (
        <div className="bg-slate-900 px-4 py-2 border-b border-git-border flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Quick Resolution Presets:</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleKeepOurs}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/50 rounded transition-colors"
            >
              Keep Ours ({targetBranch})
            </button>
            <button
              onClick={handleKeepTheirs}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/50 rounded transition-colors"
            >
              Keep Theirs ({sourceBranch})
            </button>
          </div>
        </div>
      )}

      {/* 3 Side-by-Side Reference Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-950/60 border-b border-git-border">
        {/* Ours (Target) */}
        <div className="border border-emerald-900/60 rounded-lg bg-emerald-950/20 p-3 space-y-1">
          <div className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-between">
            <span>Ours ({targetBranch})</span>
            <span className="text-[10px] text-slate-400">{previewData?.targetHead?.commitHash?.substring(0, 7)}</span>
          </div>
          <pre className="text-[11px] font-mono text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {previewData?.targetHead?.content}
          </pre>
        </div>

        {/* Theirs (Source) */}
        <div className="border border-cyan-900/60 rounded-lg bg-cyan-950/20 p-3 space-y-1">
          <div className="text-xs font-mono font-bold text-cyan-400 flex items-center justify-between">
            <span>Theirs ({sourceBranch})</span>
            <span className="text-[10px] text-slate-400">{previewData?.sourceHead?.commitHash?.substring(0, 7)}</span>
          </div>
          <pre className="text-[11px] font-mono text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {previewData?.sourceHead?.content}
          </pre>
        </div>
      </div>

      {/* Resolved Output Preview & Commit */}
      <div className="flex-1 flex flex-col p-4 space-y-3 bg-[#0d1117]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono text-slate-300">
            Resulting Merged Content Preview (Edit manually if needed):
          </label>
        </div>

        <textarea
          value={resolvedText}
          onChange={(e) => setResolvedText(e.target.value)}
          rows={8}
          className="flex-1 bg-slate-950 border border-git-border rounded-lg p-3 font-mono text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
        />

        <div className="flex items-center justify-between pt-2">
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Merge commit message..."
            className="flex-1 bg-slate-900 border border-git-border rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 mr-3"
          />

          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteMerge}
              disabled={executing || !resolvedText.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white flex items-center space-x-1.5 shadow-md disabled:opacity-50"
            >
              <GitMerge className="w-4 h-4" />
              <span>{executing ? 'Merging...' : 'Confirm Merge Commit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
