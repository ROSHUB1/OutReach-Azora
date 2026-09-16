import React, { useState } from 'react';
import { EmailTemplate, LeadCategory } from '../types';
import { motion } from 'motion/react';
import { X, Save, FileText, Sparkles, Radio, Trophy, Disc } from 'lucide-react';

interface TemplateEditorModalProps {
  templates: EmailTemplate[];
  onClose: () => void;
  onSaveTemplate: (updated: EmailTemplate) => void;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  templates,
  onClose,
  onSaveTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LeadCategory>('PERSONAL_BRAND');
  
  const currentTemplate = templates.find((t) => t.category === selectedCategory) || templates[0];

  const [subjectTemplate, setSubjectTemplate] = useState(currentTemplate?.subjectTemplate || '');
  const [bodyTemplate, setBodyTemplate] = useState(currentTemplate?.bodyTemplate || '');
  const [dmTemplate, setDmTemplate] = useState(currentTemplate?.dmTemplate || '');

  const handleCategoryChange = (cat: LeadCategory) => {
    setSelectedCategory(cat);
    const tpl = templates.find((t) => t.category === cat);
    if (tpl) {
      setSubjectTemplate(tpl.subjectTemplate);
      setBodyTemplate(tpl.bodyTemplate);
      setDmTemplate(tpl.dmTemplate);
    }
  };

  const handleSave = () => {
    onSaveTemplate({
      ...currentTemplate,
      category: selectedCategory,
      subjectTemplate,
      bodyTemplate,
      dmTemplate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-white/10 bg-[#12141c]/95 backdrop-blur-md text-zinc-200 shadow-2xl overflow-hidden font-mono"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4 font-sans">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Outreach Template Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1 border-b border-white/10 bg-black/40 p-2 font-sans">
          {[
            { key: 'PERSONAL_BRAND', label: 'Personal Brands', icon: <Sparkles className="h-3.5 w-3.5 text-amber-400" /> },
            { key: 'STREAMER', label: 'Streamers', icon: <Radio className="h-3.5 w-3.5 text-purple-400" /> },
            { key: 'SPORTSBOOK', label: 'Sportsbooks', icon: <Trophy className="h-3.5 w-3.5 text-emerald-400" /> },
            { key: 'INDIE_LABEL', label: 'Indie Labels', icon: <Disc className="h-3.5 w-3.5 text-cyan-400" /> },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key as LeadCategory)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all text-xs ${
                selectedCategory === cat.key
                  ? 'bg-white/10 text-white font-bold border border-white/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.icon}
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Template Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
          <div className="rounded-lg bg-white/5 p-3 border border-white/10 text-[11px] text-zinc-400 backdrop-blur-sm">
            Available Dynamic Variables:{' '}
            <code className="text-amber-300 font-mono">{"{name}"}</code>,{' '}
            <code className="text-amber-300 font-mono">{"{companyOrBrand}"}</code>,{' '}
            <code className="text-amber-300 font-mono">{"{monetizationOffer}"}</code>,{' '}
            <code className="text-amber-300 font-mono">{"{streamingPlatform}"}</code>,{' '}
            <code className="text-amber-300 font-mono">{"{instagramHandle}"}</code>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
              Subject Line Template:
            </label>
            <input
              type="text"
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-indigo-500 focus:outline-none font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
              Gmail Body Template:
            </label>
            <textarea
              rows={7}
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-zinc-200 focus:border-indigo-500 focus:outline-none leading-relaxed font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-pink-300 font-semibold uppercase text-[10px] tracking-wider">
              Instagram DM Template:
            </label>
            <textarea
              rows={3}
              value={dmTemplate}
              onChange={(e) => setDmTemplate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-pink-200 focus:border-indigo-500 focus:outline-none font-mono text-xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-black/40 p-4 flex justify-end font-sans">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 text-xs"
          >
            <Save className="h-4 w-4" />
            <span>Save Template</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
