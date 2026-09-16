import React, { useState } from 'react';
import { Lead, EmailTemplate, SmtpConfig, BirdConfig, DispatchMethod, OAuthGmailAccount } from '../types';
import { motion } from 'motion/react';
import { X, Send, Sparkles, Copy, Check, Mail, Instagram, RefreshCw, Wand2, Globe, Server, Download, ExternalLink, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { sendEmailViaGmail } from '../utils/gmailApi';

interface OutreachComposerModalProps {
  lead: Lead | null;
  templates: EmailTemplate[];
  birdConfig: BirdConfig | null;
  smtpConfig: SmtpConfig | null;
  gmailAccounts?: OAuthGmailAccount[];
  preferredMethod: DispatchMethod;
  onClose: () => void;
  onSendOutreach: (leadId: string, subject: string, body: string, dmScript: string, dispatchMethod?: DispatchMethod, dispatchResult?: any) => void;
}

export const OutreachComposerModal: React.FC<OutreachComposerModalProps> = ({
  lead,
  templates,
  birdConfig,
  smtpConfig,
  gmailAccounts = [],
  preferredMethod,
  onClose,
  onSendOutreach,
}) => {
  if (!lead) return null;

  const connectedGmails = gmailAccounts.filter((a) => a.isConnected);
  const [selectedGmailId, setSelectedGmailId] = useState<string>(
    connectedGmails.find((a) => a.isActive)?.id || connectedGmails[0]?.id || ''
  );

  // Find matching template or default
  const defaultTpl = templates.find((t) => t.category === lead.category) || templates[0];

  const [subject, setSubject] = useState(
    lead.personalizedEmail?.subject ||
      defaultTpl.subjectTemplate
        .replace(/{name}/g, lead.name)
        .replace(/{companyOrBrand}/g, lead.companyOrBrand || lead.name)
  );

  const [body, setBody] = useState(
    lead.personalizedEmail?.body ||
      defaultTpl.bodyTemplate
        .replace(/{name}/g, lead.name)
        .replace(/{companyOrBrand}/g, lead.companyOrBrand || lead.name)
        .replace(/{monetizationOffer}/g, lead.details.monetizationOffer || 'digital product')
        .replace(/{longFormContentFormat}/g, lead.details.longFormContentFormat || 'long-form content')
        .replace(/{audienceSizeFormatted}/g, lead.audienceSizeFormatted || 'Instagram')
        .replace(/{streamingPlatform}/g, lead.details.streamingPlatform || 'Twitch')
        .replace(/{instagramHandle}/g, lead.instagramHandle || '@brand')
        .replace(/{licensingJurisdiction}/g, lead.details.licensingJurisdiction || 'UK/US')
        .replace(/{artistRosterCount}/g, String(lead.details.artistRosterCount || 15))
  );

  const [dmScript, setDmScript] = useState(
    lead.personalizedEmail?.instagramDmScript ||
      defaultTpl.dmTemplate
        .replace(/{name}/g, lead.name)
        .replace(/{companyOrBrand}/g, lead.companyOrBrand || lead.name)
        .replace(/{streamingPlatform}/g, lead.details.streamingPlatform || 'Twitch')
  );

  const [customPrompt, setCustomPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dispatchFeedback, setDispatchFeedback] = useState<{
    type: 'warning' | 'error' | 'success';
    message: string;
    remediation?: string;
    gmailUrl?: string;
  } | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegenerateWithGemini = async () => {
    setIsRegenerating(true);
    setDispatchFeedback(null);
    try {
      const response = await fetch('/api/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          customInstructions: customPrompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.subject) setSubject(data.subject);
        if (data.body) setBody(data.body);
        if (data.instagramDmScript) setDmScript(data.instagramDmScript);
      }
    } catch (err) {
      console.error('Error regenerating copy:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const activeSender = connectedGmails.find((a) => a.id === selectedGmailId) || connectedGmails[0];

  // Direct Live Gmail API Dispatch using Authenticated OAuth account
  const handleSendViaGmailOAuth = async () => {
    if (!activeSender) {
      setDispatchFeedback({
        type: 'warning',
        message: 'No connected Gmail sender. Reconnect your Gmail in the Senders tab or open 1-Click Gmail Web.',
        gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      });
      return;
    }

    setIsSending(true);
    setDispatchFeedback(null);
    try {
      const result = await sendEmailViaGmail({
        to: lead.email,
        subject,
        body,
        fromName: activeSender.name,
        fromEmail: activeSender.email,
        accessToken: activeSender.accessToken || undefined,
        accountId: activeSender.id,
      });

      if (result.success) {
        onSendOutreach(lead.id, subject, body, dmScript, 'GMAIL_API', {
          ...result,
          message: `Dispatched live via Gmail API (${activeSender.email})`,
        });
        onClose();
      } else {
        setDispatchFeedback({
          type: 'warning',
          message: result.error || 'Failed to dispatch via Gmail API.',
          remediation: 'You can reconnect your account in the Senders tab or open the direct Gmail compose fallback.',
          gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        });
      }
    } catch (err: any) {
      setDispatchFeedback({
        type: 'error',
        message: err.message || 'Error executing Gmail API dispatch.',
        gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Real-Time Dispatch via Bird Email API
  const handleSendViaBird = async () => {
    setIsSending(true);
    setDispatchFeedback(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.email,
          subject,
          body,
          leadId: lead.id,
          leadName: lead.name,
          dispatchMethod: 'BIRD_API',
          birdConfig,
        }),
      });

      const data = await res.json();
      if (data.success && data.status === 'ACCEPTED_BY_BIRD') {
        onSendOutreach(lead.id, subject, body, dmScript, 'BIRD_API', data);
        onClose();
      } else if (!data.success && data.method === 'BIRD_API') {
        // Bird returned domain onboarding or recipient restriction
        setDispatchFeedback({
          type: 'warning',
          message: `Bird API: ${data.error}`,
          remediation: data.remediation,
          gmailUrl: data.gmailComposeUrl,
        });
      } else {
        setDispatchFeedback({
          type: 'error',
          message: data.error || 'Failed to dispatch via Bird API',
          gmailUrl: data.gmailComposeUrl,
        });
      }
    } catch (err: any) {
      setDispatchFeedback({
        type: 'error',
        message: `Network error: ${err.message}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  // 1-Click Direct Gmail Web Compose Launch
  const handleLaunchGmailWeb = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    onSendOutreach(lead.id, subject, body, dmScript, 'GMAIL_WEB', { message: 'Opened direct Gmail web composer' });
    onClose();
  };

  // Live Backend SMTP Dispatch
  const handleSendViaBackendSmtp = async () => {
    setIsSending(true);
    setDispatchFeedback(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.email,
          subject,
          body,
          leadId: lead.id,
          leadName: lead.name,
          dispatchMethod: 'SMTP_SERVER',
          smtpConfig,
        }),
      });

      const data = await res.json();
      if (data.success && data.method === 'SMTP_SERVER') {
        onSendOutreach(lead.id, subject, body, dmScript, 'SMTP_SERVER', data);
        onClose();
      } else {
        setDispatchFeedback({
          type: 'warning',
          message: data.error || 'SMTP delivery failed',
          gmailUrl: data.gmailComposeUrl,
        });
      }
    } catch (err: any) {
      setDispatchFeedback({
        type: 'error',
        message: `SMTP error: ${err.message}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Download .eml File for Outlook / Mail app
  const handleDownloadEml = () => {
    const emlContent = `From: "Outreach Studio" <outreach@studio.com>
To: ${lead.email}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8

${body}`;

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outreach_${lead.name.replace(/\s+/g, '_')}.eml`;
    a.click();
    URL.revokeObjectURL(url);

    onSendOutreach(lead.id, subject, body, dmScript, 'EML_FILE', { message: 'Exported .eml email file' });
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex h-full max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#12141c]/95 backdrop-blur-md text-zinc-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-indigo-400 border border-zinc-700/60">
              <Send className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Compose Outreach
              </h2>
              <p className="text-xs text-zinc-400">Personalized sequence copy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lead Target Info Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-black/40 px-6 py-2.5 text-xs">
          <div>
            <span className="text-zinc-400">To:</span>{' '}
            <strong className="text-white font-medium">{lead.name}</strong>{' '}
            <span className="text-zinc-400 font-mono">({lead.email})</span>
          </div>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300 font-mono border border-zinc-700/50">
            {lead.category.replace('_', ' ')}
          </span>
        </div>

        {/* Composer Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* AI Customization Prompt Bar */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 text-amber-400" /> Refine Tone with AI
              </span>
              <span className="text-zinc-500 text-[11px]">Optional custom prompt</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Make it more concise, emphasize turnaround time..."
                className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={handleRegenerateWithGemini}
                disabled={isRegenerating}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-zinc-200 border border-zinc-700/60 hover:bg-zinc-700 font-medium transition-all text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Generating...' : 'Refine Copy'}</span>
              </button>
            </div>
          </div>

          {/* Subject Line */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label className="font-medium text-zinc-300">Subject Line</label>
              <button
                onClick={() => handleCopy(subject, 'subject')}
                className="hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedField === 'subject' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>Copy</span>
              </button>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-white focus:border-indigo-500 focus:outline-none font-medium text-xs"
            />
          </div>

          {/* Email Body */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label className="font-medium text-zinc-300">Email Message</label>
              <button
                onClick={() => handleCopy(body, 'body')}
                className="hover:text-white flex items-center gap-1 text-[11px]"
              >
                {copiedField === 'body' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>Copy</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-zinc-200 focus:border-indigo-500 focus:outline-none leading-relaxed text-xs"
            />
          </div>

          {/* Instagram DM Script */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label className="flex items-center gap-1 font-medium text-zinc-300">
                <Instagram className="h-3.5 w-3.5 text-pink-400" /> Instagram DM Script
              </label>
              <button
                onClick={() => handleCopy(dmScript, 'dm')}
                className="hover:text-white text-zinc-400 flex items-center gap-1 text-[11px]"
              >
                {copiedField === 'dm' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>Copy</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={dmScript}
              onChange={(e) => setDmScript(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 focus:border-indigo-500 focus:outline-none text-xs"
            />
          </div>

          {/* Real-time Dispatch Feedback Banner */}
          {dispatchFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border p-3 text-xs space-y-1.5 ${
                dispatchFeedback.type === 'warning'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  : dispatchFeedback.type === 'error'
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">{dispatchFeedback.message}</div>
                  {dispatchFeedback.remediation && (
                    <div className="text-[11px] opacity-80 mt-0.5">{dispatchFeedback.remediation}</div>
                  )}
                </div>
              </div>
              {dispatchFeedback.gmailUrl && (
                <div className="pt-1 flex items-center justify-end">
                  <a
                    href={dispatchFeedback.gmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      onSendOutreach(lead.id, subject, body, dmScript, 'GMAIL_WEB', { message: 'Opened direct Gmail Web compose fallback' });
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/25 transition-all"
                  >
                    <Globe className="h-3 w-3" />
                    <span>Send via Direct Gmail Instead</span>
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-zinc-800 bg-zinc-900/80 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                onSendOutreach(lead.id, subject, body, dmScript);
                onClose();
              }}
              className="rounded-lg border border-zinc-700/70 bg-zinc-800/80 px-3 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all text-xs font-medium"
            >
              Save Draft
            </button>

            <button
              onClick={handleDownloadEml}
              title="Download RFC822 .eml file to import into Mail, Outlook, or Thunderbird"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700/70 bg-zinc-800/80 px-3 py-2 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>Export .eml</span>
            </button>

            {/* Sender Selector if multi-Gmails connected */}
            {connectedGmails.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-black/50 border border-white/10 px-2.5 py-1 text-xs">
                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-zinc-400 text-[11px]">From:</span>
                <select
                  value={selectedGmailId}
                  onChange={(e) => setSelectedGmailId(e.target.value)}
                  className="bg-transparent text-xs font-medium text-white border-none focus:outline-none cursor-pointer"
                >
                  {connectedGmails.map((acc, i) => (
                    <option key={acc.id} value={acc.id} className="bg-zinc-900 text-white">
                      Slot #{i + 1}: {acc.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Live Gmail API Send (Primary) */}
            {connectedGmails.length > 0 ? (
              <button
                onClick={handleSendViaGmailOAuth}
                disabled={isSending}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 font-bold text-white transition-all shadow-md shadow-emerald-600/20 text-xs disabled:opacity-50"
              >
                {isSending ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                ) : (
                  <Zap className="h-3.5 w-3.5 fill-white text-white" />
                )}
                <span>{isSending ? 'Sending with Gmail...' : 'Send Live with Gmail (OAuth)'}</span>
              </button>
            ) : null}

            {/* Real-time Bird Email API Send Button */}
            <button
              onClick={handleSendViaBird}
              disabled={isSending}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-3 py-2 font-medium text-indigo-300 hover:bg-indigo-500/25 transition-all text-xs disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 text-indigo-400" />
              <span>Bird API</span>
            </button>

            <button
              onClick={handleLaunchGmailWeb}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 font-medium text-white transition-all shadow-sm text-xs"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>1-Click Web</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
