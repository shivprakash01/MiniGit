import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { GitCommit, Plus, Minus, ArrowLeftRight, FileCode, Clock, User } from 'lucide-react';

export default function DiffViewer({ pageVersions, currentVersion }) {
  const [fromVersionId, setFromVersionId] = useState('');
  const [toVersionId, setToVersionId] = useState(currentVersion?._id || '');
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentVersion?._id) {
      setToVersionId(currentVersion._id);
      // Auto pick parent version if available
      if (currentVersion.parentIds && currentVersion.parentIds.length > 0) {
        setFromVersionId(currentVersion.parentIds[0]);
      } else {
        setFromVersionId('');
      }
    }
  }, [currentVersion]);

  useEffect(() => {
    if (toVersionId) {
      fetchDiff();
    }
  }, [fromVersionId, toVersionId]);

  const fetchDiff = async () => {
    try {
      setLoading(true);
      const data = await api.compareDiff(fromVersionId, toVersionId);
      setDiffData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-git-panel/40 border border-git-border rounded-xl overflow-hidden">
      {/* Diff Controls Header */}
      <div className="p-4 bg-git-panel border-b border-git-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Version Selector Selectors */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Base Version:</span>
            <select
              value={fromVersionId}
              onChange={(e) => setFromVersionId(e.target.value)}
              className="bg-slate-900 border border-git-border rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">(Empty / Root)</option>
              {pageVersions.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.commitHash?.substring(0, 7)} - {v.message?.substring(0, 25)}
                </option>
              ))}
            </select>
          </div>

          <ArrowLeftRight className="w-4 h-4 text-slate-500" />

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Target Version:</span>
            <select
              value={toVersionId}
              onChange={(e) => setToVersionId(e.target.value)}
              className="bg-slate-900 border border-git-border rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {pageVersions.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.commitHash?.substring(0, 7)} - {v.message?.substring(0, 25)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff Stats Badge */}
        {diffData?.stats && (
          <div className="flex items-center space-x-3 text-xs font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-git-border">
            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
              <Plus className="w-3.5 h-3.5 inline" />
              <span>+{diffData.stats.additions}</span>
            </span>
            <span className="text-red-400 font-semibold flex items-center space-x-1">
              <Minus className="w-3.5 h-3.5 inline" />
              <span>-{diffData.stats.deletions}</span>
            </span>
            <span className="text-slate-400 font-sans">
              ({diffData.stats.linesTotal} lines)
            </span>
          </div>
        )}
      </div>

      {/* Line Diff Table Output */}
      <div className="flex-1 overflow-y-auto font-mono text-xs p-4 bg-[#0d1117]">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-mono italic">Computing Myers line diff...</div>
        ) : !diffData || !diffData.diffLines ? (
          <div className="p-8 text-center text-slate-500 font-mono">Select target version to view diff.</div>
        ) : (
          <div className="border border-git-border rounded-lg overflow-hidden bg-slate-950">
            {diffData.diffLines.map((item, idx) => {
              let bg = 'bg-transparent text-slate-300';
              let symbol = ' ';
              if (item.type === 'added') {
                bg = 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500';
                symbol = '+';
              } else if (item.type === 'removed') {
                bg = 'bg-red-950/60 text-red-300 border-l-2 border-red-500';
                symbol = '-';
              }

              return (
                <div key={idx} className={`flex items-start px-3 py-1 font-mono text-xs leading-5 hover:bg-slate-900/60 ${bg}`}>
                  <div className="w-10 text-slate-600 select-none text-right pr-2">
                    {item.oldLineNumber || ''}
                  </div>
                  <div className="w-10 text-slate-600 select-none text-right pr-2 border-r border-git-border/40 mr-3">
                    {item.newLineNumber || ''}
                  </div>
                  <div className="w-4 select-none font-bold text-slate-400">{symbol}</div>
                  <div className="flex-1 whitespace-pre-wrap break-all">{item.line}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
