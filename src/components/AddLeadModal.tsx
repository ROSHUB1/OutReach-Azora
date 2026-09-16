import React, { useState } from 'react';
import { Lead, LeadCategory } from '../types';
import { motion } from 'motion/react';
import { X, Plus, Sparkles, Radio, Trophy, Disc, Mail } from 'lucide-react';

interface AddLeadModalProps {
  onClose: () => void;
  onAddLeads: (newLeads: Partial<Lead>[]) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  onClose,
  onAddLeads,
}) => {
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BULK'>('SINGLE');

  // Single Lead State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyOrBrand, setCompanyOrBrand] = useState('');
  const [category, setCategory] = useState<LeadCategory>('PERSONAL_BRAND');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [twitchOrKickUrl, setTwitchOrKickUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Bulk Paste State
  const [bulkText, setBulkText] = useState('');

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    onAddLeads([
      {
        name: name || email.split('@')[0],
        email: email.trim(),
        companyOrBrand: companyOrBrand || name || 'Brand',
        category,
        instagramHandle: instagramHandle
          ? instagramHandle.startsWith('@')
            ? instagramHandle
            : `@${instagramHandle}`
          : undefined,
        youtubeUrl: youtubeUrl || undefined,
        twitchOrKickUrl: twitchOrKickUrl || undefined,
        websiteUrl: websiteUrl || undefined,
        qualificationStatus: 'NEEDS_AUDIT',
        outreachStatus: 'UNSENT',
        sequenceStatus: 'NOT_STARTED',
        matchScore: 85,
        notes: notes || 'Manually added lead. Awaiting AI Gate Audit.',
        details: {},
        gateChecks: [],
      },
    ]);
    onClose();
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const parsed: Partial<Lead>[] = lines.map((line, idx) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length === 1) {
        return {
          name: parts[0].split('@')[0],
          email: parts[0],
          category: category,
          companyOrBrand: `Target Lead ${idx + 1}`,
          qualificationStatus: 'NEEDS_AUDIT',
          outreachStatus: 'UNSENT',
          sequenceStatus: 'NOT_STARTED',
          matchScore: 80,
          details: {},
          gateChecks: [],
        };
      } else {
        return {
          name: parts[0],
          email: parts[1] || `${parts[0].toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          companyOrBrand: parts[2] || parts[0],
          category: (parts[3] as LeadCategory) || category,
          instagramHandle: parts[4] || undefined,
          qualificationStatus: 'NEEDS_AUDIT',
          outreachStatus: 'UNSENT',
          sequenceStatus: 'NOT_STARTED',
          matchScore: 80,
          details: {},
          gateChecks: [],
        };
      }
    });

    onAddLeads(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex h-full max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-white/10 bg-[#12141c]/95 backdrop-blur-md text-slate-200 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-indigo-600/20 p-2 border border-indigo-500/30">
              <Plus className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Add Gmail Outreach Leads</h2>
              <p className="text-xs text-zinc-400">Import target Gmail contacts into qualification pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-2.5 text-xs">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('SINGLE')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                activeTab === 'SINGLE'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Single Lead Entry
            </button>
            <button
              onClick={() => setActiveTab('BULK')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                activeTab === 'BULK'
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Bulk Paste Gmails
            </button>
          </div>
        </div>

        {/* Modal Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'SINGLE' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
              {/* Category Selection */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-2 uppercase text-[11px] tracking-wider">
                  Target Niche Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'PERSONAL_BRAND', label: 'Personal Brand / Coach', icon: <Sparkles className="h-3.5 w-3.5 text-amber-400" /> },
                    { key: 'STREAMER', label: 'Streamer (Twitch/Kick)', icon: <Radio className="h-3.5 w-3.5 text-purple-400" /> },
                    { key: 'SPORTSBOOK', label: 'Sportsbook Operator', icon: <Trophy className="h-3.5 w-3.5 text-emerald-400" /> },
                    { key: 'INDIE_LABEL', label: 'Indie Music Label', icon: <Disc className="h-3.5 w-3.5 text-cyan-400" /> },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCategory(item.key as LeadCategory)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                        category === item.key
                          ? 'border-indigo-500 bg-indigo-500/20 text-white font-bold ring-1 ring-indigo-500/40'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      {item.icon}
                      <span className="font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Target Email / Gmail *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@gmail.com"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Lead Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Vane"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Brand & IG */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Brand / Business Name</label>
                  <input
                    type="text"
                    value={companyOrBrand}
                    onChange={(e) => setCompanyOrBrand(e.target.value)}
                    placeholder="Vane Academy / BetVanguard"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Instagram Handle</label>
                  <input
                    type="text"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    placeholder="@creator_handle"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">YouTube / Content URL</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/@..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Twitch / Kick URL</label>
                  <input
                    type="url"
                    value={twitchOrKickUrl}
                    onChange={(e) => setTwitchOrKickUrl(e.target.value)}
                    placeholder="https://twitch.tv/..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Lead to Outreach Queue</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1.5 uppercase text-[11px] tracking-wider">
                  Default Niche Category for Batch
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LeadCategory)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-indigo-500 text-xs"
                >
                  <option value="PERSONAL_BRAND">Personal Brand / Creator</option>
                  <option value="STREAMER">Streamer (Twitch/Kick)</option>
                  <option value="SPORTSBOOK">Sportsbook Operator</option>
                  <option value="INDIE_LABEL">Indie Music Label</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Paste Gmail Contacts (One per line, or Name, Email, Brand, IG)
                </label>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`creator1@gmail.com\nAlex Vane, alex@gmail.com, Vane Academy, PERSONAL_BRAND, @alexvane\npartner@betvanguard.co.uk`}
                  className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none font-mono text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" />
                <span>Import Bulk Gmail Contacts</span>
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

