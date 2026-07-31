import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { User, Clock, GitCommit } from 'lucide-react';

export default function BlameView({ activeVersion }) {
  const [blameData, setBlameData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeVersion?._id) {
      fetchBlame();
    }
  }, [activeVersion]);

  const fetchBlame = async () => {
    try {
      setLoading(true);
      const data = await api.getBlame(activeVersion._id);
      setBlameData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-mono italic">Calculating line authorship blame...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-git-panel/40 border border-git-border rounded-xl overflow-hidden font-mono text-xs">
      <div className="p-3 bg-git-panel border-b border-git-border flex items-center justify-between">
        <span className="text-slate-300 font-bold flex items-center space-x-2">
          <GitCommit className="w-4 h-4 text-cyan-400" />
          <span>Git Blame Analysis - Commit {activeVersion?.commitHash?.substring(0, 7)}</span>
        </span>
        <span className="text-[11px] text-slate-400">{blameData.length} lines total</span>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#0d1117] p-2 divide-y divide-git-border/30">
        {blameData.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-3 py-1 px-2 hover:bg-slate-900/60 rounded">
            {/* Line Number */}
            <div className="w-8 text-right text-slate-600 select-none text-[11px]">{item.lineNumber}</div>

            {/* Author Metadata Gutter */}
            <div className="w-64 flex items-center space-x-2 bg-slate-950/80 px-2 py-1 rounded border border-git-border/50 truncate">
              <span className="text-cyan-400 text-[10px] font-semibold">{item.commitHash?.substring(0, 7)}</span>
              <span className="text-slate-300 truncate font-sans text-[11px]">{item.authorName}</span>
              <span className="text-slate-500 text-[10px] ml-auto">
                {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Line Text Content */}
            <div className="flex-1 text-slate-200 whitespace-pre-wrap font-mono text-xs truncate">
              {item.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
