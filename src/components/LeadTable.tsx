import React from 'react';
import { Lead, QualificationStatus, OutreachStatus, SequenceStatus, LeadCategory } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Sparkles,
  Radio,
  Trophy,
  Disc,
  Mail,
  Instagram,
  Eye,
  Trash2,
  Bot,
  Zap,
  Calendar,
} from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  selectedLeadIds: string[];
  onToggleSelectLead: (id: string) => void;
  onSelectAllLeads: (selectAll: boolean) => void;
  onOpenLeadDetail: (lead: Lead) => void;
  onOpenOutreachComposer: (lead: Lead) => void;
  onQuickSendEmail: (lead: Lead) => void;
  onRunSingleAudit: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onBatchAuditSelected: () => void;
  onBatchOutreachSelected: () => void;
  onOpenAddModal?: () => void;
  onOpenUploadModal?: () => void;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  selectedLeadIds,
  onToggleSelectLead,
  onSelectAllLeads,
  onOpenLeadDetail,
  onOpenOutreachComposer,
  onQuickSendEmail,
  onRunSingleAudit,
  onDeleteLead,
  onBatchAuditSelected,
  onBatchOutreachSelected,
  onOpenAddModal,
  onOpenUploadModal,
}) => {
  const allSelected = leads.length > 0 && selectedLeadIds.length === leads.length;

  const getCategoryBadge = (category: LeadCategory) => {
    switch (category) {
      case 'PERSONAL_BRAND':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/20">
            <Sparkles className="h-3 w-3" /> Personal Brand
          </span>
        );
      case 'STREAMER':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300 border border-purple-500/20">
            <Radio className="h-3 w-3" /> Streamer
          </span>
        );
      case 'SPORTSBOOK':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/20">
            <Trophy className="h-3 w-3" /> Sportsbook
          </span>
        );
      case 'INDIE_LABEL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 border border-cyan-500/20">
            <Disc className="h-3 w-3" /> Indie Label
          </span>
        );
    }
  };

  const getSequencePill = (status?: SequenceStatus) => {
    switch (status) {
      case 'INITIAL_SENT':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 font-mono">
              <Send className="h-3 w-3" /> Initial Email Sent
            </span>
            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5 text-amber-400" /> 2-Day Follow-Up Pending
            </span>
          </div>
        );
      case 'FOLLOWUP_DUE':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 animate-pulse font-mono">
              <Clock className="h-3 w-3 text-amber-400" /> 2-Day Follow-Up Ready!
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Interval reached</span>
          </div>
        );
      case 'FOLLOWUP_SENT':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 font-mono">
              <CheckCircle2 className="h-3 w-3 text-purple-400" /> 2-Day Follow-Up Sent
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Awaiting response</span>
          </div>
        );
      case 'REPLIED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 font-mono">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Replied ✓
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-zinc-400 bg-white/5 border border-white/10 font-mono">
            Ready for Outreach
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Batch Actions Toolbar */}
      {selectedLeadIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-white/10 bg-indigo-950/40 backdrop-blur-sm px-4 py-3 text-xs text-slate-200 gap-2"
        >
          <span className="font-semibold text-white">
            Selected <strong className="text-indigo-400">{selectedLeadIds.length}</strong> target lead(s)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onBatchAuditSelected}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-amber-300 hover:bg-amber-500/20 font-bold transition-all shadow-sm"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>AI Audit Selected</span>
            </button>
            <button
              onClick={onBatchOutreachSelected}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-white hover:bg-indigo-500 font-bold transition-all shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Compose Campaign Batch</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Desktop Table View (Hidden on Small Mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/10 bg-white/[0.04] text-zinc-400 uppercase tracking-wider font-semibold backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAllLeads(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
                />
              </th>
              <th className="px-4 py-3.5">Lead & Contact</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Audience</th>
              <th className="px-4 py-3.5">2-Day Sequence Stage</th>
              <th className="px-4 py-3.5">Match Score</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-white">Pipeline is empty</h4>
                      <p className="text-xs text-zinc-400">
                        Add a target contact or import a CSV/JSON file to begin running qualification gate audits and outreach.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {onOpenAddModal && (
                        <button
                          onClick={onOpenAddModal}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all shadow-sm"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Add Contact</span>
                        </button>
                      )}
                      {onOpenUploadModal && (
                        <button
                          onClick={onOpenUploadModal}
                          className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-all border border-zinc-700/60"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Import CSV File</span>
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead, index) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03, ease: 'easeOut' }}
                    className={`group transition-colors hover:bg-white/[0.04] ${
                      isSelected ? 'bg-indigo-950/30' : ''
                    }`}
                  >
                    {/* Select Checkbox */}
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectLead(lead.id)}
                        className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
                      />
                    </td>

                    {/* Name & Gmail */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <button
                          onClick={() => onOpenLeadDetail(lead)}
                          className="font-bold text-white hover:text-indigo-400 transition-colors text-left flex items-center gap-1.5 text-sm"
                        >
                          <span>{lead.name}</span>
                          {lead.companyOrBrand && (
                            <span className="text-zinc-400 text-xs font-normal">
                              ({lead.companyOrBrand})
                            </span>
                          )}
                        </button>
                        <span className="font-mono text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                          <Mail className="h-3 w-3 text-zinc-500" />
                          {lead.email}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4">{getCategoryBadge(lead.category)}</td>

                    {/* Audience & Platform */}
                    <td className="px-4 py-4 text-xs">
                      <div className="text-zinc-200 font-semibold font-mono">
                        {lead.audienceSizeFormatted || 'N/A'}
                      </div>
                      {lead.instagramHandle && (
                        <div className="text-zinc-400 flex items-center gap-1 mt-0.5 text-[11px]">
                          <Instagram className="h-3 w-3 text-pink-400" />
                          {lead.instagramHandle}
                        </div>
                      )}
                    </td>

                    {/* 2-Day Sequence Stage */}
                    <td className="px-4 py-4">
                      {getSequencePill(lead.sequenceStatus)}
                    </td>

                    {/* Match Score */}
                    <td className="px-4 py-4 font-mono">
                      <span
                        className={`font-extrabold text-sm ${
                          lead.matchScore >= 90
                            ? 'text-emerald-400'
                            : lead.matchScore >= 70
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {lead.matchScore}%
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onQuickSendEmail(lead)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-xs shadow-sm"
                          title="1-Click Instant Email Dispatch"
                        >
                          <Zap className="h-3.5 w-3.5 fill-white" />
                          <span>Quick Send</span>
                        </button>

                        <button
                          onClick={() => onOpenOutreachComposer(lead)}
                          className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all text-xs"
                          title="Custom Edit Email Draft"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => onRunSingleAudit(lead)}
                          className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-amber-300 hover:border-amber-500/40 transition-all"
                          title="Run Gemini AI Gate Audit"
                        >
                          <Bot className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onOpenLeadDetail(lead)}
                          className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 transition-all"
                          title="Inspect Lead Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => onDeleteLead(lead.id)}
                          className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-rose-400 hover:border-rose-900/50 transition-all"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Cards (Displayed on Mobile Devices) */}
      <div className="md:hidden divide-y divide-zinc-800/80">
        {leads.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Pipeline is empty</h4>
                <p className="text-xs text-zinc-400">
                  Add contacts or import a dataset file to begin.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {onOpenAddModal && (
                  <button
                    onClick={onOpenAddModal}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all shadow-sm"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Add Contact</span>
                  </button>
                )}
                {onOpenUploadModal && (
                  <button
                    onClick={onOpenUploadModal}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-all border border-zinc-700/60"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Import File</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          leads.map((lead, index) => {
            const isSelected = selectedLeadIds.includes(lead.id);
            return (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
                className={`p-4 space-y-3 ${isSelected ? 'bg-indigo-950/30' : ''}`}
              >
                {/* Mobile Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectLead(lead.id)}
                      className="mt-1 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <h4
                        onClick={() => onOpenLeadDetail(lead)}
                        className="font-bold text-white text-sm hover:text-indigo-400 cursor-pointer"
                      >
                        {lead.name}
                      </h4>
                      <p className="font-mono text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-zinc-500" />
                        {lead.email}
                      </p>
                    </div>
                  </div>
                  {getCategoryBadge(lead.category)}
                </div>

                {/* Mobile Details Row */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-white/[0.03] p-2.5 text-xs border border-white/10 backdrop-blur-sm">
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-semibold">
                      Audience / IG
                    </span>
                    <span className="font-bold text-white font-mono">
                      {lead.audienceSizeFormatted || 'N/A'}
                    </span>
                    {lead.instagramHandle && (
                      <span className="text-zinc-400 block text-[11px] truncate">
                        {lead.instagramHandle}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-semibold">
                      2-Day Sequence Stage
                    </span>
                    <div className="mt-0.5">{getSequencePill(lead.sequenceStatus)}</div>
                  </div>
                </div>

                {/* Mobile Actions Toolbar */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-zinc-400">Match:</span>
                    <span
                      className={`font-bold ${
                        lead.matchScore >= 90
                          ? 'text-emerald-400'
                          : lead.matchScore >= 70
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {lead.matchScore}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onQuickSendEmail(lead)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white font-bold shadow-sm"
                    >
                      <Zap className="h-3.5 w-3.5 fill-white" />
                      <span>Send</span>
                    </button>
                    <button
                      onClick={() => onRunSingleAudit(lead)}
                      className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-amber-300 font-semibold"
                    >
                      <Bot className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenOutreachComposer(lead)}
                      className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenLeadDetail(lead)}
                      className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

