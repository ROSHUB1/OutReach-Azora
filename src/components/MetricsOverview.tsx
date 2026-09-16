import React from 'react';
import { Users, Send, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Lead } from '../types';

interface MetricsOverviewProps {
  leads: Lead[];
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ leads }) => {
  const totalLeads = leads.length;
  const initialSentCount = leads.filter((l) => ['INITIAL_SENT', 'FOLLOWUP_DUE', 'FOLLOWUP_SENT', 'REPLIED'].includes(l.sequenceStatus)).length;
  const followupDueCount = leads.filter((l) => l.sequenceStatus === 'FOLLOWUP_DUE').length;
  const followupSentCount = leads.filter((l) => l.sequenceStatus === 'FOLLOWUP_SENT').length;
  const repliedCount = leads.filter((l) => l.sequenceStatus === 'REPLIED' || l.outreachStatus === 'REPLIED').length;

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.06, duration: 0.3, ease: 'easeOut' },
    }),
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Metric 1: Total Queue */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-all hover:border-zinc-700 shadow-sm"
      >
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span>Target Contacts</span>
          <Users className="h-4 w-4 text-zinc-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold text-white tracking-tight">{totalLeads}</span>
          <span className="text-[11px] text-zinc-500 font-mono">In Database</span>
        </div>
      </motion.div>

      {/* Metric 2: Initial Email Sent */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-all hover:border-zinc-700 shadow-sm"
      >
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span>Initial Email Sent</span>
          <Send className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold text-indigo-300 tracking-tight">{initialSentCount}</span>
          <span className="text-[11px] text-zinc-500 font-mono">Day 0 Outreach</span>
        </div>
      </motion.div>

      {/* Metric 3: 2-Day Follow-Up Queue */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={`rounded-xl border p-4 transition-all shadow-sm ${
          followupDueCount > 0
            ? 'border-amber-500/40 bg-amber-500/10'
            : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span className={followupDueCount > 0 ? 'text-amber-300 font-medium' : ''}>2-Day Follow-Up</span>
          <Clock className={`h-4 w-4 ${followupDueCount > 0 ? 'text-amber-400' : 'text-zinc-500'}`} />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className={`font-mono text-2xl font-bold tracking-tight ${followupDueCount > 0 ? 'text-amber-300' : 'text-zinc-200'}`}>
            {followupDueCount} Due
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">{followupSentCount} Sent</span>
        </div>
      </motion.div>

      {/* Metric 4: Replied / Closed */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-all hover:border-zinc-700 shadow-sm"
      >
        <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span>Replied & Interested</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold text-emerald-400 tracking-tight">{repliedCount}</span>
          <span className="text-[11px] text-emerald-400/80 font-mono">
            {totalLeads > 0 ? Math.round((repliedCount / totalLeads) * 100) : 0}% Response Rate
          </span>
        </div>
      </motion.div>
    </div>
  );
};


