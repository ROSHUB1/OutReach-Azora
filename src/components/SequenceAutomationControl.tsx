import React from 'react';
import { Play, Clock, CheckCircle2, RefreshCw, Send, Sliders, Calendar, Upload, Mail, Zap, ArrowRightLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Lead, OAuthGmailAccount } from '../types';

interface SequenceAutomationControlProps {
  leads: Lead[];
  onRunFullSequence: () => void;
  onOpenTemplateModal: () => void;
  onOpenUploadModal: () => void;
  onNavigateToSenders?: () => void;
  gmailAccounts?: OAuthGmailAccount[];
  rotationMode?: 'ROUND_ROBIN' | 'SPECIFIC_ACCOUNT';
  isProcessing?: boolean;
}

export const SequenceAutomationControl: React.FC<SequenceAutomationControlProps> = ({
  leads,
  onRunFullSequence,
  onOpenTemplateModal,
  onOpenUploadModal,
  onNavigateToSenders,
  gmailAccounts = [],
  rotationMode = 'ROUND_ROBIN',
  isProcessing = false,
}) => {
  const notStartedCount = leads.filter((l) => l.sequenceStatus === 'NOT_STARTED' || !l.sequenceStatus).length;
  const initialSentCount = leads.filter((l) => l.sequenceStatus === 'INITIAL_SENT').length;
  const followupDueCount = leads.filter((l) => l.sequenceStatus === 'FOLLOWUP_DUE').length;
  const followupSentCount = leads.filter((l) => l.sequenceStatus === 'FOLLOWUP_SENT').length;
  const repliedCount = leads.filter((l) => l.sequenceStatus === 'REPLIED' || l.sequenceStatus === 'CLOSED').length;

  const connectedGmails = gmailAccounts.filter((a) => a.isConnected && a.isActive);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="rounded-xl border border-zinc-800 bg-[#0d0f15] p-5 shadow-sm space-y-4 font-sans text-xs"
    >
      {/* Upper Bar: Title & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Sequence Cadence & Outreach Automation
            </h2>
            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300 font-mono border border-zinc-700/50">
              2-Day Cadence
            </span>

            {connectedGmails.length > 0 ? (
              <button
                onClick={onNavigateToSenders}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                title="Click to manage Gmail senders"
              >
                <Zap className="h-3 w-3 text-emerald-400 animate-pulse" />
                <span>
                  {connectedGmails.length} Gmail Account{connectedGmails.length > 1 ? 's' : ''} Live ({rotationMode === 'ROUND_ROBIN' ? 'Smart Rotation' : 'Active'})
                </span>
              </button>
            ) : (
              <button
                onClick={onNavigateToSenders}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all"
              >
                <Mail className="h-3 w-3 text-indigo-400" />
                <span>Connect Gmail Senders</span>
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Automates lead qualification checks, generates custom first-touch copy, and dispatches scheduled 2-day follow-ups directly via authenticated Gmail accounts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <Upload className="h-3.5 w-3.5 text-zinc-400" />
            <span>Import Leads</span>
          </button>

          <button
            onClick={onOpenTemplateModal}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <Sliders className="h-3.5 w-3.5 text-zinc-400" />
            <span>Templates</span>
          </button>

          <button
            onClick={onRunFullSequence}
            disabled={isProcessing}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
          >
            {isProcessing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-white" />
            )}
            <span>{isProcessing ? 'Processing Sequence...' : 'Run Outreach Sequence'}</span>
          </button>
        </div>
      </div>

      {/* Cadence Pipeline Visualizer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1: Initial Outreach */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-300 flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-indigo-400" />
              Day 1: Initial Outreach
            </span>
            <span className="font-mono text-zinc-300 font-semibold">{notStartedCount} Ready</span>
          </div>
          <p className="text-[11px] text-zinc-400">
            {notStartedCount > 0 ? `${notStartedCount} contacts ready for initial touch` : 'All contacts initiated'}
          </p>
        </div>

        {/* Step 2: 2-Day Buffer */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              Day 2: Waiting Period
            </span>
            <span className="font-mono text-zinc-300 font-semibold">{initialSentCount} Waiting</span>
          </div>
          <p className="text-[11px] text-zinc-400">48-hour response buffer active</p>
        </div>

        {/* Step 3: Follow-Up */}
        <div className={`rounded-lg border p-3 flex flex-col justify-between space-y-2 ${
          followupDueCount > 0
            ? 'border-amber-500/40 bg-amber-500/10'
            : 'border-zinc-800 bg-zinc-900/50'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium flex items-center gap-1.5 ${followupDueCount > 0 ? 'text-amber-300 font-semibold' : 'text-zinc-300'}`}>
              <Clock className={`h-3.5 w-3.5 ${followupDueCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`} />
              Day 3: Follow-Up
            </span>
            <span className={`font-mono font-semibold ${followupDueCount > 0 ? 'text-amber-300' : 'text-zinc-300'}`}>
              {followupDueCount} Due
            </span>
          </div>
          <p className={`text-[11px] ${followupDueCount > 0 ? 'text-amber-300/90' : 'text-zinc-400'}`}>
            {followupDueCount > 0 ? `${followupDueCount} follow-up email(s) ready to send` : `${followupSentCount} follow-ups completed`}
          </p>
        </div>

        {/* Step 4: Outcome / Replied */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Replies & Conversions
            </span>
            <span className="font-mono text-emerald-400 font-semibold">{repliedCount}</span>
          </div>
          <p className="text-[11px] text-zinc-400">Positive engagement responses</p>
        </div>
      </div>
    </motion.div>
  );
};
