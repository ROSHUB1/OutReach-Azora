import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert, Sparkles, Radio, Trophy, Disc, Check } from 'lucide-react';

export const GateCriteriaReference: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#12141c]/80 overflow-hidden text-xs shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 bg-slate-900/60 hover:bg-slate-900 text-slate-300 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <span className="font-bold text-white text-xs tracking-tight">
            Category Qualification Criteria
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>{isOpen ? 'Collapse Rules' : 'Inspect All Gate Rules'}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-t border-slate-800/80 bg-slate-950/40">
          {/* Personal Brands */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
              <Sparkles className="h-4 w-4" />
              <span>Personal Brands & Coaches</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span>English-speaking creator or owner</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span>Sells course, coaching, digital/physical product, or service</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span>Has long-form content (YT, podcasts, webinars, 10m+ IG)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span>Public Instagram account</span>
              </li>
              <li className="flex items-start gap-1.5 font-semibold text-amber-200">
                <Check className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span>Audience: 20K–500K IG OR 10K–500K YouTube</span>
              </li>
            </ul>
          </div>

          {/* Streamers */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.03] p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-300 text-xs">
              <Radio className="h-4 w-4" />
              <span>Twitch & Kick Streamers</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5 font-bold text-purple-200">
                <Check className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>Twitch or Kick ONLY (Strictly No YT Live/Rumble)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>English-speaking broadcaster</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>Streamed within last 30 days</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>Has VOD or clip archive to cut from</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>Mid-tier (not top-tier mega streamer)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>Findable Instagram handle</span>
              </li>
            </ul>
          </div>

          {/* Sportsbooks */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs">
              <Trophy className="h-4 w-4" />
              <span>Sportsbook Operators</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Licensed in UK or US state jurisdiction</span>
              </li>
              <li className="flex items-start gap-1.5 text-emerald-200 font-bold bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/30">
                <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>MAKE-OR-BREAK: Runs active affiliate/creator program</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Active brand IG (posted within last 30d)</span>
              </li>
            </ul>
          </div>

          {/* Indie Music Labels */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-cyan-300 text-xs">
              <Disc className="h-4 w-4" />
              <span>Indie Record Labels</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                <span>Independent label (Not UMG / Sony / Warner)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                <span>Mid-size roster (roughly 5–40 active artists)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                <span>English-language roster</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                <span>Active release within last 90 days</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                <span>Active label Instagram presence</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

