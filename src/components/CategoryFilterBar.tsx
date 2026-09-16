import React from 'react';
import { LeadCategory, QualificationStatus } from '../types';
import { Search, Filter, ShieldCheck, Clock, Flame, Sparkles, Radio, Trophy, Disc, LayoutGrid } from 'lucide-react';

interface CategoryFilterBarProps {
  selectedCategory: LeadCategory | 'ALL';
  onSelectCategory: (category: LeadCategory | 'ALL') => void;
  selectedStatus: QualificationStatus | 'ALL';
  onSelectStatus: (status: QualificationStatus | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  counts: {
    all: number;
    PERSONAL_BRAND: number;
    STREAMER: number;
    SPORTSBOOK: number;
    INDIE_LABEL: number;
  };
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  const categoryTabs: { key: LeadCategory | 'ALL'; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'ALL', label: 'All Niche Targets', count: counts.all, icon: <LayoutGrid className="h-3.5 w-3.5 text-zinc-400" /> },
    { key: 'PERSONAL_BRAND', label: 'Personal Brands', count: counts.PERSONAL_BRAND, icon: <Sparkles className="h-3.5 w-3.5 text-amber-400" /> },
    { key: 'STREAMER', label: 'Streamers', count: counts.STREAMER, icon: <Radio className="h-3.5 w-3.5 text-purple-400" /> },
    { key: 'SPORTSBOOK', label: 'Sportsbooks', count: counts.SPORTSBOOK, icon: <Trophy className="h-3.5 w-3.5 text-emerald-400" /> },
    { key: 'INDIE_LABEL', label: 'Indie Labels', count: counts.INDIE_LABEL, icon: <Disc className="h-3.5 w-3.5 text-cyan-400" /> },
  ];

  const statusFilters: { key: QualificationStatus | 'ALL'; label: string; icon: React.ReactNode }[] = [
    { key: 'ALL', label: 'All Statuses', icon: <Filter className="h-3.5 w-3.5 text-zinc-400" /> },
    { key: 'QUALIFIED', label: 'Qualified Only', icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> },
    { key: 'NEEDS_AUDIT', label: 'Needs Audit', icon: <Clock className="h-3.5 w-3.5 text-amber-400" /> },
    { key: 'DISQUALIFIED', label: 'Disqualified', icon: <Flame className="h-3.5 w-3.5 text-rose-400" /> },
  ];

  return (
    <div className="space-y-3">
      {/* Category Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categoryTabs.map((tab) => {
          const isActive = selectedCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectCategory(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm font-bold'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${isActive ? 'bg-zinc-300 text-zinc-900 font-bold' : 'bg-zinc-800 text-zinc-400'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status & Search Control Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-[#0e0f14] p-3 sm:p-3.5 lg:flex-row lg:items-center lg:justify-between shadow-sm">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statusFilters.map((st) => {
            const isActive = selectedStatus === st.key;
            return (
              <button
                key={st.key}
                onClick={() => onSelectStatus(st.key)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                {st.icon}
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, Gmail, or handle..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

