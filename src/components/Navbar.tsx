import React, { useState } from 'react';
import {
  Mail,
  Plus,
  Cpu,
  FileText,
  CheckCircle2,
  Menu,
  X,
  Radio,
  Trophy,
  Disc,
  LayoutGrid,
  RotateCcw,
  Sparkles,
  Zap,
  Users,
  BarChart3,
  FileCode,
  Upload,
  Settings,
  Activity,
} from 'lucide-react';
import { LeadCategory, DispatchMethod } from '../types';

export type MainTab = 'directory' | 'sequence' | 'senders' | 'analytics' | 'templates';

interface NavbarProps {
  activeMainTab: MainTab;
  onSelectMainTab: (tab: MainTab) => void;
  onOpenAddModal: () => void;
  onOpenBatchAuditModal: () => void;
  onOpenTemplateModal: () => void;
  onOpenUploadModal: () => void;
  onOpenDispatchSettings: () => void;
  onOpenDispatchLogs: () => void;
  onRunFullSequence: () => void;
  totalLeadsCount: number;
  qualifiedCount: number;
  dispatchLogsCount?: number;
  connectedGmailCount?: number;
  activeDispatchMethod?: DispatchMethod;
  selectedCategory: LeadCategory | 'ALL';
  onSelectCategory: (cat: LeadCategory | 'ALL') => void;
  onClearData?: () => void;
  isProcessingSequence?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMainTab,
  onSelectMainTab,
  onOpenAddModal,
  onOpenBatchAuditModal,
  onOpenTemplateModal,
  onOpenUploadModal,
  onOpenDispatchSettings,
  onOpenDispatchLogs,
  onRunFullSequence,
  totalLeadsCount,
  qualifiedCount,
  dispatchLogsCount = 0,
  connectedGmailCount = 0,
  activeDispatchMethod = 'GMAIL_API',
  selectedCategory,
  onSelectCategory,
  onClearData,
  isProcessingSequence = false,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#090a0f]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: Brand Logo & Workspace View Toggle */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700/60">
                <Mail className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-white">
                  Outreach <span className="text-zinc-400 font-normal">Studio</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-zinc-800/70 px-2 py-0.5 text-[11px] font-medium text-zinc-400 border border-zinc-700/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Ready
                </span>
              </div>
            </div>

