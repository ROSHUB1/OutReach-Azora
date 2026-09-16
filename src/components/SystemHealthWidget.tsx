import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wifi, WifiOff, RefreshCw, Cpu, Server } from 'lucide-react';

export const SystemHealthWidget: React.FC = () => {
  const [status, setStatus] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [hostDomain, setHostDomain] = useState<string>('');
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  const checkHealth = async () => {
    setStatus('CHECKING');
    const start = performance.now();

    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      const duration = Math.round(performance.now() - start);

      if (response.ok) {
        setStatus('ONLINE');
        setLatencyMs(duration);
      } else {
        setStatus('OFFLINE');
        setLatencyMs(null);
      }
    } catch (err) {
      // Even if offline, local rules engine works 100% in browser!
      setStatus('OFFLINE');
      setLatencyMs(null);
    } finally {
      setLastCheckTime(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    setHostDomain(window.location.hostname || 'Local Service');
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Poll health every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#12141c]/90 p-3 text-xs text-zinc-300 shadow-xl backdrop-blur-md">
      {/* Left Connection Status Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {status === 'ONLINE' ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          ) : status === 'CHECKING' ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
          ) : (
            <span className="relative flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-bold font-mono text-[11px]">
              <span className={status === 'ONLINE' ? 'text-emerald-400' : status === 'CHECKING' ? 'text-amber-400' : 'text-rose-400'}>
                {status === 'ONLINE' ? 'HOST SERVICE ONLINE' : status === 'CHECKING' ? 'CONNECTING...' : 'HOST OFFLINE (LOCAL ENGINE ACTIVE)'}
              </span>
              {latencyMs !== null && (
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-300 font-mono">
                  {latencyMs}ms
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[200px] sm:max-w-xs">
              Host: <strong className="text-zinc-200">{hostDomain}</strong> • Checked at {lastCheckTime || 'now'}
            </span>
          </div>
        </div>
      </div>

      {/* Engine Info Badge & Ping Reconnect Action */}
      <div className="flex items-center gap-2 font-mono text-[11px]">
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-indigo-300">
          <Cpu className="h-3.5 w-3.5 text-indigo-400" />
          <span>OP Rules Matrix v2.5</span>
        </div>

        <button
          onClick={checkHealth}
          className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-zinc-300 hover:bg-white/10 hover:text-white transition-all text-[10px]"
          title="Verify Web Service Health & Ping"
        >
          <RefreshCw className={`h-3 w-3 ${status === 'CHECKING' ? 'animate-spin' : ''}`} />
          <span>Ping Service</span>
        </button>
      </div>
    </div>
  );
};
