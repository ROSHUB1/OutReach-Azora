import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Shield,
  Send,
  Power,
  ExternalLink,
  Sparkles,
  UserCheck,
  ArrowRightLeft,
  Key,
  Layers,
  PlusCircle,
  Check,
  X,
  Clock,
  Flame,
} from 'lucide-react';
import { OAuthGmailAccount } from '../types';
import { connectGmailAccount } from '../utils/gmailAuth';
import { sendEmailViaGmail } from '../utils/gmailApi';
import firebaseConfig from '../../firebase-applet-config.json';

interface GmailAccountManagerProps {
  accounts: OAuthGmailAccount[];
  onUpdateAccount: (updatedAccount: OAuthGmailAccount) => void;
  onDisconnectAccount: (accountId: string) => void;
  rotationMode: 'ROUND_ROBIN' | 'SPECIFIC_ACCOUNT';
  onToggleRotationMode: (mode: 'ROUND_ROBIN' | 'SPECIFIC_ACCOUNT') => void;
  selectedSingleAccountId?: string;
  onSelectSingleAccount: (accountId: string) => void;
  onShowToast: (msg: string) => void;
}

export const GmailAccountManager: React.FC<GmailAccountManagerProps> = ({
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

  // Guarantee exactly 5 slots exist in view
  const displaySlots: OAuthGmailAccount[] = Array.from({ length: 5 }).map((_, index) => {
    const existing = accounts.find((a) => a.slotIndex === index || a.id === `account-${index + 1}`);
    if (existing) return existing;
    return {
      id: `account-${index + 1}`,
      slotIndex: index,
      email: '',
      name: `Gmail Sender ${index + 1}`,
      accessToken: null,
      isConnected: false,
      isActive: true,
      dailySentCount: 0,
      dailyQuotaLimit: 500,
    };
  });

  const connectedCount = displaySlots.filter((a) => a.isConnected).length;
  const activeCount = displaySlots.filter((a) => a.isConnected && a.isActive).length;
  const totalDailySent = displaySlots.reduce((sum, a) => sum + (a.dailySentCount || 0), 0);
  const totalCapacity = displaySlots.filter((a) => a.isConnected).reduce((sum, a) => sum + a.dailyQuotaLimit, 0) || (connectedCount > 0 ? connectedCount * 500 : 2500);

  const handleConnect = async (slotIndex: number) => {
    setConnectingSlot(slotIndex);
    try {
      const account = await connectGmailAccount(slotIndex);
      onUpdateAccount(account);
      onShowToast(`Successfully connected Gmail Slot #${slotIndex + 1}: ${account.email}`);
    } catch (err: any) {
      if (err?.isCancelled || err?.message?.toLowerCase().includes('closed') || err?.message?.toLowerCase().includes('cancelled')) {
        onShowToast('Google Sign-In was cancelled.');
      } else {
        console.warn('Gmail slot connection notice:', err);
        const errMessage = err.message || 'Authentication could not be completed.';
        onShowToast(`Google Sign-In: ${errMessage}`);
      }
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
        subject: `Live Gmail API Test from Slot #${account.slotIndex + 1} (${account.email})`,
        body: `Hello,\n\nThis is a verified live test email sent directly from your connected Gmail OAuth account (${account.email}) in Slot #${account.slotIndex + 1} via Outreach Studio.\n\nEverything is connected, authenticated with Google OAuth, and ready for automated cold outreach sequences!\n\nDispatched at: ${new Date().toLocaleString()}`,
        fromName: account.name,
        fromEmail: account.email,
        accessToken: account.accessToken || undefined,
        accountId: account.id,
      });

      if (result.success) {
        onShowToast(`Test email successfully sent to ${targetEmail} from ${account.email}!`);
        onUpdateAccount({
          ...account,
          dailySentCount: (account.dailySentCount || 0) + 1,
          lastSentAt: new Date().toISOString(),
        });
        setActiveTestSlot(null);
        setTestEmailAddress('');
      } else {
        onShowToast(`Test send failed: ${result.error || 'Check OAuth permissions or reconnect.'}`);
      }
    } catch (e: any) {
      onShowToast(`Error sending test email: ${e.message}`);
    } finally {
      setTestingAccountId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Direct 5-Account Gmail Engine */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-zinc-900/80 to-slate-950/80 p-6 shadow-xl backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Zap className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>Google OAuth 2.0 Direct Dispatch Engine</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              5-Slot Live Gmail Account Manager
            </h2>
            <p className="max-w-2xl text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Connect up to 5 distinct Gmail accounts using your project OAuth credentials ({firebaseConfig.projectId}). Automated sequence outreach rotates across your active connected slots to maximize deliverability and avoid rate limits.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 min-w-[120px] text-center">
              <div className="text-xs text-zinc-400 font-medium">Connected Slots</div>
              <div className="text-lg font-bold text-white flex items-center justify-center gap-1.5 mt-0.5">
                <span className={`inline-block h-2 w-2 rounded-full ${connectedCount > 0 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'}`} />
                <span>{connectedCount} / 5 Live</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 min-w-[120px] text-center">
              <div className="text-xs text-zinc-400 font-medium">Daily Send Capacity</div>
              <div className="text-lg font-bold text-indigo-300 mt-0.5">
                {totalDailySent} / {totalCapacity}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 min-w-[120px] text-center">
              <div className="text-xs text-zinc-400 font-medium">Active in Rotation</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {activeCount} Active
              </div>
            </div>
          </div>
        </div>

        {/* Sender Strategy Mode Selector */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-medium text-zinc-300">Multi-Account Rotation Strategy:</span>
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
              <span>Smart Round-Robin ({activeCount} Senders Rotating)</span>
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
              <span>Single Dedicated Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Distinct Gmail Account Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {displaySlots.map((account, index) => {
          const isSelectedForSingle = selectedSingleAccountId === account.id;
          const isTesting = testingAccountId === account.id;
          const isConnecting = connectingSlot === index;
          const showTestInput = activeTestSlot === index;

          const slotLabels = [
            'Slot #1 (Primary)',
            'Slot #2 (Secondary)',
            'Slot #3 (Warmup)',
            'Slot #4 (Expansion)',
            'Slot #5 (Scale)',
          ];

          return (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all backdrop-blur-xl ${
                account.isConnected
                  ? account.isActive
                    ? 'border-emerald-500/30 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 shadow-lg shadow-emerald-500/5'
                    : 'border-amber-500/30 bg-zinc-900/70'
                  : 'border-white/10 bg-zinc-900/30 border-dashed hover:border-indigo-500/40'
              }`}
            >
              {/* Slot Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold border ${
                      account.isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/5 text-zinc-400 border-white/10'
                    }`}>
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white truncate">
                        {slotLabels[index] || `Slot #${index + 1}`}
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {account.isConnected ? 'OAuth Authenticated' : 'Unlinked Slot'}
                      </p>
                    </div>
                  </div>

                  {account.isConnected ? (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live</span>
                    </div>
                  ) : (
                    <div className="rounded-full bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                      Empty
                    </div>
                  )}
                </div>

                {/* Account Details or Connect Button */}
                {account.isConnected ? (
                  <div className="space-y-2.5 rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="flex items-center gap-2.5">
                      {account.photoUrl ? (
                        <img
                          src={account.photoUrl}
                          alt={account.name}
                          className="h-8 w-8 rounded-full border border-white/20 object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/30 border border-indigo-400/40 text-xs font-bold text-indigo-200 shrink-0">
                          {account.email[0]?.toUpperCase() || 'G'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-white">{account.name}</div>
                        <div className="truncate text-[10px] font-mono text-zinc-400" title={account.email}>
                          {account.email}
                        </div>
                      </div>
                    </div>

                    {/* Quota & Activity */}
                    <div className="space-y-1 pt-1.5 border-t border-white/10">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Daily Sent:</span>
                        <span className="font-semibold text-indigo-300">
                          {account.dailySentCount || 0} / {account.dailyQuotaLimit}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
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
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-zinc-300">
                        <input
                          type="checkbox"
                          checked={account.isActive}
                          onChange={(e) =>
                            onUpdateAccount({
                              ...account,
                              isActive: e.target.checked,
                            })
                          }
                          className="h-3 w-3 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
                        />
                        <span className="truncate">Auto-Rotation</span>
                      </label>

                      {rotationMode === 'SPECIFIC_ACCOUNT' && (
                        <button
                          onClick={() => onSelectSingleAccount(account.id)}
                          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold transition-all ${
                            isSelectedForSingle
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {isSelectedForSingle ? 'Selected' : 'Use'}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 rounded-xl border border-white/5 bg-black/20 p-3.5 text-center">
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                      <Mail className="h-4 w-4 text-zinc-400" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-white">Slot #{index + 1} Available</h4>
                      <p className="text-[10px] text-zinc-500">
                        Link a distinct Gmail account for multi-sender scale.
                      </p>
                    </div>

                    {/* Prominent Connect Account Button */}
                    <button
                      onClick={() => handleConnect(index)}
                      disabled={isConnecting}
                      className="group relative flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/20 hover:bg-indigo-600 hover:border-indigo-400 px-3 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm"
                    >
                      {isConnecting ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                      ) : (
                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
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
                      <span>{isConnecting ? 'Connecting...' : 'Connect Account'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Card Footer Actions for Connected Accounts */}
              {account.isConnected && (
                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
                  {showTestInput ? (
                    <div className="space-y-1.5 rounded-lg bg-white/5 p-2 border border-white/10">
                      <div className="text-[9px] text-zinc-300 font-medium">Test Email Recipient:</div>
                      <input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder={account.email}
                        className="w-full rounded border border-white/10 bg-black/60 px-2 py-0.5 text-[10px] text-white focus:border-indigo-500"
                      />
                      <div className="flex gap-1 pt-0.5">
                        <button
                          onClick={() => handleSendTestEmail(account)}
                          disabled={isTesting}
                          className="flex-1 flex items-center justify-center gap-1 rounded bg-indigo-600 py-0.5 text-[10px] font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                          {isTesting ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Send className="h-2.5 w-2.5" />}
                          <span>{isTesting ? 'Sending...' : 'Send Test'}</span>
                        </button>
                        <button
                          onClick={() => setActiveTestSlot(null)}
                          className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <button
                        onClick={() => {
                          setActiveTestSlot(index);
                          setTestEmailAddress(account.email);
                        }}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        <Send className="h-2.5 w-2.5" />
                        <span>Test Send</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleConnect(index)}
                          className="text-zinc-400 hover:text-zinc-200"
                          title="Switch Google account"
                        >
                          Switch
                        </button>
                        <span className="text-zinc-700">|</span>
                        <button
                          onClick={() => onDisconnectAccount(account.id)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          Unlink
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

      {/* OAuth Configuration & Deliverability Best Practices Info Box */}
      <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-xs space-y-3 text-zinc-400">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Google OAuth Credentials & Workspace Deliverability</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <Key className="h-3.5 w-3.5 text-indigo-400" />
            <span>Client ID:</span>
            <span className="text-zinc-300 font-medium truncate max-w-[200px]" title={firebaseConfig.oAuthClientId}>
              {firebaseConfig.oAuthClientId.slice(0, 16)}...
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-[11px] leading-relaxed">
          <div className="rounded-xl bg-white/5 p-3 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>1. 5-Account Load Balancing</span>
            </div>
            <p className="text-zinc-400">
              Connecting up to 5 distinct accounts spreads your daily outreach across separate Gmail inboxes (50–100 emails/day per account), preventing spam triggers and IP throttling.
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>2. Direct Primary Inbox Placement</span>
            </div>
            <p className="text-zinc-400">
              Emails sent through the authenticated Gmail REST API are genuine user-sent messages with full DKIM/SPF credentials that land directly in the recipient's Primary inbox.
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-3 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>3. Smart 2-Day Sequence Cadence</span>
            </div>
            <p className="text-zinc-400">
              Automated first touch and scheduled 48-hour follow-up bumps seamlessly alternate among active slots in rotation without manual intervention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
