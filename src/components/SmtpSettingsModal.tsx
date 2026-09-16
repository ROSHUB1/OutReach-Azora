import React, { useState } from 'react';
import { SmtpConfig, BirdConfig, DispatchMethod } from '../types';
import { motion } from 'motion/react';
import { Server, ShieldCheck, Check, AlertCircle, X, Key, Send, Globe, Zap, ExternalLink } from 'lucide-react';

interface SmtpSettingsModalProps {
  onClose: () => void;
  smtpConfig: SmtpConfig | null;
  onSaveSmtpConfig: (config: SmtpConfig | null) => void;
  birdConfig: BirdConfig | null;
  onSaveBirdConfig: (config: BirdConfig) => void;
  preferredMethod: DispatchMethod;
  onSavePreferredMethod: (method: DispatchMethod) => void;
}

const DEFAULT_BIRD_KEY = "bk_us1_KaQTuR1EomxkawrDrPJapuq4bS4Ll";

export const SmtpSettingsModal: React.FC<SmtpSettingsModalProps> = ({
  onClose,
  smtpConfig,
  onSaveSmtpConfig,
  birdConfig,
  onSaveBirdConfig,
  preferredMethod,
  onSavePreferredMethod,
}) => {
  // Bird API State
  const [birdApiKey, setBirdApiKey] = useState(birdConfig?.apiKey || DEFAULT_BIRD_KEY);
  const [birdFromEmail, setBirdFromEmail] = useState(birdConfig?.fromEmail || 'outreach@messagebird.dev');
  const [birdFromName, setBirdFromName] = useState(birdConfig?.fromName || 'Outreach Studio');
  const [testingBird, setTestingBird] = useState(false);
  const [birdTestResult, setBirdTestResult] = useState<{ success: boolean; message: string; id?: string } | null>(null);

  // SMTP State
  const [host, setHost] = useState(smtpConfig?.host || '');
  const [port, setPort] = useState(smtpConfig?.port || 587);
  const [user, setUser] = useState(smtpConfig?.user || '');
  const [pass, setPass] = useState(smtpConfig?.pass || '');
  const [fromName, setFromName] = useState(smtpConfig?.fromName || 'Outreach Studio');
  const [fromEmail, setFromEmail] = useState(smtpConfig?.fromEmail || '');
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [method, setMethod] = useState<DispatchMethod>(preferredMethod || 'BIRD_API');

  // Test Bird API Key
  const handleTestBird = async () => {
    setTestingBird(true);
    setBirdTestResult(null);

    try {
      const res = await fetch('/api/bird-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: birdApiKey.trim(),
          fromEmail: birdFromEmail.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBirdTestResult({
          success: true,
          message: data.message || 'Bird API connected! Sandbox test message delivered.',
          id: data.birdMessageId,
        });
      } else {
        setBirdTestResult({
          success: false,
          message: data.error || data.remediation || 'Bird verification failed',
        });
      }
    } catch (err: any) {
      setBirdTestResult({ success: false, message: `Network error: ${err.message}` });
    } finally {
      setTestingBird(false);
    }
  };

  // Test SMTP Connection
  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch('/api/smtp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, pass }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpTestResult({ success: true, message: data.message || 'SMTP Connection Verified!' });
      } else {
        setSmtpTestResult({ success: false, message: data.error || 'Failed to connect to SMTP server' });
      }
    } catch (err: any) {
      setSmtpTestResult({ success: false, message: `Network Error: ${err.message}` });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSave = () => {
    onSavePreferredMethod(method);

    // Save Bird Config
    onSaveBirdConfig({
      apiKey: birdApiKey.trim() || DEFAULT_BIRD_KEY,
      fromEmail: birdFromEmail.trim() || 'outreach@messagebird.dev',
      fromName: birdFromName.trim() || 'Outreach Studio',
    });

    // Save SMTP Config
    if (host.trim() && user.trim() && pass.trim()) {
      onSaveSmtpConfig({
        host: host.trim(),
        port: Number(port),
        user: user.trim(),
        pass: pass.trim(),
        fromName: fromName.trim() || 'Outreach Studio',
        fromEmail: fromEmail.trim() || user.trim(),
        secure: Number(port) === 465,
      });
    } else {
      onSaveSmtpConfig(null);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="flex w-full max-w-xl flex-col rounded-2xl border border-white/10 bg-[#12141c]/95 text-zinc-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-500/20 p-2 border border-indigo-500/30 text-indigo-400">
              <Zap className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Real-Time Email Dispatch Engine</h2>
              <p className="text-xs text-zinc-400">Bird Email API, SMTP Servers, and Direct Gmail Web Compose</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Dispatch Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-indigo-400" /> Primary Real-Time Dispatch Mode
            </label>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {/* Bird API Option */}
              <button
                type="button"
                onClick={() => setMethod('BIRD_API')}
                className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                  method === 'BIRD_API'
                    ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Bird API</span>
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight">
                  Direct HTTP send via Bird Platform. Includes real-time message tracking.
                </div>
              </button>

              {/* 1-Click Gmail Web */}
              <button
                type="button"
                onClick={() => setMethod('GMAIL_WEB')}
                className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                  method === 'GMAIL_WEB'
                    ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <Globe className="h-3.5 w-3.5" />
                  <span>1-Click Gmail Web</span>
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight">
                  Opens Gmail Web pre-filled. Guaranteed delivery from your own email account.
                </div>
              </button>

              {/* SMTP Server */}
              <button
                type="button"
                onClick={() => setMethod('SMTP_SERVER')}
                className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                  method === 'SMTP_SERVER'
                    ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-md'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Server className="h-3.5 w-3.5" />
                  <span>SMTP Transport</span>
                </div>
                <div className="text-[10px] text-zinc-400 leading-tight">
                  Backend sending via custom SMTP host (Gmail, SendGrid, Brevo).
                </div>
              </button>
            </div>
          </div>

          {/* Bird API Configuration Box */}
          <div className="space-y-3 rounded-xl border border-indigo-500/30 bg-indigo-500/[0.04] p-4">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
              <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-indigo-400" /> Bird (MessageBird) API Credentials
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">● Active US1 Endpoint</span>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">Bird API Key</label>
                <div className="relative">
                  <input
                    type="text"
                    value={birdApiKey}
                    onChange={(e) => setBirdApiKey(e.target.value)}
                    placeholder="bk_us1_..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-white focus:border-indigo-500 text-xs font-mono"
                  />
                </div>
                <p className="text-[10px] text-zinc-500">
                  Pre-configured with your key <code className="text-zinc-400">bk_us1_KaQTu...</code>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-medium">Sender Display Name</label>
                  <input
                    type="text"
                    value={birdFromName}
                    onChange={(e) => setBirdFromName(e.target.value)}
                    placeholder="Outreach Studio"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-white focus:border-indigo-500 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-medium">From Address (Domain in Bird)</label>
                  <input
                    type="email"
                    value={birdFromEmail}
                    onChange={(e) => setBirdFromEmail(e.target.value)}
                    placeholder="outreach@yourdomain.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-white focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-2.5 text-[11px] text-indigo-200/90 leading-relaxed">
                <span className="font-semibold text-indigo-300">💡 Bird API Domain Notice:</span> The shared sandbox address (<code className="text-zinc-300">@messagebird.dev</code>) delivers strictly to verified team sandbox inboxes. For live cold outreach to external prospects via Bird API, enter your verified custom domain (e.g. <code className="text-zinc-300">outreach@yourdomain.com</code>). Alternatively, select <strong>1-Click Gmail Web</strong> for guaranteed zero-setup delivery from your Google account.
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestBird}
                  disabled={testingBird || !birdApiKey}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/20 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-40 transition-all font-semibold"
                >
                  {testingBird ? (
                    <>
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-300 border-t-transparent" />
                      <span>Verifying with Bird API...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Live Test Send (Bird Sandbox)</span>
                    </>
                  )}
                </button>

                {birdTestResult && (
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-mono font-bold max-w-xs ${
                      birdTestResult.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {birdTestResult.success ? <Check className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{birdTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SMTP Server Configuration Form */}
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-bold text-xs text-white flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-400" /> Optional SMTP Host & Credentials
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">For secondary SMTP routing</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">SMTP Server Host</label>
                <input
                  type="text"
                  placeholder="smtp.gmail.com or smtp.sendgrid.net"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-white focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">Port</label>
                <input
                  type="number"
                  placeholder="587"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-white focus:border-indigo-500 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">Username / Email</label>
                <input
                  type="text"
                  placeholder="your.email@gmail.com"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-white focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 font-medium">Password / App Key</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-white focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testingSmtp || !host || !user || !pass}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20 disabled:opacity-40 transition-all font-semibold"
              >
                {testingSmtp ? (
                  <>
                    <span className="animate-spin rounded-full h-3 w-3 border-2 border-amber-300 border-t-transparent" />
                    <span>Testing SMTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Test SMTP Server</span>
                  </>
                )}
              </button>

              {smtpTestResult && (
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-mono font-bold ${
                    smtpTestResult.success ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {smtpTestResult.success ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  <span>{smtpTestResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-black/40 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-zinc-300 hover:bg-white/10 font-semibold"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Check className="h-4 w-4" />
            <span>Save Dispatch Preferences</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

