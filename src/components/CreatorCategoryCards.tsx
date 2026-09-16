import React, { useState } from 'react';
import { LeadCategory, Lead } from '../types';
import {
  Sparkles,
  Radio,
  Trophy,
  Disc,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';

interface CreatorCategoryCardsProps {
  selectedCategory: LeadCategory | 'ALL';
  onSelectCategory: (category: LeadCategory | 'ALL') => void;
  leads: Lead[];
}

export const CreatorCategoryCards: React.FC<CreatorCategoryCardsProps> = ({
  selectedCategory,
  onSelectCategory,
  leads,
}) => {
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);

  const categories = [
    {
      id: 'PERSONAL_BRAND' as LeadCategory,
      name: 'Personal Brands',
      title: 'Creators & Coaches',
      tagline: 'Course creators, educators & personal brand builders',
      icon: <Sparkles className="h-5 w-5 text-amber-400" />,
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      activeRing: 'border-amber-500/80 ring-2 ring-amber-500/20 bg-amber-500/[0.03]',
      mustHaves: [
        'English-speaking creator or business owner',
        'Sells digital product, course, or service',
        'Has longform content (YT / Podcast / IG)',
        'Audience: 20K–500K IG or 10K–500K YT',
      ],
      leadsCount: leads.filter((l) => l.category === 'PERSONAL_BRAND').length,
      qualifiedCount: leads.filter(
        (l) => l.category === 'PERSONAL_BRAND' && l.qualificationStatus === 'QUALIFIED'
      ).length,
    },
    {
      id: 'STREAMER' as LeadCategory,
      name: 'Streamers',
      title: 'Twitch & Kick Streamers',
      tagline: 'Live gaming, IRL & broadcasters with clip archives',
      icon: <Radio className="h-5 w-5 text-purple-400" />,
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      activeRing: 'border-purple-500/80 ring-2 ring-purple-500/20 bg-purple-500/[0.03]',
      mustHaves: [
        'Twitch or Kick ONLY (Strictly No YT Live)',
        'Streamed within last 30 days',
        'Has VOD / clip archive for repurposing',
        'Findable Instagram profile handle',
      ],
      leadsCount: leads.filter((l) => l.category === 'STREAMER').length,
      qualifiedCount: leads.filter(
        (l) => l.category === 'STREAMER' && l.qualificationStatus === 'QUALIFIED'
      ).length,
    },
    {
      id: 'SPORTSBOOK' as LeadCategory,
      name: 'Sportsbooks',
      title: 'iGaming Operators',
      tagline: 'Licensed sportsbooks with active creator programs',
      icon: <Trophy className="h-5 w-5 text-emerald-400" />,
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      activeRing: 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-500/[0.03]',
      mustHaves: [
        'Licensed in UK or US state jurisdiction',
        'MUST HAVE: Active affiliate / creator program',
        'Active brand IG (posted within last 30d)',
        'Verified corporate outreach point',
      ],
      leadsCount: leads.filter((l) => l.category === 'SPORTSBOOK').length,
      qualifiedCount: leads.filter(
        (l) => l.category === 'SPORTSBOOK' && l.qualificationStatus === 'QUALIFIED'
      ).length,
    },
    {
      id: 'INDIE_LABEL' as LeadCategory,
      name: 'Indie Labels',
      title: 'Music Record Labels',
      tagline: 'Independent music labels & artist roster managers',
      icon: <Disc className="h-5 w-5 text-cyan-400" />,
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
      activeRing: 'border-cyan-500/80 ring-2 ring-cyan-500/20 bg-cyan-500/[0.03]',
      mustHaves: [
        'Independent (No UMG / Sony / Warner)',
        'Mid-size roster (5–40 active artists)',
        'Active release within last 90 days',
        'Active label Instagram presence',
      ],
      leadsCount: leads.filter((l) => l.category === 'INDIE_LABEL').length,
      qualifiedCount: leads.filter(
        (l) => l.category === 'INDIE_LABEL' && l.qualificationStatus === 'QUALIFIED'
      ).length,
    },
  ];

  const toggleCriteria = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCriteria(expandedCriteria === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Category Section Title & View All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <h2 className="text-base font-bold text-white tracking-tight">
          Niche Categories
        </h2>

        {/* View All Button */}
        <button
          onClick={() => onSelectCategory('ALL')}
          className={`self-start sm:self-auto flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
            selectedCategory === 'ALL'
              ? 'bg-white text-slate-950 shadow-md font-bold'
              : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span>All Niche Categories ({leads.length})</span>
          {selectedCategory === 'ALL' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
        </button>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const isCriteriaOpen = expandedCriteria === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`group relative flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? cat.activeRing
                  : 'border-slate-800/80 bg-[#12141c]/60 hover:bg-[#12141c] hover:border-slate-700/80'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-slate-800/80 p-2 border border-slate-700/50 shadow-inner">
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400">
                        {cat.title}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-3.5 line-clamp-2 leading-relaxed">
                  {cat.tagline}
                </p>

                {/* Criteria Drawer Toggle */}
                <button
                  onClick={(e) => toggleCriteria(cat.id, e)}
                  className="flex items-center justify-between w-full rounded-md bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-800/60 hover:border-slate-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <SlidersHorizontal className="h-3 w-3 text-slate-400" />
                    <span>Gate Criteria ({cat.mustHaves.length})</span>
                  </span>
                  {isCriteriaOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </button>

                {/* Collapsible Must-Haves */}
                {isCriteriaOpen && (
                  <div className="mt-2 space-y-1.5 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800/80 text-[11px]">
                    {cat.mustHaves.map((req, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-slate-300">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span className="leading-snug">{req}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Metrics */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold border ${cat.badgeColor}`}>
                    {cat.leadsCount} Target Leads
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400 font-mono">
                    {cat.qualifiedCount} Passed
                  </span>
                </div>

                <span
                  className={`text-xs font-semibold flex items-center gap-1 transition-transform group-hover:translate-x-0.5 ${
                    isSelected ? 'text-white font-bold' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <span>{isSelected ? 'Active' : 'Filter'}</span>
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

