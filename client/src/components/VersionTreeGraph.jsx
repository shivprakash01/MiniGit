import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitCommit, GitBranch, GitMerge, User } from 'lucide-react';

// Custom Commit DAG Node component
const CommitNode = ({ data }) => {
  const isBranchHead = data.isBranchHead;
  const isMerge = data.version.isMergeCommit || data.version.parentIds?.length > 1;

  return (
    <div
      onClick={() => data.onSelect(data.version)}
      className={`p-3 rounded-lg border shadow-lg cursor-pointer transition-all min-w-[200px] ${
        data.isSelected
          ? 'bg-cyan-950 border-cyan-400 text-white ring-2 ring-cyan-500/50'
          : isMerge
          ? 'bg-purple-950/80 border-purple-600 text-purple-200 hover:border-purple-400'
          : 'bg-git-panel border-git-border text-slate-200 hover:border-slate-400'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan-400" />

      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[11px] font-semibold text-cyan-400 flex items-center space-x-1">
          {isMerge ? <GitMerge className="w-3.5 h-3.5 text-purple-400 inline mr-1" /> : <GitCommit className="w-3.5 h-3.5 inline mr-1" />}
          <span>{data.version.commitHash?.substring(0, 7)}</span>
        </span>

        {isBranchHead && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-medium">
            {data.branchName}
          </span>
        )}
      </div>

      <p className="text-xs font-sans font-medium line-clamp-1 mb-1">{data.version.message}</p>

      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-git-border/60 pt-1 mt-1">
        <span>{data.version.authorId?.name?.split(' ')[0] || 'Author'}</span>
        <span>{new Date(data.version.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400" />
    </div>
  );
};

const nodeTypes = { commitNode: CommitNode };

export default function VersionTreeGraph({ page, pageVersions, activeVersion, onSelectVersion }) {
  const { nodes, edges } = useMemo(() => {
    if (!pageVersions || pageVersions.length === 0) return { nodes: [], edges: [] };

    const nodesList = [];
    const edgesList = [];

    // Map branch heads
    const branchHeadMap = {};
    page?.branches?.forEach((b) => {
      branchHeadMap[b.headVersionId] = b.name;
    });

    // Simple layout calculation: group by branch or order chronologically
    const sortedVersions = [...pageVersions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const branchYOffsets = {};
    let nextY = 0;

    sortedVersions.forEach((v, idx) => {
      const branchName = v.branchName || 'main';
      if (branchYOffsets[branchName] === undefined) {
        branchYOffsets[branchName] = nextY;
        nextY += 120;
      }

      const xPos = idx * 240 + 50;
      const yPos = branchYOffsets[branchName] + 50;

      nodesList.push({
        id: v._id,
        type: 'commitNode',
        position: { x: xPos, y: yPos },
        data: {
          version: v,
          isSelected: activeVersion?._id === v._id,
          isBranchHead: !!branchHeadMap[v._id],
          branchName: branchHeadMap[v._id] || v.branchName,
          onSelect: onSelectVersion,
        },
      });

      // Connect edges to parent nodes
      if (v.parentIds && v.parentIds.length > 0) {
        v.parentIds.forEach((pId) => {
          edgesList.push({
            id: `e-${pId}-${v._id}`,
            source: pId.toString(),
            target: v._id.toString(),
            animated: v.isMergeCommit,
            style: { stroke: v.isMergeCommit ? '#a855f7' : '#38bdf8', strokeWidth: 2 },
          });
        });
      }
    });

    return { nodes: nodesList, edges: edgesList };
  }, [pageVersions, page, activeVersion]);

  return (
    <div className="w-full h-full bg-[#0d1117] border border-git-border rounded-xl overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 bg-git-panel/90 backdrop-blur border border-git-border px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 flex items-center space-x-3">
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
          <span>Normal Commit</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span>
          <span>Merge Commit (2 Parents)</span>
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[#0d1117]"
      >
        <Background color="#30363d" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