            {/* View Switcher Tabs (Desktop) */}
            <nav className="hidden lg:flex items-center gap-1 rounded-lg bg-zinc-900/60 p-1 border border-zinc-800/80 text-xs font-medium">
              {[
                { key: 'directory', label: 'Contacts', icon: Users },
                { key: 'sequence', label: 'Sequences', icon: Zap },
                {
                  key: 'senders',
                  label: 'Gmail Senders',
                  icon: Mail,
                  badge: connectedGmailCount > 0 ? `${connectedGmailCount}/5 Live` : '5 Slots',
                  badgeColor: connectedGmailCount > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                },
                { key: 'analytics', label: 'Analytics', icon: BarChart3 },
                { key: 'templates', label: 'Templates', icon: FileCode },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeMainTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => onSelectMainTab(tab.key as MainTab)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all ${
                      isActive
                        ? 'bg-zinc-800 text-white font-medium shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-semibold border ${tab.badgeColor}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Master Actions & Controls */}
          <div className="flex items-center gap-2">
            {/* Real-time Dispatch Settings (Bird API / SMTP) */}
            <button
              onClick={onOpenDispatchSettings}
              title="Email dispatch and API settings"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
            >
              <Settings className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Dispatch</span>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            </button>

            {/* Live Dispatch Logs */}
            <button
              onClick={onOpenDispatchLogs}
              title="View delivery activity logs"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
            >
              <Activity className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden md:inline">Logs</span>
              {dispatchLogsCount > 0 && (
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[10px] font-medium text-zinc-300 font-mono border border-zinc-700/50">
                  {dispatchLogsCount}
                </span>
              )}
            </button>

            {/* Upload Dataset */}
            <button
              onClick={onOpenUploadModal}
              className="hidden md:flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
            >
              <Upload className="h-3.5 w-3.5 text-zinc-400" />
              <span>Import</span>
            </button>

            {/* Run Full Sequence */}
            <button
              onClick={onRunFullSequence}
              disabled={isProcessingSequence}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              title="Process automated outreach sequence"
            >
              <Zap className="h-3.5 w-3.5 fill-zinc-900 text-zinc-900" />
              <span className="hidden sm:inline">Run Sequence</span>
              <span className="sm:hidden">Run</span>
            </button>

            {/* Add Contact */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Contact</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-fade-in lg:hidden">
          <div className="flex h-full w-full max-w-xs flex-col bg-[#0d0f15] border-r border-zinc-800 p-5 text-zinc-200 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-zinc-800 p-2 text-indigo-400 border border-zinc-700/60">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Outreach Studio</h3>
                  <p className="text-xs text-zinc-400">Campaign Management</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Section Navigation Tabs */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Views
              </span>
              <div className="space-y-1">
                {[
                  { key: 'directory', label: 'Contacts', icon: Users },
                  { key: 'sequence', label: 'Sequences', icon: Zap },
                  {
                    key: 'senders',
                    label: 'Gmail Senders (5 Slots)',
                    icon: Mail,
                    badge: connectedGmailCount > 0 ? `${connectedGmailCount}/5 Live` : undefined,
                  },
                  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { key: 'templates', label: 'Templates', icon: FileCode },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeMainTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        onSelectMainTab(tab.key as MainTab);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-xs font-medium min-h-[44px] transition-all ${
                        isActive
                          ? 'bg-zinc-800 text-white font-semibold border border-zinc-700/60'
                          : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge && (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-1.5 pt-3 border-t border-zinc-800">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Settings & Tools
              </span>

              <button
                onClick={() => {
                  onOpenDispatchSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-zinc-200 text-xs hover:bg-zinc-800 min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 text-zinc-400" />
                  <span>Dispatch Settings</span>
                </div>
                <span className="text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700/50">Bird API</span>
              </button>

              <button
                onClick={() => {
                  onOpenDispatchLogs();
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-zinc-200 text-xs hover:bg-zinc-800 min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="h-4 w-4 text-zinc-400" />
                  <span>Delivery Activity Logs</span>
                </div>
                {dispatchLogsCount > 0 && (
                  <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700/50">
                    {dispatchLogsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onOpenUploadModal();
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-zinc-200 text-xs hover:bg-zinc-800 min-h-[44px]"
              >
                <Upload className="h-4 w-4 text-zinc-400" />
                <span>Import Dataset</span>
              </button>

              <button
                onClick={() => {
                  onOpenAddModal();
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg bg-indigo-600 p-2.5 font-semibold text-white hover:bg-indigo-500 text-xs shadow-sm min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                <span>New Contact</span>
              </button>
            </div>

            {/* Niche Category Filter */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Filter Creator Category
              </span>
              <div className="space-y-1">
                {[
                  { key: 'ALL', label: 'All Targets', icon: <LayoutGrid className="h-4 w-4 text-zinc-400" /> },
                  { key: 'PERSONAL_BRAND', label: 'Personal Brands', icon: <Sparkles className="h-4 w-4 text-amber-400" /> },
                  { key: 'STREAMER', label: 'Streamers (Twitch/Kick)', icon: <Radio className="h-4 w-4 text-purple-400" /> },
                  { key: 'SPORTSBOOK', label: 'Sportsbook Operators', icon: <Trophy className="h-4 w-4 text-emerald-400" /> },
                  { key: 'INDIE_LABEL', label: 'Indie Record Labels', icon: <Disc className="h-4 w-4 text-cyan-400" /> },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      onSelectCategory(item.key as LeadCategory | 'ALL');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      selectedCategory === item.key
                        ? 'bg-white/10 text-white font-bold border border-white/20'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="rounded-lg bg-white/5 p-3 border border-white/10 text-xs space-y-1">
                <div className="flex justify-between text-zinc-300">
                  <span>Target Leads:</span>
                  <span className="font-bold text-white font-mono">{totalLeadsCount}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Qualified:</span>
                  <span className="font-bold font-mono">{qualifiedCount} Passed</span>
                </div>
              </div>

              {onClearData && totalLeadsCount > 0 && (
                <button
                  onClick={() => {
                    onClearData();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-rose-400 hover:text-rose-300 hover:border-rose-500/30 transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear Pipeline Leads</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
