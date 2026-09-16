import React, { useState } from 'react';
import { Lead, EmailTemplate } from '../types';
import { qualifyLeadWithRules } from '../utils/rulesEngine';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, Cpu, Sparkles, Loader2, Play } from 'lucide-react';

interface BatchAuditModalProps {
  leads: Lead[];
  templates: EmailTemplate[];
  onClose: () => void;
  onAuditComplete: (updatedLeads: Lead[]) => void;
}

export const BatchAuditModal: React.FC<BatchAuditModalProps> = ({
  leads,
  templates,
  onClose,
  onAuditComplete,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  const handleStartBatchAudit = async () => {
    setIsRunning(true);
    setCurrentIndex(0);
    setAuditLogs([]);
    const results: Lead[] = [];

    for (let i = 0; i < leads.length; i++) {
      const target = leads[i];
      setCurrentIndex(i + 1);
      setAuditLogs((prev) => [...prev, `Auditing ${target.name} (${target.category})...`]);

      const auditResult = qualifyLeadWithRules(target, templates);
      const updatedLead: Lead = {
        ...target,
        qualificationStatus: auditResult.qualificationStatus,
        matchScore: auditResult.matchScore,
        gateChecks: auditResult.gateChecks,
        aiInsights: auditResult.aiInsights,
        personalizedEmail: auditResult.personalizedEmail,
        lastAuditDate: new Date().toISOString().split('T')[0],
      };

      results.push(updatedLead);
      setAuditLogs((prev) => [
        ...prev,
        `✓ ${target.name}: Verdict ${updatedLead.qualificationStatus} (${updatedLead.matchScore}% Match)`,
      ]);

      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    setIsRunning(false);
    onAuditComplete(results);
  };

  const progressPercent = leads.length > 0 ? Math.round((currentIndex / leads.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex h-full max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-white/10 bg-[#12141c]/95 backdrop-blur-md text-zinc-200 shadow-2xl overflow-hidden font-mono"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-tight font-sans">OP Rules Matrix Gate Audit</h2>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="rounded-lg px-2.5 py-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors text-xs font-sans"
            >
              Close
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Target Queue Size:</span>
              <span className="font-bold text-white font-mono">{leads.length} Leads</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Multi-factor deterministic engine evaluates leads against category gates (Personal Brand longform, Twitch/Kick platform gate, Sportsbook affiliate portal, Indie label roster size). 100% offline local processing.
            </p>
          </div>

          {/* Progress bar */}
          {isRunning && (
            <div className="space-y-2 font-mono">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Auditing {currentIndex} of {leads.length}...</span>
                <span className="text-indigo-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Console Audit Logs */}
          <div className="h-48 rounded-xl border border-white/10 bg-black/50 p-3 overflow-y-auto space-y-1 font-mono text-[11px]">
            {auditLogs.length === 0 ? (
              <p className="text-zinc-600">Click &quot;Start OP Gate Audit&quot; to begin evaluation.</p>
            ) : (
              auditLogs.map((log, i) => (
                <div
                  key={i}
                  className={`${
                    log.startsWith('✓')
                      ? 'text-emerald-400'
                      : log.startsWith('⚠')
                      ? 'text-rose-400'
                      : 'text-zinc-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 bg-black/40 p-4 font-sans">
          {!isRunning ? (
            <button
              onClick={handleStartBatchAudit}
              disabled={leads.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 p-2.5 font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 text-xs"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Start OP Gate Audit ({leads.length} Leads)</span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2 text-indigo-400 font-semibold text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Evaluating multi-factor category gates...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
