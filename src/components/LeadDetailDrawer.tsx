import React, { useState } from 'react';
import { Lead } from '../types';
import { motion } from 'motion/react';
import {
  X,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Bot,
  Mail,
  Instagram,
  Youtube,
  Radio,
  Globe,
  Send,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Cpu,
} from 'lucide-react';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onRunAudit: (lead: Lead) => void;
  onOpenComposer: (lead: Lead) => void;
  onUpdateLeadStatus: (id: string, qualificationStatus: Lead['qualificationStatus'], outreachStatus: Lead['outreachStatus']) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  onRunAudit,
  onOpenComposer,
  onUpdateLeadStatus,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!lead) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenGmailMailto = () => {
    if (!lead.personalizedEmail) return;
    const subject = encodeURIComponent(lead.personalizedEmail.subject);
    const body = encodeURIComponent(lead.personalizedEmail.body);
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank');
    onUpdateLeadStatus(lead.id, lead.qualificationStatus, 'SENT');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex h-full w-full max-w-2xl flex-col bg-[#12141c]/95 border-l border-white/10 text-zinc-200 shadow-2xl overflow-hidden font-sans text-xs"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-indigo-400 border border-zinc-700/60">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>{lead.name}</span>
                {lead.companyOrBrand && (
                  <span className="text-xs text-zinc-400 font-normal">({lead.companyOrBrand})</span>
                )}
              </h2>
              <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{lead.email}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] text-zinc-400">{lead.category.replace('_', ' ')}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Status Banner & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400 font-medium block">
                Qualification Status
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                    lead.qualificationStatus === 'QUALIFIED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : lead.qualificationStatus === 'NEEDS_AUDIT'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {lead.qualificationStatus === 'QUALIFIED' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {lead.qualificationStatus === 'NEEDS_AUDIT' && <ShieldAlert className="h-3.5 w-3.5" />}
                  {lead.qualificationStatus === 'DISQUALIFIED' && <XCircle className="h-3.5 w-3.5" />}
                  {lead.qualificationStatus.replace('_', ' ')} ({lead.matchScore}% Match)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onRunAudit(lead)}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-all"
              >
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                <span>Re-Audit Lead</span>
              </button>
              <button
                onClick={() => onOpenComposer(lead)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white transition-all shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Compose Outreach</span>
              </button>
            </div>
          </div>

          {/* Social Profiles & Key Links */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-zinc-400">
              Verified Profiles & Channels
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {lead.instagramHandle && (
                <a
                  href={`https://instagram.com/${lead.instagramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-zinc-300 hover:border-zinc-700 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-400" />
                    <span>{lead.instagramHandle}</span>
                  </span>
                  <ExternalLink className="h-3 w-3 text-zinc-500" />
                </a>
              )}

              {lead.youtubeUrl && (
                <a
                  href={lead.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-zinc-300 hover:border-zinc-700 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-400" />
                    <span className="truncate">YouTube Channel</span>
                  </span>
                  <ExternalLink className="h-3 w-3 text-zinc-500" />
                </a>
              )}

              {lead.twitchOrKickUrl && (
                <a
                  href={lead.twitchOrKickUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-zinc-300 hover:border-zinc-700 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-purple-400" />
                    <span className="truncate">Twitch / Kick</span>
                  </span>
                  <ExternalLink className="h-3 w-3 text-zinc-500" />
                </a>
              )}

              {lead.websiteUrl && (
                <a
                  href={lead.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-zinc-300 hover:border-zinc-700 hover:text-white transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-cyan-400" />
                    <span className="truncate">Website</span>
                  </span>
                  <ExternalLink className="h-3 w-3 text-zinc-500" />
                </a>
              )}
            </div>
          </div>

          {/* Gate Criteria Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <h3 className="font-medium text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Qualification Gate Checks</span>
              </h3>
              <span className="text-zinc-500 text-[11px]">
                {lead.gateChecks.filter((g) => g.passed).length}/{lead.gateChecks.length} Passed
              </span>
            </div>

            <div className="space-y-2">
              {lead.gateChecks.map((gate) => (
                <div
                  key={gate.id}
                  className={`flex items-start justify-between rounded-lg border p-3 text-xs transition-all ${
                    gate.passed
                      ? 'border-zinc-800 bg-zinc-900/30'
                      : gate.isMakeOrBreak
                      ? 'border-rose-500/40 bg-rose-500/10'
                      : 'border-zinc-800 bg-zinc-950'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-zinc-200 flex items-center gap-2">
                      <span>{gate.label}</span>
                      {gate.isMakeOrBreak && (
                        <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-medium text-rose-300">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">{gate.description}</p>
                  </div>
                  <div className="shrink-0 pl-3">
                    {gate.passed ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Passed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 font-medium text-[11px]">
                        <XCircle className="h-4 w-4 text-rose-400" /> Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights & Angle */}
          {lead.aiInsights && (
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-xs">
              <h3 className="font-medium text-zinc-200 flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-indigo-400" />
                <span>Prospect Analysis & Recommended Angle</span>
              </h3>
              <p className="text-zinc-300 leading-relaxed">{lead.aiInsights.summary}</p>

              {lead.aiInsights.strengths.length > 0 && (
                <div>
                  <span className="text-[11px] text-emerald-400 font-medium block mb-1">
                    Key Strengths:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400 text-[11px]">
                    {lead.aiInsights.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {lead.aiInsights.dealbreakers.length > 0 && (
                <div>
                  <span className="text-[11px] text-rose-400 font-medium block mb-1">
                    Potential Concerns:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-400 text-[11px]">
                    {lead.aiInsights.dealbreakers.map((db, i) => (
                      <li key={i}>{db}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-xs">
                <span className="text-zinc-500 block mb-0.5 text-[11px]">
                  Recommended Outreach Angle:
                </span>
                <p className="text-amber-300 font-medium">{lead.aiInsights.recommendedAngle}</p>
              </div>
            </div>
          )}

          {/* Personalized Gmail Draft Preview */}
          {lead.personalizedEmail && (
            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center justify-between text-xs">
                <h3 className="font-medium text-zinc-200 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-indigo-400" />
                  <span>Draft Outreach</span>
                </h3>
                <button
                  onClick={handleOpenGmailMailto}
                  className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30 transition-all"
                >
                  <Send className="h-3 w-3" />
                  <span>Open in Mail</span>
                </button>
              </div>

              {/* Subject */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>Subject Line:</span>
                  <button
                    onClick={() => handleCopy(lead.personalizedEmail!.subject, 'subject')}
                    className="text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedField === 'subject' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="rounded-lg bg-zinc-950 p-2.5 text-zinc-200 border border-zinc-800 font-mono text-xs">
                  {lead.personalizedEmail.subject}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                  <span>Email Message:</span>
                  <button
                    onClick={() => handleCopy(lead.personalizedEmail!.body, 'body')}
                    className="text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedField === 'body' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="rounded-lg bg-zinc-950 p-3 text-zinc-300 border border-zinc-800 whitespace-pre-wrap leading-relaxed text-xs">
                  {lead.personalizedEmail.body}
                </div>
              </div>

              {/* IG DM Script */}
              <div className="space-y-1 text-xs pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between text-pink-300 text-[11px]">
                  <span className="flex items-center gap-1 font-medium">
                    <Instagram className="h-3.5 w-3.5" /> Instagram DM Script
                  </span>
                  <button
                    onClick={() => handleCopy(lead.personalizedEmail!.instagramDmScript, 'dm')}
                    className="text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedField === 'dm' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="rounded-lg bg-zinc-950 p-2.5 text-pink-200 border border-zinc-800 text-xs">
                  {lead.personalizedEmail.instagramDmScript}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
