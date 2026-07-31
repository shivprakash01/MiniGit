import React, { useState } from 'react';
import { Plus, Search, FileText, Folder, GitBranch, ChevronRight } from 'lucide-react';

export default function Sidebar({ pages, activePage, setActivePage, onCreatePageClick }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...new Set(pages.map((p) => p.category || 'General'))];

  const filteredPages = pages.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <aside className="w-72 border-r border-git-border bg-git-panel/60 flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Action & Search */}
      <div className="p-4 border-b border-git-border space-y-3">
        <button
          onClick={onCreatePageClick}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-git-accent to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Wiki Document</span>
        </button>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search wiki pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-git-border rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pages Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="px-2 py-1 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Wiki Documents</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{filteredPages.length}</span>
        </div>

        {filteredPages.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 italic">No wiki pages found.</div>
        ) : (
          filteredPages.map((page) => {
            const isSelected = activePage?._id === page._id;
            return (
              <button
                key={page._id}
                onClick={() => setActivePage(page)}
                className={`w-full text-left p-2.5 rounded-lg transition-all group flex items-start space-x-3 border ${
                  isSelected
                    ? 'bg-slate-800/80 border-git-border text-white shadow-sm'
                    : 'border-transparent text-slate-300 hover:bg-slate-800/40 hover:text-slate-100'
                }`}
              >
                <FileText
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium truncate">{page.title}</p>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-cyan-400' : 'opacity-0 group-hover:opacity-100 text-slate-400'}`}
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {page.category}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center font-mono">
                      <GitBranch className="w-3 h-3 inline mr-1 text-emerald-400" />
                      {page.branches?.length || 1} branch{(page.branches?.length || 1) > 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
