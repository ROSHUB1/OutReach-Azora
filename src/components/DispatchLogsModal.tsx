import React, { useState } from 'react';
import { DispatchLog } from '../types';
import { motion } from 'motion/react';
import { Send, CheckCircle2, Globe, Server, FileText, X, Clock, ExternalLink, Zap, RefreshCw, AlertTriangle } from 'lucide-react';

interface DispatchLogsModalProps {
  onClose: () => void;
  logs: DispatchLog[];
  onClearLogs: () => void;
}

export const DispatchLogsModal: React.FC<DispatchLogsModalProps> = ({ onClose, logs, onClearLogs }) => {
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, { status: string; details?: any }>>({});

  const checkBirdStatus = async (messageId: string) => {
    setCheckingId(messageId);
    try {
      const res = await fetch(`/api/bird-message-status/${encodeURIComponent(messageId)}`);
      const data = await res.json();
      if (data.success) {
        setStatusUpdates((prev) => ({
          ...prev,
          [messageId]: { status: data.status, details: data.data },
        }));
      } else {
        setStatusUpdates((prev) => ({
          ...prev,
          [messageId]: { status: 'STATUS_QUERY_FAILED', details: data.error },
        }));
      }
    } catch (err: any) {
      setStatusUpdates((prev) => ({
        ...prev,
        [messageId]: { status: 'NETWORK_ERROR', details: err.message },
      }));
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="flex h-full max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-white/10 bg-[#12141c]/95 text-zinc-200 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/20 p-2 border border-emerald-500/30 text-emerald-400">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Live Real-Time Dispatch & Delivery Log</h2>
              <p className="text-xs text-zinc-400">Audit real email transmissions via Bird Email API, SMTP servers, or direct Gmail web</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 space-y-3">
              <Clock className="h-8 w-8 text-zinc-600" />
              <div>
                <p className="font-bold text-zinc-300">No Dispatches Logged Yet</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Send emails via Bird API, 1-Click Direct Gmail Web Compose, or Backend SMTP to view live transmission logs here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-400">Total Recorded Dispatches: {logs.length}</span>
                <button
                  onClick={onClearLogs}
                  className="text-zinc-400 hover:text-rose-400 underline transition-colors"
                >
                  Clear Log History
                </button>
              </div>

              <div className="space-y-2">
                {logs.map((log) => {
                  const liveUpdate = log.messageId ? statusUpdates[log.messageId] : null;
                  const currentStatus = liveUpdate ? liveUpdate.status : log.status;

                  return (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/50 p-3.5 hover:border-white/20 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{log.leadName}</span>
                          <span className="text-indigo-300 text-[11px]">&lt;{log.recipientEmail}&gt;</span>
                        </div>
                        <div className="text-[11px] text-zinc-300 font-sans truncate max-w-md">
                          <strong>Subject:</strong> {log.subject}
                        </div>
                        {log.responseMessage && (
                          <div className="text-[10px] text-zinc-400">{log.responseMessage}</div>
                        )}
                        {log.messageId && (
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <span>ID: {log.messageId}</span>
                            {log.method === 'BIRD_API' && (
                              <button
                                onClick={() => log.messageId && checkBirdStatus(log.messageId)}
                                disabled={checkingId === log.messageId}
                                className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5 ml-2"
                              >
                                <RefreshCw className={`h-2.5 w-2.5 ${checkingId === log.messageId ? 'animate-spin' : ''}`} />
                                <span>Check Status</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          {log.method === 'BIRD_API' ? (
                            <span className="inline-flex items-center gap-1 rounded bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] text-purple-300 font-bold">
                              <Zap className="h-3 w-3" /> Bird API (US1)
                            </span>
                          ) : log.method === 'SMTP_SERVER' ? (
                            <span className="inline-flex items-center gap-1 rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] text-indigo-300 font-bold">
                              <Server className="h-3 w-3" /> SMTP Direct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300 font-bold">
                              <Globe className="h-3 w-3" /> Gmail Web Direct
                            </span>
                          )}

                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                            currentStatus.includes('FAIL') || currentStatus.includes('ERR')
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            <CheckCircle2 className="h-3 w-3" /> {currentStatus}
                          </span>
                        </div>

                        <span className="text-[10px] text-zinc-500">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-black/40 p-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 font-bold text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
