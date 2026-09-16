import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, Zap, Shield, Send, Power, ExternalLink, Sparkles, UserCheck, ArrowRightLeft } from 'lucide-react';
import { OAuthGmailAccount } from '../types';
import { connectGmailAccount } from '../utils/gmailAuth';
import { sendEmailViaGmail } from '../utils/gmailApi';

interface GmailAccountsHubProps {
  accounts: OAuthGmailAccount[];
  onUpdateAccount: (updatedAccount: OAuthGmailAccount) => void;
  onDisconnectAccount: (accountId: string) => void;
  rotationMode: 'ROUND_ROBIN' | 'SPECIFIC_ACCOUNT';
  onToggleRotationMode: (mode: 'ROUND_ROBIN' | 'SPECIFIC_ACCOUNT') => void;
  selectedSingleAccountId?: string;
  onSelectSingleAccount: (accountId: string) => void;
  onShowToast: (msg: string) => void;
}

export const GmailAccountsHub: React.FC<GmailAccountsHubProps> = ({
  accounts,
  onUpdateAccount,
  onDisconnectAccount,
  rotationMode,
  onToggleRotationMode,
  selectedSingleAccountId,
  onSelectSingleAccount,
  onShowToast,
}) => {
  const [connectingSlot, setConnectingSlot] = useState<number | null>(null);
  const [testingAccountId, setTestingAccountId] = useState<string | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');
  const [activeTestSlot, setActiveTestSlot] = useState<number | null>(null);

  const connectedCount = accounts.filter((a) => a.isConnected).length;
  const activeCount = accounts.filter((a) => a.isConnected && a.isActive).length;
  const totalDailySent = accounts.reduce((sum, a) => sum + (a.dailySentCount || 0), 0);
  const totalCapacity = accounts.filter((a) => a.isConnected).reduce((sum, a) => sum + a.dailyQuotaLimit, 0);

  const handleConnect = async (slotIndex: number) => {
    setConnectingSlot(slotIndex);
    try {
      const account = await connectGmailAccount(slotIndex);
      onUpdateAccount(account);
      onShowToast(`Successfully connected live Gmail: ${account.email}`);
    } catch (err: any) {
      console.error('Failed to connect Gmail:', err);
      const errMessage = err.message || 'Authentication cancelled or failed.';
      onShowToast(`Google Sign-In: ${errMessage}`);
    } finally {
      setConnectingSlot(null);
    }
  };

  const handleSendTestEmail = async (account: OAuthGmailAccount) => {
    const targetEmail = testEmailAddress.trim() || account.email;
    if (!targetEmail || !targetEmail.includes('@')) {
      onShowToast('Please provide a valid test recipient email address.');
      return;
    }

    setTestingAccountId(account.id);
    try {
      const result = await sendEmailViaGmail({
        to: targetEmail,
        subject: `Live Gmail API Test from ${account.email}`,
        body: `Hello,\n\nThis is a verified live test email sent directly from your connected Gmail OAuth account (${account.email}) via Outreach Studio.\n\nEverything is connected, authenticated, and ready for automated cold outreach sequences!\n\nSent at: ${new Date().toLocaleString()}`,
        fromName: account.name,
        fromEmail: account.email,
        accessToken: account.accessToken || undefined,
        accountId: account.id,
      });

      if (result.success) {
        onShowToast(`Test email successfully sent to ${targetEmail} from ${account.email}!`);
        // Increment daily count
        onUpdateAccount({
          ...account,
          dailySentCount: (account.dailySentCount || 0) + 1,
          lastSentAt: new Date().toISOString(),
        });
        setActiveTestSlot(null);
        setTestEmailAddress('');
      } else {
        onShowToast(`Test failed: ${result.error || 'Check permissions or reconnect.'}`);
      }
    } catch (e: any) {
      onShowToast(`Error sending test email: ${e.message}`);
    } finally {
      setTestingAccountId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-zinc-900/80 to-slate-950/80 p-6 shadow-xl backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Zap className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>Direct Google Workspace & Gmail Automation</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              3-Account Live Gmail Dispatch Engine
            </h2>
            <p className="max-w-2xl text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Connect up to 3 real Gmail accounts inside your dashboard. Emails are dispatched directly through your own Google accounts via the Gmail REST API for 100% authentic delivery, zero sandbox restrictions, and automated rotation.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 min-w-[120px] text-center">
              <div className="text-xs text-zinc-400 font-medium">Live Senders</div>
              <div className="text-lg font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
                <span className={`inline-block h-2 w-2 rounded-full ${connectedCount > 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'}`} />
                <span>{connectedCount}/3 Connected</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 min-w-[120px] text-center">
              <div className="text-xs text-zinc-400 font-medium">Daily Capacity</div>
              <div className="text-lg font-bold text-indigo-300 mt-0.5">
                {totalDailySent} / {totalCapacity > 0 ? totalCapacity : 1500}
              </div>
            </div>
          </div>
        </div>

        {/* Sender Rotation Mode Selector */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-medium text-zinc-300">Automation Dispatch Strategy:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onToggleRotationMode('ROUND_ROBIN')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                rotationMode === 'ROUND_ROBIN'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/10'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${rotationMode === 'ROUND_ROBIN' ? 'animate-spin' : ''}`} />
              <span>Smart Round-Robin Rotation ({activeCount} Active Senders)</span>
            </button>

            <button
              onClick={() => onToggleRotationMode('SPECIFIC_ACCOUNT')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                rotationMode === 'SPECIFIC_ACCOUNT'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border border-white/10'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Single Dedicated Sender</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Gmail Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {accounts.map((account, index) => {
          const isSelectedForSingle = selectedSingleAccountId === account.id;
          const isTesting = testingAccountId === account.id;
          const isConnecting = connectingSlot === index;
          const showTestInput = activeTestSlot === index;

          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all backdrop-blur-xl ${
                account.isConnected
                  ? account.isActive
                    ? 'border-emerald-500/30 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 shadow-lg shadow-emerald-500/5'
                    : 'border-amber-500/30 bg-zinc-900/70'
                  : 'border-white/10 bg-zinc-900/40 border-dashed'
              }`}
            >
              {/* Card Header / Slot Identifier */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white border border-white/10">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {index === 0 ? 'Primary Gmail' : index === 1 ? 'Secondary Gmail' : 'Booster Gmail'}
                      </h3>
                      <p className="text-[11px] text-zinc-400">Account Slot {index + 1}</p>
                    </div>
                  </div>

                  {account.isConnected ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live</span>
                    </div>
                  ) : (
                    <div className="rounded-full bg-zinc-800/80 border border-zinc-700/60 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                      Disconnected
                    </div>
                  )}
                </div>

                {/* Account Details or Connect Trigger */}
                {account.isConnected ? (
                  <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-3.5">
                    <div className="flex items-center gap-3">
                      {account.photoUrl ? (
                        <img
                          src={account.photoUrl}
                          alt={account.name}
                          className="h-9 w-9 rounded-full border border-white/20 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/30 border border-indigo-400/40 text-xs font-bold text-indigo-200">
                          {account.email[0]?.toUpperCase() || 'G'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-white">{account.name}</div>
                        <div className="truncate text-[11px] font-mono text-zinc-400">{account.email}</div>
                      </div>
                    </div>

                    {/* Quota & Activity */}
                    <div className="space-y-1.5 pt-2 border-t border-white/10">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Daily Quota Dispatched:</span>
                        <span className="font-semibold text-indigo-300">
                          {account.dailySentCount || 0} / {account.dailyQuotaLimit} emails
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (((account.dailySentCount || 0) / account.dailyQuotaLimit) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Active for Rotation Switch */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300">
                        <input
                          type="checkbox"
                          checked={account.isActive}
                          onChange={(e) =>
                            onUpdateAccount({
                              ...account,
                              isActive: e.target.checked,
                            })
                          }
                          className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
                        />
                        <span>Include in Automated Rotation</span>
                      </label>

                      {rotationMode === 'SPECIFIC_ACCOUNT' && (
                        <button
                          onClick={() => onSelectSingleAccount(account.id)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-all ${
                            isSelectedForSingle
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {isSelectedForSingle ? 'Selected Sender' : 'Set as Sender'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border border-white/5 bg-black/20 p-4 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-white">Empty Sender Slot</h4>
                      <p className="text-[11px] text-zinc-500">
                        Connect a Google / Gmail account to dispatch campaigns with this slot.
                      </p>
                    </div>

                    {/* Official Google Sign-In Styled Button */}
                    <button
                      onClick={() => handleConnect(index)}
                      disabled={isConnecting}
                      className="group relative flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20 hover:border-white/30 active:scale-[0.98] disabled:opacity-60"
                    >
                      {isConnecting ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      )}
                      <span>{isConnecting ? 'Authenticating...' : `Connect Gmail #${index + 1}`}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              {account.isConnected && (
                <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                  {showTestInput ? (
                    <div className="space-y-2 rounded-lg bg-white/5 p-2.5 border border-white/10">
                      <div className="text-[10px] text-zinc-300 font-medium">Send Live Test Email To:</div>
                      <input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder={account.email}
                        className="w-full rounded border border-white/10 bg-black/60 px-2 py-1 text-[11px] text-white focus:border-indigo-500"
                      />
                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={() => handleSendTestEmail(account)}
                          disabled={isTesting}
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-indigo-600 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                          {isTesting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          <span>{isTesting ? 'Sending...' : 'Send Live Test'}</span>
                        </button>
                        <button
                          onClick={() => setActiveTestSlot(null)}
                          className="rounded bg-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setActiveTestSlot(index);
                          setTestEmailAddress(account.email);
                        }}
                        className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        <Send className="h-3 w-3" />
                        <span>Test Send</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConnect(index)}
                          className="text-[11px] text-zinc-400 hover:text-zinc-200"
                          title="Switch Google account"
                        >
                          Switch
                        </button>
                        <span className="text-zinc-700">|</span>
                        <button
                          onClick={() => onDisconnectAccount(account.id)}
                          className="text-[11px] text-rose-400 hover:text-rose-300"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Safety & Deliverability Checklist */}
      <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-xs space-y-2 text-zinc-400">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Google Workspace & Gmail Deliverability Best Practices:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] leading-relaxed">
          <div className="rounded-lg bg-white/5 p-2.5 border border-white/5">
            <span className="font-semibold text-zinc-200 block mb-0.5">1. Multi-Sender Load Balancing:</span>
            Connecting 3 distinct Gmail accounts distributes your volume (e.g. 50-100 emails/day per account) so inboxes never trigger spam filters.
          </div>
          <div className="rounded-lg bg-white/5 p-2.5 border border-white/5">
            <span className="font-semibold text-zinc-200 block mb-0.5">2. Native Primary Tab Delivery:</span>
            Emails sent through OAuth Gmail API land straight in the recipient's primary inbox, not the promotional or spam tab.
          </div>
          <div className="rounded-lg bg-white/5 p-2.5 border border-white/5">
            <span className="font-semibold text-zinc-200 block mb-0.5">3. 2-Day Sequence Automation:</span>
            Automated Day 1 cold outreach and Day 2 follow-ups are seamlessly dispatched through whichever Gmail account is active in rotation.
          </div>
        </div>
      </div>
    </div>
  );
};
